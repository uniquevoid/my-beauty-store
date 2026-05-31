import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MessageCircle, X } from 'lucide-react';
import { fetchChatStatus, sendChatMessage, type ChatHistoryMessage } from '../../api/chat';
import { useBranding } from '../../contexts/BrandingContext';
import { resolveTenantSlug } from '../../tenant/resolveTenantSlug';
import ChatInput from './ChatInput';
import ChatMessageList, { type ChatMessage } from './ChatMessageList';

const WELCOME_MESSAGE =
  'Hi! Ask me about **open roles**, **applying**, or **our culture**.';
const MAX_HISTORY_TURNS = 10;

function storageKey(): string {
  const slug = resolveTenantSlug() ?? 'default';
  return `career-chat:${slug}`;
}

function loadStoredMessages(): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = sessionStorage.getItem(storageKey());
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveStoredMessages(messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(storageKey(), JSON.stringify(messages));
  } catch {
    // ignore quota / private mode
  }
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export default function CareerChatWidget() {
  const { tenantName, loading: brandingLoading } = useBranding();
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadStoredMessages());
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const fabRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const status = await fetchChatStatus();
        if (!cancelled) setEnabled(status.enabled);
      } catch {
        if (!cancelled) setEnabled(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    saveStoredMessages(messages);
  }, [messages]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        fabRef.current?.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const openPanel = useCallback(() => {
    setOpen(true);
    setError(null);
    setMessages((current) => {
      if (current.length > 0) return current;
      return [{ id: 'welcome', role: 'assistant', content: WELCOME_MESSAGE }];
    });
  }, []);

  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    const userMessage: ChatMessage = { id: makeId(), role: 'user', content: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput('');
    setSending(true);
    setError(null);

    const history: ChatHistoryMessage[] = nextMessages
      .filter((m) => m.id !== 'welcome')
      .slice(-MAX_HISTORY_TURNS)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      const { reply } = await sendChatMessage(trimmed, history.slice(0, -1));
      setMessages((current) => [...current, { id: makeId(), role: 'assistant', content: reply }]);
    } catch {
      setError('Assistant is temporarily unavailable.');
    } finally {
      setSending(false);
    }
  }, [input, messages, sending]);

  if (brandingLoading || enabled === false || enabled === null) {
    return null;
  }

  return (
    <>
      <button
        ref={fabRef}
        type="button"
        onClick={openPanel}
        aria-label="Open career assistant"
        aria-expanded={open}
        className="fixed bottom-6 right-6 z-[60] flex h-14 w-14 items-center justify-center rounded-full bg-brand-primary text-brand-primary-foreground shadow-lg transition-transform hover:scale-105 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2"
      >
        <MessageCircle className="h-6 w-6" aria-hidden="true" />
      </button>

      {open
        ? createPortal(
            <div className="fixed inset-0 z-[60] flex items-end justify-end p-0 sm:p-6">
              <button
                type="button"
                className="absolute inset-0 bg-black/30 sm:bg-black/20"
                aria-label="Close career assistant"
                onClick={() => {
                  setOpen(false);
                  fabRef.current?.focus();
                }}
              />
              <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="career-chat-title"
                className="relative flex h-[min(560px,100dvh)] w-full max-w-[380px] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:h-[min(520px,calc(100dvh-3rem))] sm:rounded-2xl"
              >
                <header className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
                  <div className="min-w-0 pr-2">
                    <h2 id="career-chat-title" className="text-base font-semibold text-brand-text">
                      Career Assistant
                    </h2>
                    <p className="truncate text-xs text-gray-500">{tenantName}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      fabRef.current?.focus();
                    }}
                    aria-label="Close chat"
                    className="shrink-0 rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-brand-text"
                  >
                    <X className="h-5 w-5" aria-hidden="true" />
                  </button>
                </header>

                <ChatMessageList messages={messages} loading={sending} />

                {error ? (
                  <p className="px-4 pb-2 text-xs text-red-600" role="alert">
                    {error}
                  </p>
                ) : null}

                <ChatInput value={input} onChange={setInput} onSend={handleSend} disabled={sending} />
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
