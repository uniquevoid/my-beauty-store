import { Logger } from '@nestjs/common';
import { GoogleGenerativeAI, type GenerationConfig } from '@google/generative-ai';

export const GEMINI_MODEL_HIERARCHY = [
  'gemini-3.1-flash',
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.5-flash-tts',
] as const;

export type GeminiModelName = (typeof GEMINI_MODEL_HIERARCHY)[number];

const defaultLogger = new Logger('GeminiClient');

export function getGeminiModelHierarchy(): readonly GeminiModelName[] {
  return [...GEMINI_MODEL_HIERARCHY];
}

export function createGeminiClient(): GoogleGenerativeAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error('GEMINI_API_KEY is missing from environment variables.');
  return new GoogleGenerativeAI(apiKey);
}

function isRetryableGeminiError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return /503|429|high demand|unavailable|timeout/i.test(msg);
}

export type GenerateContentWithFallbackOptions = {
  prompt: string;
  generationConfig?: GenerationConfig;
  client?: GoogleGenerativeAI;
  logger?: Logger;
};

export async function generateContentWithFallback(
  options: GenerateContentWithFallbackOptions,
): Promise<string> {
  const { prompt, generationConfig, client = createGeminiClient(), logger = defaultLogger } = options;
  let lastError: unknown;

  for (const modelName of getGeminiModelHierarchy()) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const model = client.getGenerativeModel({
          model: modelName,
          generationConfig,
        });
        const result = await model.generateContent(prompt);
        return (result.response.text() ?? '').trim();
      } catch (error) {
        lastError = error;
        if (!isRetryableGeminiError(error) || attempt === 2) break;
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
      }
    }
    logger.warn(
      `Gemini model ${modelName} failed: ${lastError instanceof Error ? lastError.message : lastError}`,
    );
  }

  throw lastError ?? new Error('All Gemini models failed.');
}

export type GenerateJsonWithFallbackOptions = Omit<GenerateContentWithFallbackOptions, 'generationConfig'> & {
  generationConfig?: GenerationConfig;
};

export async function generateJsonWithFallback(
  prompt: string,
  options?: Omit<GenerateJsonWithFallbackOptions, 'prompt'>,
): Promise<string> {
  return generateContentWithFallback({
    ...options,
    prompt,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: 'application/json',
      ...options?.generationConfig,
    },
  });
}
