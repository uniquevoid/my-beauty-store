import { useRef, type FormEvent, type KeyboardEvent } from 'react';
import { Send } from 'lucide-react';

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
};

export default function ChatInput({
  value,
  onChange,
  onSend,
  disabled = false,
  placeholder = 'Ask about jobs or applying…',
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!disabled && value.trim()) onSend();
    }
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!disabled && value.trim()) onSend();
  }

  return (
    <form onSubmit={handleSubmit} className="border-t border-gray-200 px-4 py-3">
      <div className="flex items-end gap-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={2}
          maxLength={500}
          placeholder={placeholder}
          aria-label="Chat message"
          className="min-h-[44px] max-h-28 flex-1 resize-none rounded-xl border border-gray-200 px-3 py-2 text-sm text-brand-text placeholder:text-gray-400 focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={disabled || !value.trim()}
          aria-label="Send message"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-primary text-brand-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </form>
  );
}
