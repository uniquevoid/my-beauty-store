import { http } from './http';

export type ChatHistoryMessage = {
  role: 'user' | 'assistant';
  content: string;
};

export async function fetchChatStatus(): Promise<{ enabled: boolean }> {
  const res = await http.get<{ enabled: boolean }>('/chat/status');
  return res.data;
}

export async function sendChatMessage(
  message: string,
  history: ChatHistoryMessage[],
): Promise<{ reply: string }> {
  const res = await http.post<{ reply: string }>('/chat/message', { message, history });
  return res.data;
}
