export type ParsedChatResponse = {
  reply: string;
  chatsheet: string;
};

export type ParseValidationResult =
  | { ok: true; parsed: ParsedChatResponse }
  | { ok: false; reason: string };

const CHATSHEET_MARKER = '[Chatsheet]';
const MAX_REPLY_CHARS = 300;
const MAX_CHATSHEET_CHARS = 100;

function hasSummaryOrConclusion(reply: string): boolean {
  return /\*\*(Summary|Conclusion):\*\*/i.test(reply);
}

export function parseChatResponse(raw: string): ParseValidationResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, reason: 'empty response' };
  }

  const markerIndex = trimmed.indexOf(CHATSHEET_MARKER);
  if (markerIndex < 0) {
    return { ok: false, reason: 'missing [Chatsheet] marker' };
  }

  const reply = trimmed.slice(0, markerIndex).trim();
  const chatsheet = trimmed
    .slice(markerIndex + CHATSHEET_MARKER.length)
    .trim()
    .replace(/^\s*[-:]\s*/, '');

  if (!reply) {
    return { ok: false, reason: 'empty reply body' };
  }
  if (reply.length > MAX_REPLY_CHARS) {
    return { ok: false, reason: `reply exceeds ${MAX_REPLY_CHARS} characters` };
  }
  if (!chatsheet) {
    return { ok: false, reason: 'empty chatsheet' };
  }
  if (chatsheet.length > MAX_CHATSHEET_CHARS) {
    return { ok: false, reason: `chatsheet exceeds ${MAX_CHATSHEET_CHARS} characters` };
  }
  if (!hasSummaryOrConclusion(reply)) {
    return { ok: false, reason: 'reply missing **Summary:** or **Conclusion:** section' };
  }

  return { ok: true, parsed: { reply, chatsheet } };
}

export function parseChatResponseOrThrow(raw: string): ParsedChatResponse {
  const result = parseChatResponse(raw);
  if (!result.ok) {
    throw new Error(result.reason);
  }
  return result.parsed;
}
