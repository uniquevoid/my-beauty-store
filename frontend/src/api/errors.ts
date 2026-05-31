import axios from 'axios';

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string | string[] } | undefined;
    if (Array.isArray(data?.message)) return data.message.join(', ');
    if (typeof data?.message === 'string' && data.message.length > 0) return data.message;
    if (error.response?.status === 429) {
      return 'The AI service is temporarily rate-limited. Please wait a minute and try again.';
    }
    if (error.response?.status === 500) {
      return 'Something went wrong while processing your resume. Please try again.';
    }
  }

  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
