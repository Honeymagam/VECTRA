import { useEffect, useRef, useState } from 'react';
import { Bot, Send, User, X } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { api } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  error?: boolean;
}

const STARTER_QUESTIONS = [
  'Explain permutations vs combinations with an example.',
  'How do I solve time and work problems quickly?',
  'What is the difference between simple and compound interest?',
  'Walk me through solving a seating arrangement puzzle.',
  'How do I approach blood relation questions?',
  'Explain the concept of probability with a dice example.',
];

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
        <Bot className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="rounded-2xl rounded-bl-sm border border-neutral-200/80 bg-white px-4 py-3 shadow-card">
        <span className="flex gap-1" aria-label="Thinking…">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-2 w-2 rounded-full bg-primary-400"
              style={{ animation: `bounce 1.2s ${i * 0.2}s infinite` }}
            />
          ))}
        </span>
      </div>
    </div>
  );
}

function AssistantBubble({ message }: { message: Message }) {
  return (
    <div className="flex items-end gap-3 animate-fade-in">
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
        <Bot className="h-4 w-4" aria-hidden="true" />
      </span>
      <div className="max-w-[75%] space-y-2">
        <div
          className={`rounded-2xl rounded-bl-sm border px-4 py-3 text-sm leading-relaxed shadow-card ${
            message.error
              ? 'border-error-200 bg-error-50 text-error-700'
              : 'border-neutral-200/80 bg-white text-navy-800'
          }`}
        >
          {message.content.split('\n').map((line, i) => (
            <p key={i} className={i > 0 ? 'mt-2' : ''}>
              {line}
            </p>
          ))}
        </div>
        {message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pl-1">
            {message.sources.map((src) => (
              <span
                key={src}
                className="rounded-full bg-accent-50 px-2.5 py-0.5 text-xs font-medium text-accent-700"
              >
                {src}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UserBubble({ message }: { message: Message }) {
  return (
    <div className="flex items-end justify-end gap-3 animate-fade-in">
      <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-navy-800 px-4 py-3 text-sm leading-relaxed text-white shadow-md">
        {message.content.split('\n').map((line, i) => (
          <p key={i} className={i > 0 ? 'mt-2' : ''}>
            {line}
          </p>
        ))}
      </div>
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-navy-100 text-navy-600">
        <User className="h-4 w-4" aria-hidden="true" />
      </span>
    </div>
  );
}

export default function AITutorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.title = 'AI Tutor | VECTRA';
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = { role: 'user', content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsLoading(true);

    try {
      const result = await api<{ answer: string; sources: Array<{ filename?: string; topic?: string }> }>('/tutor/chat', {
        method: 'POST', body: JSON.stringify({ message: trimmed }),
      });
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: result?.answer ?? 'I could not generate a response. Please try again.',
          sources: result.sources.map((source) => source.filename ?? source.topic ?? 'Learning material'),
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'Sorry, I encountered an error while processing your question. Please check your connection and try again.',
          error: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage(inputValue);
    }
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col">
      <PageHeader
        eyebrow="Learning Intelligence"
        title="AI Tutor"
        description="Ask any aptitude or reasoning question and get step-by-step explanations."
        actions={
          messages.length > 0 ? (
            <button
              type="button"
              onClick={() => setMessages([])}
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-700 shadow-card transition-colors hover:bg-neutral-50"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Clear chat
            </button>
          ) : undefined
        }
      />

      {/* Chat area */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-50 shadow-card">
        {isEmpty ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-8 p-8 animate-fade-in">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-primary-600">
              <Bot className="h-8 w-8" aria-hidden="true" />
            </div>
            <div className="text-center">
              <h2 className="text-lg font-semibold text-navy-900">
                What would you like to learn today?
              </h2>
              <p className="mt-1 text-sm text-navy-500">
                Ask me anything about aptitude, reasoning, or verbal ability.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {STARTER_QUESTIONS.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => void sendMessage(q)}
                  className="rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-navy-700 shadow-card transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-6">
            {messages.map((msg, i) =>
              msg.role === 'user' ? (
                <UserBubble key={i} message={msg} />
              ) : (
                <AssistantBubble key={i} message={msg} />
              ),
            )}
            {isLoading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}

        {/* Input bar */}
        <div className="border-t border-neutral-200/80 bg-white p-4">
          <div className="flex items-end gap-3">
            <textarea
              ref={textareaRef}
              value={inputValue}
              rows={1}
              placeholder="Ask a question… (Enter to send, Shift+Enter for new line)"
              className="flex-1 resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-navy-900 placeholder-navy-400 shadow-inner transition-colors focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400/20"
              onChange={(e) => {
                setInputValue(e.target.value);
                autoResize();
              }}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              aria-label="Message input"
            />
            <button
              type="button"
              onClick={() => void sendMessage(inputValue)}
              disabled={isLoading || !inputValue.trim()}
              className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-md shadow-primary-600/20 transition-all hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-md"
              aria-label="Send message"
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <p className="mt-2 text-center text-xs text-navy-400">
            AI responses may contain errors. Always verify important information.
          </p>
        </div>
      </div>

      {/* Keyframe for the typing dots */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.6; }
          40% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
