import { Logger } from '@nestjs/common';
import {
  GEMINI_MODEL_HIERARCHY,
  generateContentWithFallback,
  generateJsonWithFallback,
  getGeminiModelHierarchy,
} from './gemini-client';

const mockGenerateContent = jest.fn();
const mockGetGenerativeModel = jest.fn(() => ({
  generateContent: mockGenerateContent,
}));

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn(() => ({
    getGenerativeModel: mockGetGenerativeModel,
  })),
}));

describe('gemini-client', () => {
  const originalApiKey = process.env.GEMINI_API_KEY;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-key';
    mockGenerateContent.mockReset();
    mockGetGenerativeModel.mockClear();
    mockGetGenerativeModel.mockImplementation(() => ({
      generateContent: mockGenerateContent,
    }));
  });

  afterAll(() => {
    process.env.GEMINI_API_KEY = originalApiKey;
  });

  it('returns the fixed model hierarchy in order', () => {
    expect(getGeminiModelHierarchy()).toEqual([...GEMINI_MODEL_HIERARCHY]);
    expect(getGeminiModelHierarchy()).toEqual([
      'gemini-3.1-flash',
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.5-flash-tts',
    ]);
  });

  it('falls back to the next model when the first fails', async () => {
    mockGenerateContent
      .mockRejectedValueOnce(new Error('model not found'))
      .mockResolvedValueOnce({ response: { text: () => 'ok' } });

    const result = await generateContentWithFallback({ prompt: 'hello' });

    expect(result).toBe('ok');
    expect(mockGetGenerativeModel).toHaveBeenCalledTimes(2);
    expect(mockGetGenerativeModel.mock.calls[0][0].model).toBe('gemini-3.1-flash');
    expect(mockGetGenerativeModel.mock.calls[1][0].model).toBe('gemini-2.5-flash');
  });

  it('throws the last error when all models fail', async () => {
    const lastError = new Error('all models down');
    mockGenerateContent.mockRejectedValue(lastError);

    await expect(generateContentWithFallback({ prompt: 'hello' })).rejects.toThrow('all models down');
    expect(mockGetGenerativeModel).toHaveBeenCalledTimes(4);
    expect(mockGetGenerativeModel.mock.calls[3][0].model).toBe('gemini-2.5-flash-tts');
  });

  it('passes JSON generation config from generateJsonWithFallback', async () => {
    mockGenerateContent.mockResolvedValue({ response: { text: () => '{"ok":true}' } });

    const result = await generateJsonWithFallback('extract json');

    expect(result).toBe('{"ok":true}');
    expect(mockGetGenerativeModel).toHaveBeenCalledWith({
      model: 'gemini-3.1-flash',
      generationConfig: {
        temperature: 0.2,
        responseMimeType: 'application/json',
      },
    });
  });

  it('logs a warning for each failed model', async () => {
    mockGenerateContent.mockRejectedValue(new Error('hard failure'));
    const warn = jest.fn();
    const logger = { warn } as unknown as Logger;

    await expect(
      generateContentWithFallback({ prompt: 'hello', logger }),
    ).rejects.toThrow('hard failure');

    expect(warn).toHaveBeenCalledTimes(4);
    expect(warn.mock.calls[0][0]).toContain('gemini-3.1-flash');
    expect(warn.mock.calls[3][0]).toContain('gemini-2.5-flash-tts');
  });
});
