import { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Lightbulb, RefreshCw, Sparkles, XCircle } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatePanel from '@/components/ui/StatePanel';
import { api } from '@/lib/api';
import { PRACTICE_TOPICS, normalizeTopic, type PracticeTopic, type QuestionDifficulty } from '@/services/practice';

// ─── Types ───────────────────────────────────────────────────────────────────

interface RecentAttempt {
  id: string;
  is_correct: boolean;
  created_at: string;
  question: {
    question: string;
    topic: PracticeTopic;
    difficulty: QuestionDifficulty;
  } | null;
}

interface LoopStep {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
  iconBg: string;
  iconText: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const LOOP_STEPS: LoopStep[] = [
  {
    id: 'answer',
    label: 'Answer',
    description: 'You respond to an adaptive practice question drawn from your knowledge base.',
    icon: CheckCircle2,
    color: 'border-primary-200 bg-primary-50',
    iconBg: 'bg-primary-100',
    iconText: 'text-primary-700',
  },
  {
    id: 'analyse',
    label: 'Analyse',
    description: 'VECTRA evaluates correctness, identifies the concept, and diagnoses the error type.',
    icon: Sparkles,
    color: 'border-accent-200 bg-accent-50',
    iconBg: 'bg-accent-100',
    iconText: 'text-accent-700',
  },
  {
    id: 'update',
    label: 'Update',
    description: 'Your learner state is updated — topic weights, accuracy scores, and weak areas.',
    icon: RefreshCw,
    color: 'border-warning-200 bg-warning-50',
    iconBg: 'bg-warning-100',
    iconText: 'text-warning-700',
  },
  {
    id: 'recommend',
    label: 'Recommend',
    description: 'The next question, revision task, or concept explanation is chosen for you.',
    icon: Lightbulb,
    color: 'border-success-200 bg-success-50',
    iconBg: 'bg-success-100',
    iconText: 'text-success-700',
  },
];

const TOPIC_LABEL: Record<string, string> = Object.fromEntries(
  PRACTICE_TOPICS.map((t) => [t.id, t.label]),
);

function topicLabel(topic: string): string {
  return TOPIC_LABEL[topic] ?? topic;
}

function truncate(text: string, maxLen = 70): string {
  return text.length > maxLen ? `${text.slice(0, maxLen)}…` : text;
}

function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function countThisWeek(attempts: RecentAttempt[]): number {
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  return attempts.filter((a) => new Date(a.created_at) >= weekAgo).length;
}

// ─── View State ───────────────────────────────────────────────────────────────

type PageView =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'empty' }
  | { kind: 'ready'; attempts: RecentAttempt[]; weeklyCount: number };

// ─── Page ────────────────────────────────────────────────────────────────────

export default function FeedbackLoopPage() {
  const [view, setView] = useState<PageView>({ kind: 'loading' });

  useEffect(() => {
    document.title = 'Cognitive Feedback Loop | VECTRA';
  }, []);

  useEffect(() => {
    let cancelled = false;

    api<{ practice_rows: RecentAttempt[] }>('/analytics/activity')
      .then(({ practice_rows }) => {
        if (cancelled) return;
        const rows = practice_rows.slice(0, 10).map((row) => ({ ...row, question: row.question ? { ...row.question, topic: normalizeTopic(row.question.topic) } : null }));
        if (rows.length === 0) { setView({ kind: 'empty' }); return; }
        setView({ kind: 'ready', attempts: rows, weeklyCount: countThisWeek(rows) });
      })
      .catch(() => { if (!cancelled) setView({ kind: 'error' }); });

    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Learning Intelligence"
        title="Cognitive Feedback Loop"
        description="Every answer you give drives a continuous cycle of analysis, state updates, and personalised recommendations."
      />

      {view.kind === 'loading' && (
        <StatePanel variant="loading" title="Loading loop activity" message="Fetching your recent practice history." />
      )}

      {view.kind === 'error' && (
        <StatePanel variant="error" title="Could not load loop activity" message="Check your connection and refresh the page." />
      )}

      {view.kind === 'empty' && (
        <StatePanel
          variant="empty"
          title="No loop activity yet"
          message="Complete a practice session and your feedback loop activity will appear here."
        />
      )}

      {view.kind === 'ready' && <FeedbackLoopContent attempts={view.attempts} weeklyCount={view.weeklyCount} />}
    </>
  );
}

// ─── Content ─────────────────────────────────────────────────────────────────

interface FeedbackLoopContentProps {
  attempts: RecentAttempt[];
  weeklyCount: number;
}

function FeedbackLoopContent({ attempts, weeklyCount }: FeedbackLoopContentProps) {
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Loop Diagram */}
      <section className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-card">
        <h2 className="text-lg font-semibold text-navy-900">How the loop works</h2>
        <p className="mt-1 text-sm leading-relaxed text-navy-500">
          Four stages run automatically every time you submit an answer.
        </p>

        <div className="mt-8 flex flex-col items-stretch gap-4 sm:flex-row sm:items-start">
          {LOOP_STEPS.map((step, index) => {
            const Icon = step.icon;
            const isLast = index === LOOP_STEPS.length - 1;
            return (
              <div key={step.id} className="flex flex-1 flex-col sm:flex-row sm:items-start">
                {/* Card */}
                <div className={`flex flex-1 flex-col rounded-2xl border p-5 ${step.color}`}>
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${step.iconBg}`}>
                    <Icon className={`h-5 w-5 ${step.iconText}`} aria-hidden="true" />
                  </span>
                  <p className={`mt-3 text-sm font-bold ${step.iconText}`}>{step.label}</p>
                  <p className="mt-1 text-xs leading-relaxed text-navy-500">{step.description}</p>
                </div>

                {/* Arrow connector (not after last) */}
                {!isLast && (
                  <div className="flex items-center justify-center px-2 py-3 sm:py-5">
                    <ArrowRight className="h-5 w-5 text-neutral-300 sm:rotate-0 rotate-90" aria-hidden="true" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Weekly summary */}
      <div className="rounded-2xl border border-primary-100 bg-primary-50/60 px-6 py-4 shadow-card">
        <p className="text-sm font-semibold text-primary-800">
          <span className="text-2xl font-bold tabular-nums">{weeklyCount}</span>
          {' '}
          {weeklyCount === 1 ? 'answer' : 'answers'} processed through the loop this week
        </p>
        <p className="mt-0.5 text-xs text-primary-600">Rolling 7-day window</p>
      </div>

      {/* Recent activity table */}
      <section className="rounded-2xl border border-neutral-200/80 bg-white shadow-card">
        <div className="border-b border-neutral-100 px-6 py-4">
          <h2 className="text-base font-semibold text-navy-900">Recent loop activity</h2>
          <p className="mt-0.5 text-xs text-navy-400">Last 10 practice attempts</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-100 text-left text-xs font-semibold uppercase tracking-wider text-navy-400">
                <th className="px-6 py-3">Question</th>
                <th className="px-4 py-3">Topic</th>
                <th className="px-4 py-3">Difficulty</th>
                <th className="px-4 py-3">Result</th>
                <th className="px-4 py-3 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {attempts.map((attempt) => (
                <tr key={attempt.id} className="transition-colors hover:bg-neutral-50/50">
                  <td className="max-w-xs px-6 py-3.5 text-navy-700">
                    {attempt.question ? truncate(attempt.question.question) : <span className="text-navy-400 italic">Question removed</span>}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-navy-600">
                    {attempt.question ? topicLabel(attempt.question.topic) : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    {attempt.question ? (
                      <DifficultyBadge difficulty={attempt.question.difficulty} />
                    ) : '—'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5">
                    {attempt.is_correct ? (
                      <span className="inline-flex items-center gap-1 text-success-700">
                        <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                        Correct
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-error-600">
                        <XCircle className="h-4 w-4" aria-hidden="true" />
                        Incorrect
                      </span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-right text-navy-400">
                    {formatTimestamp(attempt.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function DifficultyBadge({ difficulty }: { difficulty: string }) {
  const styles: Record<string, string> = {
    easy: 'bg-success-50 text-success-700',
    medium: 'bg-warning-50 text-warning-700',
    hard: 'bg-error-50 text-error-700',
  };
  return (
    <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${styles[difficulty] ?? 'bg-neutral-100 text-navy-600'}`}>
      {difficulty}
    </span>
  );
}
