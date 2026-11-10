import { useEffect, useState } from 'react';
import { CalendarDays, CheckCircle2, ClipboardList, Gauge } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatePanel from '@/components/ui/StatePanel';
import { api } from '@/lib/api';
import { PRACTICE_TOPICS, normalizeTopic, type PracticeTopic, type QuestionDifficulty } from '@/services/practice';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PracticeRow {
  is_correct: boolean;
  created_at: string;
  question: { topic: PracticeTopic; difficulty: QuestionDifficulty } | null;
}

interface MockRow {
  total_questions: number;
  correct_answers: number;
  duration_seconds: number;
  created_at: string;
}

interface DailyBucket {
  label: string; // e.g. "Mon"
  dateStr: string;
  total: number;
  correct: number;
  accuracy: number | null;
}

interface TopicStat {
  topicId: PracticeTopic;
  label: string;
  attempts: number;
  correct: number;
  accuracy: number | null;
}

interface DiffStat {
  difficulty: QuestionDifficulty;
  label: string;
  total: number;
  correct: number;
  accuracy: number | null;
  colorClass: string;
  bgClass: string;
}

interface AnalyticsData {
  practiceRows: PracticeRow[];
  mockRows: MockRow[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function pct(c: number, t: number): number | null {
  return t === 0 ? null : Math.round((c / t) * 100);
}

function buildWeeklyBuckets(rows: PracticeRow[]): DailyBucket[] {
  const buckets: DailyBucket[] = [];
  const today = new Date();
  for (let offset = 6; offset >= 0; offset--) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
    const dateStr = d.toDateString();
    const dayRows = rows.filter((r) => new Date(r.created_at).toDateString() === dateStr);
    const correct = dayRows.filter((r) => r.is_correct).length;
    const total = dayRows.length;
    buckets.push({ label: DAY_NAMES[d.getDay()], dateStr, total, correct, accuracy: pct(correct, total) });
  }
  return buckets;
}

function buildTopicStats(rows: PracticeRow[]): TopicStat[] {
  return PRACTICE_TOPICS.map((t) => {
    const topicRows = rows.filter((r) => r.question?.topic === t.id);
    const correct = topicRows.filter((r) => r.is_correct).length;
    return { topicId: t.id, label: t.label, attempts: topicRows.length, correct, accuracy: pct(correct, topicRows.length) };
  });
}

function buildDiffStats(rows: PracticeRow[]): DiffStat[] {
  const configs: { difficulty: QuestionDifficulty; label: string; colorClass: string; bgClass: string }[] = [
    { difficulty: 'easy', label: 'Easy', colorClass: 'bg-success-500', bgClass: 'bg-success-50 border-success-200' },
    { difficulty: 'medium', label: 'Medium', colorClass: 'bg-warning-500', bgClass: 'bg-warning-50 border-warning-200' },
    { difficulty: 'hard', label: 'Hard', colorClass: 'bg-error-500', bgClass: 'bg-error-50 border-error-200' },
  ];
  return configs.map(({ difficulty, label, colorClass, bgClass }) => {
    const diffRows = rows.filter((r) => r.question?.difficulty === difficulty);
    const correct = diffRows.filter((r) => r.is_correct).length;
    return { difficulty, label, total: diffRows.length, correct, accuracy: pct(correct, diffRows.length), colorClass, bgClass };
  });
}

function activeDaysThisMonth(practiceRows: PracticeRow[], mockRows: MockRow[]): number {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toDateString();
  const days = new Set<string>();
  for (const r of practiceRows) {
    const d = new Date(r.created_at);
    if (d >= new Date(monthStart)) days.add(d.toDateString());
  }
  for (const r of mockRows) {
    const d = new Date(r.created_at);
    if (d >= new Date(monthStart)) days.add(d.toDateString());
  }
  return days.size;
}

// ─── View State ───────────────────────────────────────────────────────────────

type PageView =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'empty' }
  | { kind: 'ready'; data: AnalyticsData };

// ─── Page ────────────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [view, setView] = useState<PageView>({ kind: 'loading' });

  useEffect(() => {
    document.title = 'Learning Analytics | VECTRA';
  }, []);

  useEffect(() => {
    let cancelled = false;

    api<{ practice_rows: PracticeRow[]; mock_rows: MockRow[] }>('/analytics/activity')
      .then(({ practice_rows, mock_rows }) => {
        if (cancelled) return;
        const practiceRows = practice_rows.map((row) => ({ ...row, question: row.question ? { ...row.question, topic: normalizeTopic(row.question.topic) } : null }));
        const mockRows = mock_rows;

        if (practiceRows.length === 0 && mockRows.length === 0) { setView({ kind: 'empty' }); return; }

        setView({ kind: 'ready', data: { practiceRows, mockRows } });
      })
      .catch(() => { if (!cancelled) setView({ kind: 'error' }); });

    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Insights"
        title="Learning Analytics"
        description="Trends in accuracy, topic performance and difficulty breakdown drawn from your complete practice history."
      />

      {view.kind === 'loading' && (
        <StatePanel variant="loading" title="Loading analytics" message="Crunching your performance data." />
      )}
      {view.kind === 'error' && (
        <StatePanel variant="error" title="Analytics could not be loaded" message="Check your connection and refresh the page." />
      )}
      {view.kind === 'empty' && (
        <StatePanel
          variant="empty"
          title="No analytics yet"
          message="Complete practice sessions and mock tests to see your learning analytics."
        />
      )}
      {view.kind === 'ready' && <AnalyticsContent data={view.data} />}
    </>
  );
}

// ─── Content ─────────────────────────────────────────────────────────────────

function AnalyticsContent({ data }: { data: AnalyticsData }) {
  const { practiceRows, mockRows } = data;

  const validRows = practiceRows.filter((r) => r.question !== null);
  const totalAnswers = validRows.length;
  const totalCorrect = validRows.filter((r) => r.is_correct).length;
  const overallAccuracy = pct(totalCorrect, totalAnswers);
  const mocksTaken = mockRows.length;
  const activeDays = activeDaysThisMonth(validRows, mockRows);

  const weeklyBuckets = buildWeeklyBuckets(validRows);
  const topicStats = buildTopicStats(validRows);
  const diffStats = buildDiffStats(validRows);

  const statCards = [
    { label: 'Total practice answers', value: String(totalAnswers), icon: ClipboardList, iconBg: 'bg-primary-50', iconText: 'text-primary-600' },
    { label: 'Overall accuracy', value: overallAccuracy === null ? '--' : `${overallAccuracy}%`, icon: CheckCircle2, iconBg: 'bg-success-50', iconText: 'text-success-600' },
    { label: 'Mock tests taken', value: String(mocksTaken), icon: Gauge, iconBg: 'bg-accent-50', iconText: 'text-accent-600' },
    { label: 'Active days this month', value: String(activeDays), icon: CalendarDays, iconBg: 'bg-warning-50', iconText: 'text-warning-700' },
  ];

  const maxTopicAcc = Math.max(...topicStats.map((t) => t.accuracy ?? 0), 1);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Stat cards */}
      <section aria-label="Key metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <article key={card.label} className="group rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-navy-500">{card.label}</p>
                <span className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors ${card.iconBg}`}>
                  <Icon className={`h-4 w-4 ${card.iconText}`} aria-hidden="true" />
                </span>
              </div>
              <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums text-navy-900">{card.value}</p>
            </article>
          );
        })}
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Weekly accuracy trend */}
        <section className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-card">
          <h2 className="text-base font-semibold text-navy-900">Weekly accuracy trend</h2>
          <p className="mt-0.5 text-xs text-navy-400">Last 7 days — % of answers correct per day</p>

          <div className="mt-6 space-y-3">
            {weeklyBuckets.map((bucket) => {
              const barWidth = bucket.accuracy === null ? 0 : (bucket.accuracy / 100) * 100;
              return (
                <div key={bucket.dateStr} className="flex items-center gap-3">
                  <span className="w-7 flex-shrink-0 text-right text-xs font-medium text-navy-500">{bucket.label}</span>
                  <div className="flex-1 overflow-hidden rounded-full bg-neutral-100 h-3">
                    <div
                      className="h-full rounded-full bg-primary-500 transition-all duration-500 ease-out"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <span className="w-10 flex-shrink-0 text-xs font-semibold tabular-nums text-navy-700">
                    {bucket.accuracy === null ? (bucket.total === 0 ? '—' : `${bucket.accuracy}%`) : `${bucket.accuracy}%`}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        {/* Topic performance */}
        <section className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-card">
          <h2 className="text-base font-semibold text-navy-900">Topic performance</h2>
          <p className="mt-0.5 text-xs text-navy-400">Accuracy per topic across all attempts</p>

          <div className="mt-6 space-y-4">
            {topicStats.map((stat) => {
              const barWidth = stat.accuracy === null ? 0 : (stat.accuracy / (maxTopicAcc || 100)) * 100;
              return (
                <div key={stat.topicId}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-navy-700">{stat.label}</span>
                    <span className="text-xs font-semibold tabular-nums text-navy-900">
                      {stat.accuracy === null ? (stat.attempts === 0 ? 'No data' : 'Need more data') : `${stat.accuracy}%`}
                    </span>
                  </div>
                  <div className="h-3 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className="h-full rounded-full bg-accent-500 transition-all duration-500 ease-out"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                  <p className="mt-0.5 text-xs text-navy-400">{stat.attempts} attempts</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* Difficulty breakdown */}
      <section>
        <h2 className="mb-4 text-base font-semibold text-navy-900">Difficulty breakdown</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {diffStats.map((stat) => (
            <article key={stat.difficulty} className={`rounded-2xl border p-5 shadow-card ${stat.bgClass}`}>
              <p className="text-sm font-semibold text-navy-700">{stat.label}</p>
              <p className="mt-2 text-3xl font-bold tracking-tight tabular-nums text-navy-900">
                {stat.accuracy === null ? '--' : `${stat.accuracy}%`}
              </p>
              <p className="mt-0.5 text-xs text-navy-500">
                {stat.correct} / {stat.total} correct
              </p>
              {stat.total > 0 && (
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/60">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ease-out ${stat.colorClass}`}
                    style={{ width: `${stat.accuracy ?? 0}%` }}
                  />
                </div>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
