import {
  BadRequestException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { AiService, type ChatHistoryMessage } from '../ai/ai.service';
import { JobsService } from '../jobs/jobs.service';
import type { TenantContext } from '../tenants/tenant.types';
import {
  buildCareerChatContext,
  serializeCareerChatContext,
} from './chat-context.builder';
import {
  CORRECTION_NUDGE,
  FALLBACK_CHATSHEET,
  FALLBACK_REPLY,
  buildCareerAssistantSystemPrompt,
} from './career-assistant.prompt';
import { parseChatResponse, type ParsedChatResponse } from './chat-response.parser';

export type ChatMessageDto = {
  role: 'user' | 'assistant';
  content: string;
};

const MAX_MESSAGE_CHARS = 500;
const MAX_HISTORY_TURNS = 10;
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 20;

type RateLimitEntry = { count: number; windowStart: number };

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly rateLimits = new Map<string, RateLimitEntry>();

  constructor(
    private readonly ai: AiService,
    private readonly jobs: JobsService,
  ) {}

  isEnabled(): boolean {
    return Boolean(process.env.GEMINI_API_KEY?.trim());
  }

  private assertRateLimit(key: string): void {
    const now = Date.now();
    const entry = this.rateLimits.get(key);
    if (!entry || now - entry.windowStart >= RATE_LIMIT_WINDOW_MS) {
      this.rateLimits.set(key, { count: 1, windowStart: now });
      return;
    }
    if (entry.count >= RATE_LIMIT_MAX) {
      throw new ServiceUnavailableException('Too many chat requests. Please try again shortly.');
    }
    entry.count += 1;
  }

  private logChatsheet(tenantId: string, chatsheet: string): void {
    this.logger.log(
      JSON.stringify({ event: 'career_chat_chatsheet', tenantId, chatsheet, timestamp: new Date().toISOString() }),
    );
  }

  private normalizeHistory(history: ChatMessageDto[] | undefined): ChatHistoryMessage[] {
    if (!history?.length) return [];
    return history
      .slice(-MAX_HISTORY_TURNS)
      .filter(
        (m) =>
          (m.role === 'user' || m.role === 'assistant') &&
          typeof m.content === 'string' &&
          m.content.trim(),
      )
      .map((m) => ({ role: m.role, content: m.content.trim() }));
  }

  async sendMessage(
    tenant: TenantContext,
    message: string,
    history: ChatMessageDto[] | undefined,
    clientKey?: string,
  ): Promise<{ reply: string }> {
    if (!this.isEnabled()) {
      throw new ServiceUnavailableException('Career assistant is not available.');
    }

    const trimmed = message?.trim();
    if (!trimmed) {
      throw new BadRequestException('Message is required.');
    }
    if (trimmed.length > MAX_MESSAGE_CHARS) {
      throw new BadRequestException(`Message must be at most ${MAX_MESSAGE_CHARS} characters.`);
    }

    const rateKey = `${tenant.id}:${clientKey ?? 'anonymous'}`;
    this.assertRateLimit(rateKey);

    const publishedJobs = await this.jobs.listPublished(tenant.id);
    const context = buildCareerChatContext(tenant.name, tenant.branding_json, publishedJobs);
    const systemPrompt = buildCareerAssistantSystemPrompt(
      tenant.name,
      serializeCareerChatContext(context),
    );
    const normalizedHistory = this.normalizeHistory(history);

    let parsed: ParsedChatResponse;
    try {
      const raw = await this.ai.generateCareerAssistantReply(
        systemPrompt,
        trimmed,
        normalizedHistory,
      );
      const first = parseChatResponse(raw);
      if (first.ok) {
        parsed = first.parsed;
      } else {
        this.logger.warn(`Chat response validation failed (${first.reason}), retrying once.`);
        const retryRaw = await this.ai.generateCareerAssistantReply(
          systemPrompt,
          `${CORRECTION_NUDGE}\n\nUser message: ${trimmed}`,
          normalizedHistory,
        );
        const retry = parseChatResponse(retryRaw);
        if (retry.ok) {
          parsed = retry.parsed;
        } else {
          this.logger.warn(`Chat retry failed (${retry.reason}), using fallback.`);
          parsed = { reply: FALLBACK_REPLY, chatsheet: FALLBACK_CHATSHEET };
        }
      }
    } catch (error) {
      this.logger.error(
        `Career chat Gemini error: ${error instanceof Error ? error.message : error}`,
      );
      throw new ServiceUnavailableException('Career assistant is temporarily unavailable.');
    }

    this.logChatsheet(tenant.id, parsed.chatsheet);
    return { reply: parsed.reply };
  }
}
