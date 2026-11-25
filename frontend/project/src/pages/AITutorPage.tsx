import { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, MessageSquare, Plus, Send, User } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { api } from '@/lib/api';

interface Message {
  id?: number;
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  error?: boolean;
}

interface ConversationSummary {
  id: string;
  title: string;
  updated_at: string;
  preview: string;
}

interface ConversationDetail {
  id: string;
  title: string;
  messages: Array<{ id: number; role: 'user' | 'assistant'; content: string; sources?: Array<string | { filename?: string; topic?: string }> }>;
}

const ACTIVE_CONVERSATION_KEY = 'vectra.tutor.active_conversation';
const STARTER_QUESTIONS = [
  'Explain permutations vs combinations with an example.',
  'How do I solve time and work problems quickly?',
  'What is the difference between simple and compound interest?',
  'Walk me through solving a seating arrangement puzzle.',
  'How do I approach blood relation questions?',
  'Explain the concept of probability with a dice example.',
];

function sourceLabels(sources: Array<string | { filename?: string; topic?: string }> = []) {
  return sources.map((source) => typeof source === 'string' ? source : source.filename ?? source.topic ?? 'Learning material');
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600"><Bot className="h-4 w-4" aria-hidden="true" /></span>
      <div className="rounded-2xl rounded-bl-sm border border-neutral-200/80 bg-white px-4 py-3 shadow-card">
        <span className="flex gap-1" aria-label="Thinking…">{[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 rounded-full bg-primary-400" style={{ animation: `bounce 1.2s ${i * 0.2}s infinite` }} />)}</span>
      </div>
    </div>
  );
}

function AssistantBubble({ message }: { message: Message }) {
  return (
    <div className="flex items-end gap-3 animate-fade-in">
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600"><Bot className="h-4 w-4" aria-hidden="true" /></span>
      <div className="max-w-[75%] space-y-2">
        <div className={`rounded-2xl rounded-bl-sm border px-4 py-3 text-sm leading-relaxed shadow-card ${message.error ? 'border-error-200 bg-error-50 text-error-700' : 'border-neutral-200/80 bg-white text-navy-800'}`}>
          {message.content.split('\n').map((line, i) => <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>)}
        </div>
        {message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pl-1">{message.sources.map((src) => <span key={src} className="rounded-full bg-accent-50 px-2.5 py-0.5 text-xs font-medium text-accent-700">{src}</span>)}</div>
        )}
      </div>
    </div>
  );
}

function UserBubble({ message }: { message: Message }) {
  return (
    <div className="flex items-end justify-end gap-3 animate-fade-in">
      <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-navy-800 px-4 py-3 text-sm leading-relaxed text-white shadow-md">{message.content.split('\n').map((line, i) => <p key={i} className={i > 0 ? 'mt-2' : ''}>{line}</p>)}</div>
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-navy-100 text-navy-600"><User className="h-4 w-4" aria-hidden="true" /></span>
    </div>
  );
}

export default function AITutorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [historyError, setHistoryError] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const loadConversations = useCallback(async () => {
    const recent = await api<ConversationSummary[]>('/tutor/conversations');
    setConversations(recent);
    return recent;
  }, []);

  useEffect(() => {
    document.title = 'AI Tutor | VECTRA';
    let current = true;
    async function restore() {
      try {
        const recent = await loadConversations();
        if (!current) return;
        const savedId = localStorage.getItem(ACTIVE_CONVERSATION_KEY);
        if (savedId && recent.some((conversation) => conversation.id === savedId)) {
          const detail = await api<ConversationDetail>(`/tutor/conversations/${encodeURIComponent(savedId)}`);
          if (!current) return;
          setActiveConversationId(detail.id);
          setMessages(detail.messages.map((message) => ({ id: message.id, role: message.role, content: message.content, sources: sourceLabels(message.sources) })));
        } else {
          localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
        }
        setHistoryError(false);
      } catch {
        if (current) setHistoryError(true);
      } finally {
        if (current) setIsHistoryLoading(false);
      }
    }
    void restore();
    return () => { current = false; };
  }, [loadConversations]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isLoading]);

  function autoResize() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  function startNewChat() {
    if (isLoading) return;
    setActiveConversationId(null);
    setMessages([]);
    setInputValue('');
    localStorage.removeItem(ACTIVE_CONVERSATION_KEY);
  }

  async function openConversation(id: string) {
    if (isLoading || id === activeConversationId) return;
    setIsHistoryLoading(true);
    setHistoryError(false);
    try {
      const detail = await api<ConversationDetail>(`/tutor/conversations/${encodeURIComponent(id)}`);
      setActiveConversationId(detail.id);
      setMessages(detail.messages.map((message) => ({ id: message.id, role: message.role, content: message.content, sources: sourceLabels(message.sources) })));
      localStorage.setItem(ACTIVE_CONVERSATION_KEY, detail.id);
    } catch {
      setHistoryError(true);
    } finally {
      setIsHistoryLoading(false);
    }
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || isLoading) return;

    setMessages((prev) => [...prev, { role: 'user', content: trimmed }]);
    setInputValue('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsLoading(true);

    try {
      const result = await api<{ conversation_id: string; answer: string; sources: Array<{ filename?: string; topic?: string }> }>('/tutor/chat', {
        method: 'POST', body: JSON.stringify({ message: trimmed, conversation_id: activeConversationId }),
      });
      setActiveConversationId(result.conversation_id);
      localStorage.setItem(ACTIVE_CONVERSATION_KEY, result.conversation_id);
      setMessages((prev) => [...prev, { role: 'assistant', content: result.answer ?? 'I could not generate a response. Please try again.', sources: sourceLabels(result.sources ?? []) }]);
      await loadConversations();
      setHistoryError(false);
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error while processing your question. Please check your connection and try again.', error: true }]);
      void loadConversations().catch(() => setHistoryError(true));
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
  const activeTitle = conversations.find((conversation) => conversation.id === activeConversationId)?.title;

  return (
    <div className="flex h-[calc(100vh-9rem)] min-h-[32rem] flex-col">
      <PageHeader
        eyebrow="Learning Intelligence"
        title="AI Tutor"
        description={activeTitle ? `Continuing: ${activeTitle}` : 'Ask any aptitude or reasoning question and get step-by-step explanations.'}
        actions={<button type="button" onClick={startNewChat} disabled={isLoading} className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-700 shadow-card transition-colors hover:bg-neutral-50 disabled:opacity-50"><Plus className="h-4 w-4" aria-hidden="true" />New chat</button>}
      />

      <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-neutral-200/80 bg-neutral-50 shadow-card">
        <aside className="hidden w-64 flex-shrink-0 flex-col border-r border-neutral-200 bg-white md:flex" aria-label="Recent conversations">
          <div className="border-b border-neutral-100 px-4 py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-navy-800"><MessageSquare className="h-4 w-4 text-primary-600" aria-hidden="true" />Recents</div>
            <p className="mt-1 text-xs text-navy-400">Your saved tutor conversations</p>
          </div>
          <div className="flex-1 space-y-1 overflow-y-auto p-2">
            {isHistoryLoading && conversations.length === 0 && <p className="px-3 py-4 text-xs text-navy-400">Loading recents…</p>}
            {historyError && <p className="px-3 py-4 text-xs text-error-700">Conversation history could not be loaded.</p>}
            {!isHistoryLoading && conversations.length === 0 && !historyError && <p className="px-3 py-4 text-xs leading-relaxed text-navy-400">Your chats will appear here after you ask the tutor a question.</p>}
            {conversations.map((conversation) => (
              <button key={conversation.id} type="button" onClick={() => void openConversation(conversation.id)} disabled={isLoading || isHistoryLoading} aria-current={conversation.id === activeConversationId ? 'page' : undefined} className={`w-full rounded-xl px-3 py-2.5 text-left transition-colors disabled:opacity-60 ${conversation.id === activeConversationId ? 'bg-primary-50 text-primary-900' : 'text-navy-700 hover:bg-neutral-50'}`}>
                <span className="block truncate text-sm font-medium">{conversation.title}</span>
                <span className="mt-1 block truncate text-xs text-navy-400">{conversation.preview}</span>
              </button>
            ))}
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <div className="flex gap-2 overflow-x-auto border-b border-neutral-200 bg-white p-2 md:hidden" aria-label="Recent conversations">
            {conversations.slice(0, 8).map((conversation) => (
              <button key={conversation.id} type="button" onClick={() => void openConversation(conversation.id)} disabled={isLoading || isHistoryLoading} className={`max-w-48 flex-shrink-0 truncate rounded-lg px-3 py-2 text-xs font-medium ${conversation.id === activeConversationId ? 'bg-primary-50 text-primary-700' : 'bg-neutral-50 text-navy-600'}`}>{conversation.title}</button>
            ))}
          </div>
          {isHistoryLoading && messages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center text-sm text-navy-400">Restoring your current chat…</div>
          ) : isEmpty ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-8 overflow-y-auto p-8 animate-fade-in">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-100 text-primary-600"><Bot className="h-8 w-8" aria-hidden="true" /></div>
              <div className="text-center"><h2 className="text-lg font-semibold text-navy-900">What would you like to learn today?</h2><p className="mt-1 text-sm text-navy-500">Ask me anything about aptitude, reasoning, or verbal ability.</p></div>
              <div className="flex flex-wrap justify-center gap-2">{STARTER_QUESTIONS.map((q) => <button key={q} type="button" onClick={() => void sendMessage(q)} className="rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-sm font-medium text-navy-700 shadow-card transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700">{q}</button>)}</div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-6">
              {messages.map((msg, i) => msg.role === 'user' ? <UserBubble key={msg.id ?? `local-${i}`} message={msg} /> : <AssistantBubble key={msg.id ?? `local-${i}`} message={msg} />)}
              {isLoading && <TypingIndicator />}
              <div ref={bottomRef} />
            </div>
          )}

          <div className="border-t border-neutral-200/80 bg-white p-4">
            <div className="flex items-end gap-3">
              <textarea ref={textareaRef} value={inputValue} rows={1} placeholder="Ask a question… (Enter to send, Shift+Enter for new line)" className="flex-1 resize-none rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-navy-900 placeholder-navy-400 shadow-inner transition-colors focus:border-primary-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-400/20" onChange={(e) => { setInputValue(e.target.value); autoResize(); }} onKeyDown={handleKeyDown} disabled={isLoading || isHistoryLoading} aria-label="Message input" />
              <button type="button" onClick={() => void sendMessage(inputValue)} disabled={isLoading || isHistoryLoading || !inputValue.trim()} className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white shadow-md shadow-primary-600/20 transition-all hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-md" aria-label="Send message"><Send className="h-4 w-4" aria-hidden="true" /></button>
            </div>
            <p className="mt-2 text-center text-xs text-navy-400">AI responses may contain errors. Always verify important information.</p>
          </div>
        </section>
      </div>

      <style>{`@keyframes bounce { 0%, 80%, 100% { transform: translateY(0); opacity: 0.6; } 40% { transform: translateY(-6px); opacity: 1; } }`}</style>
    </div>
  );
}
