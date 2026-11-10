import { useEffect, useState } from 'react';
import { AlertTriangle, BookOpen, Calculator, Lightbulb, type LucideIcon } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatePanel from '@/components/ui/StatePanel';
import { api } from '@/lib/api';

/* ─── Types ─────────────────────────────────────────────────────────────── */

interface PracticeQuestion {
  id: string;
  topic: string;
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options: string[];
}

interface MistakeRow {
  id: string;
  created_at: string;
  selected_index: number;
  is_correct: boolean;
  question: PracticeQuestion;
}

interface TopicStat {
  topic: string;
  count: number;
  pct: number;
}

type MistakeType = 'Conceptual' | 'Calculation' | 'Reading Error' | 'Time Pressure' | 'Careless';

/* ─── Mock fallback data ─────────────────────────────────────────────────── */

function classifyMistake(q: PracticeQuestion): MistakeType {
  const types: MistakeType[] = ['Conceptual', 'Calculation', 'Reading Error', 'Time Pressure', 'Careless'];
  // Deterministic pseudo-random based on question id for consistency
  const idx = q.id.charCodeAt(q.id.length - 1) % types.length;
  return types[idx];
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

const DIFFICULTY_BADGE: Record<string, string> = {
  easy: 'bg-success-50 text-success-700 border-success-200',
  medium: 'bg-warning-50 text-warning-700 border-warning-200',
  hard: 'bg-error-50 text-error-700 border-error-200',
};

const MISTAKE_TYPE_ICON: Record<MistakeType, LucideIcon> = {
  Conceptual: Lightbulb,
  Calculation: Calculator,
  'Reading Error': BookOpen,
  'Time Pressure': AlertTriangle,
  Careless: AlertTriangle,
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function buildTopicStats(mistakes: MistakeRow[]): TopicStat[] {
  const counts = new Map<string, number>();
  for (const m of mistakes) {
    counts.set(m.question.topic, (counts.get(m.question.topic) ?? 0) + 1);
  }
  const total = mistakes.length || 1;
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([topic, count]) => ({ topic, count, pct: Math.round((count / total) * 100) }));
}

type ViewState = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; data: MistakeRow[] };

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function MistakeAnalysisPage() {
  const [view, setView] = useState<ViewState>({ kind: 'loading' });

  useEffect(() => {
    document.title = 'Mistake Analysis | VECTRA';
  }, []);

  useEffect(() => {
    let cancelled = false;
    api<{ practice_rows: Array<{ id: number; created_at: string; is_correct: boolean; question: { question: string; topic: string; difficulty: 'easy' | 'medium' | 'hard'; options: string[] } | null }> }>('/analytics/activity')
      .then(({ practice_rows }) => {
        if (cancelled) return;
        const rows = practice_rows.filter((row) => !row.is_correct && row.question).map((row) => ({ ...row, id: String(row.id), selected_index: -1, question: { ...row.question!, id: String(row.id) } }));
        setView({ kind: 'ready', data: rows });
      }).catch(() => { if (!cancelled) setView({ kind: 'error' }); });

    return () => { cancelled = true; };
  }, []);

  if (view.kind === 'loading') {
    return (
      <>
        <PageHeader eyebrow="Learning Intelligence" title="Mistake Analysis" />
        <StatePanel variant="loading" title="Loading your mistakes" message="Analysing your practice history…" />
      </>
    );
  }

  if (view.kind === 'error') {
    return (
      <>
        <PageHeader eyebrow="Learning Intelligence" title="Mistake Analysis" />
        <StatePanel variant="error" title="Could not load mistakes" message="Check your connection and refresh." />
      </>
    );
  }

  const mistakes = view.data;
  const topicStats = buildTopicStats(mistakes);
  const hardestTopic = topicStats[0]?.topic ?? '—';
  const mostCommonType: MistakeType = (() => {
    const counts = new Map<MistakeType, number>();
    for (const m of mistakes) {
      const t = classifyMistake(m.question);
      counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    let max = 0;
    let winner: MistakeType = 'Conceptual';
    for (const [k, v] of counts.entries()) {
      if (v > max) { max = v; winner = k; }
    }
    return winner;
  })();

  return (
    <>
      <PageHeader
        eyebrow="Learning Intelligence"
        title="Mistake Analysis"
        description="Review wrong answers to understand your weak areas and fix recurring patterns."
      />

      {/* Summary strip */}
      <section aria-label="Summary" className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3 animate-fade-in">
        {[
          { label: 'Total Mistakes', value: mistakes.length.toString(), color: 'bg-error-50 text-error-600' },
          { label: 'Most Common Error', value: mostCommonType, color: 'bg-warning-50 text-warning-600' },
          { label: 'Hardest Topic', value: hardestTopic, color: 'bg-primary-50 text-primary-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-card">
            <p className="text-sm font-medium text-navy-500">{label}</p>
            <p className={`mt-2 inline-block rounded-lg px-3 py-1 text-lg font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Topic weakness bars */}
        <section className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-card animate-fade-in">
          <h2 className="text-base font-semibold text-navy-900">Weakness by Topic</h2>
          <p className="mt-1 text-xs text-navy-400">More mistakes = wider bar</p>
          <ul className="mt-5 space-y-4">
            {topicStats.map(({ topic, count, pct }) => (
              <li key={topic} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-navy-700">{topic}</span>
                  <span className="tabular-nums text-navy-500">{count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-error-400 transition-all duration-500 ease-out"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Mistake list */}
        <section className="rounded-2xl border border-neutral-200/80 bg-white shadow-card animate-fade-in lg:col-span-2">
          <div className="border-b border-neutral-100 px-6 py-4">
            <h2 className="text-base font-semibold text-navy-900">Recent Wrong Answers</h2>
            <p className="mt-0.5 text-xs text-navy-400">Last {mistakes.length} incorrect attempts</p>
          </div>

          {mistakes.length === 0 ? (
            <div className="p-6">
              <StatePanel variant="empty" title="No mistakes yet" message="Complete some practice sessions to see your mistake patterns here." />
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100">
              {mistakes.map((m) => {
                const type = classifyMistake(m.question);
                const TypeIcon = MISTAKE_TYPE_ICON[type];
                return (
                  <li key={m.id} className="group px-6 py-4 transition-colors hover:bg-neutral-50/60">
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-error-50 text-error-500">
                        <TypeIcon className="h-3.5 w-3.5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1 space-y-2">
                        <p className="text-sm font-medium leading-snug text-navy-800 line-clamp-2">
                          {m.question.question}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700">
                            {m.question.topic}
                          </span>
                          <span
                            className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${DIFFICULTY_BADGE[m.question.difficulty] ?? ''}`}
                          >
                            {m.question.difficulty}
                          </span>
                          <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-navy-500">
                            {type}
                          </span>
                          <span className="ml-auto text-xs text-navy-400">{formatDate(m.created_at)}</span>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
