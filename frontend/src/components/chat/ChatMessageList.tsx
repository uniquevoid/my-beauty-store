import ChatMarkdown from './ChatMarkdown';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
};

type ChatMessageListProps = {
  messages: ChatMessage[];
  loading?: boolean;
};

export default function ChatMessageList({ messages, loading }: ChatMessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" aria-live="polite" aria-relevant="additions">
      {messages.map((message) => {
        const isUser = message.role === 'user';
        return (
          <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                isUser
                  ? 'bg-brand-primary text-brand-primary-foreground'
                  : 'bg-gray-100 text-brand-text'
              }`}
            >
              {isUser ? message.content : <ChatMarkdown content={message.content} />}
            </div>
          </div>
        );
      })}
      {loading ? (
        <div className="flex justify-start">
          <div className="rounded-2xl bg-gray-100 px-4 py-2.5 text-sm text-gray-500">Thinking…</div>
        </div>
      ) : null}
    </div>
  );
}
