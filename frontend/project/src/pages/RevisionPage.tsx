import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarCheck, Flame, Target } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatePanel from '@/components/ui/StatePanel';
import { api } from '@/lib/api';
import { PRACTICE_TOPICS, normalizeTopic, type PracticeTopic } from '@/services/practice';

// ─── Types ───────────────────────────────────────────────────────────────────

interface PracticeRow {
  is_correct: boolean;
  created_at: string;
  question: { topic: PracticeTopic } | null;
}

interface TopicStats {
  topicId: PracticeTopic;
  label: string;
  attempts: number;
  correct: number;
  accuracy: number;
}

interface RevisionTask {
  id: string;
  label: string;
  topicId: PracticeTopic;
  topicLabel: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const WEAK_THRESHOLD = 60;
const MIN_ATTEMPTS = 3;

function buildTopicStats(rows: PracticeRow[]): TopicStats[] {
  return PRACTICE_TOPICS.map((topic) => {
    const topicRows = rows.filter((r) => r.question?.topic === topic.id);
    const correct = topicRows.filter((r) => r.is_correct).length;
    const attempts = topicRows.length;
    const accuracy = attempts > 0 ? Math.round((correct / attempts) * 100) : 100;
    return { topicId: topic.id, label: topic.label, attempts, correct, accuracy };
  });
}

function buildRevisionTasks(stats: TopicStats[]): RevisionTask[] {
  const TASK_TEMPLATES: Record<PracticeTopic, string[]> = {
    percentages: [
      'Review percentage increase and decrease formulas',
      'Practice 5 Percentages questions',
      'Work through successive percentage changes',
    ],
    time_and_work: [
      'Revise combined work-rate problems',
      'Practice 5 Time & Work questions',
      'Study pipes and tanks method',
    ],
    number_series: [
      'Review common sequence patterns',
      'Practice 5 Number Series questions',
      'Identify arithmetic vs geometric sequences',
    ],
  };

  const tasks: RevisionTask[] = [];

  // Sort: weakest first
  const sorted = [...stats].sort((a, b) => a.accuracy - b.accuracy);

  for (const stat of sorted) {
    const templates = TASK_TEMPLATES[stat.topicId] ?? [];
    for (const template of templates) {
      if (tasks.length >= 5) break;
      tasks.push({
        id: `${stat.topicId}-${tasks.length}`,
        label: template,
        topicId: stat.topicId,
        topicLabel: stat.label,
      });
    }
    if (tasks.length >= 5) break;
  }

  return tasks.slice(0, 5);
}

function computeStreak(rows: PracticeRow[]): number {
  if (rows.length === 0) return 0;
  const days = new Set(rows.map((r) => new Date(r.created_at).toDateString()));
  let streak = 0;
  const today = new Date();
  for (let offset = 0; offset <= 365; offset += 1) {
    const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
    if (days.has(d.toDateString())) {
      streak += 1;
    } else if (offset > 0) {
      break;
    }
  }
  return streak;
}

// ─── View State ───────────────────────────────────────────────────────────────

type PageView =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'empty' }
  | {
      kind: 'ready';
      weakTopics: TopicStats[];
      revisionTasks: RevisionTask[];
      streak: number;
      allStats: TopicStats[];
    };

// ─── Page ────────────────────────────────────────────────────────────────────

export default function RevisionPage() {
  const [view, setView] = useState<PageView>({ kind: 'loading' });

  useEffect(() => {
    document.title = 'Revision Intelligence | VECTRA';
  }, []);

  useEffect(() => {
    let cancelled = false;

    api<{ practice_rows: Array<{ is_correct: boolean; created_at: string; question: { topic: string } | null }> }>('/analytics/activity')
      .then(({ practice_rows }) => {
        if (cancelled) return;
        const rows = practice_rows.map((r) => ({ ...r, question: r.question ? { topic: normalizeTopic(r.question.topic) } : null }));
        const validRows = rows.filter((r) => r.question !== null);

        if (validRows.length === 0) { setView({ kind: 'empty' }); return; }

        const stats = buildTopicStats(validRows);
        const weakTopics = stats.filter((s) => s.attempts >= MIN_ATTEMPTS && s.accuracy < WEAK_THRESHOLD);
        const revisionTasks = buildRevisionTasks(stats);
        const streak = computeStreak(validRows);

        setView({ kind: 'ready', weakTopics, revisionTasks, streak, allStats: stats });
      })
      .catch(() => { if (!cancelled) setView({ kind: 'error' }); });

    return () => { cancelled = true; };
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Learning Intelligence"
        title="Revision Intelligence"
        description="Weak concepts flagged, revision tasks generated, and your practice streak tracked — all in one place."
      />

      {view.kind === 'loading' && (
        <StatePanel variant="loading" title="Loading revision plan" message="Analysing your topic accuracy." />
      )}
      {view.kind === 'error' && (
        <StatePanel variant="error" title="Could not load revision data" message="Check your connection and refresh the page." />
      )}
      {view.kind === 'empty' && (
        <StatePanel
          variant="empty"
          title="No practice data yet"
          message="Complete your first practice session to generate personalised revision priorities."
        />
      )}
      {view.kind === 'ready' && (
        <RevisionContent
          weakTopics={view.weakTopics}
          revisionTasks={view.revisionTasks}
          streak={view.streak}
          allStats={view.allStats}
        />
      )}
    </>
  );
}

// ─── Content ─────────────────────────────────────────────────────────────────

interface RevisionContentProps {
  weakTopics: TopicStats[];
  revisionTasks: RevisionTask[];
  streak: number;
  allStats: TopicStats[];
}

function RevisionContent({ weakTopics, revisionTasks, streak, allStats }: RevisionContentProps) {
  const navigate = useNavigate();

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Streak Banner */}
      <div className="flex items-center gap-4 rounded-2xl border border-warning-200 bg-warning-50/60 px-6 py-4 shadow-card">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-warning-100 text-warning-700">
          <Flame className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-sm font-semibold text-warning-900">
            <span className="text-2xl font-bold tabular-nums">{streak}</span>
            {' '}
            {streak === 1 ? 'day' : 'day'} practice streak
          </p>
          <p className="text-xs text-warning-700">Keep it up — consistency is key to placement success.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Weak Topics */}
        <section className="lg:col-span-2 space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-navy-900">Priority revision topics</h2>
            <p className="mt-1 text-sm text-navy-500">
              Topics where your accuracy is below {WEAK_THRESHOLD}% (minimum {MIN_ATTEMPTS} attempts required).
            </p>
          </div>

          {weakTopics.length === 0 ? (
            <div className="rounded-2xl border border-success-200 bg-success-50/60 px-6 py-8 text-center shadow-card">
              <span className="flex h-10 w-10 mx-auto items-center justify-center rounded-xl bg-success-100">
                <Target className="h-5 w-5 text-success-700" aria-hidden="true" />
              </span>
              <p className="mt-3 text-sm font-semibold text-success-900">Great work — no weak topics detected!</p>
              <p className="mt-1 text-xs text-success-700">
                All topics with enough data are above {WEAK_THRESHOLD}% accuracy.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {weakTopics.map((topic) => (
                <li
                  key={topic.topicId}
                  className="rounded-2xl border border-error-200 bg-white p-5 shadow-card"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-navy-900">{topic.label}</p>
                      <p className="mt-0.5 text-xs text-navy-400">
                        {topic.attempts} {topic.attempts === 1 ? 'attempt' : 'attempts'} · {topic.accuracy}% accuracy
                      </p>
                      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100">
                        <div
                          className="h-full rounded-full bg-error-500 transition-all duration-500 ease-out"
                          style={{ width: `${topic.accuracy}%` }}
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('/practice')}
                      className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-600/20 transition-all hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-lg"
                    >
                      Revise now
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* All topic accuracy */}
          <section className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-card">
            <h3 className="text-base font-semibold text-navy-900">All topic accuracy</h3>
            <ul className="mt-4 space-y-4">
              {allStats.map((stat) => (
                <li key={stat.topicId} className="space-y-1.5 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-navy-700">{stat.label}</span>
                    <span className="font-semibold tabular-nums text-navy-900">
                      {stat.attempts < MIN_ATTEMPTS ? `${stat.attempts}/${MIN_ATTEMPTS} attempts` : `${stat.accuracy}%`}
                    </span>
                  </div>
                  {stat.attempts >= MIN_ATTEMPTS && (
                    <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ease-out ${
                          stat.accuracy < WEAK_THRESHOLD ? 'bg-error-500' : 'bg-success-500'
                        }`}
                        style={{ width: `${stat.accuracy}%` }}
                      />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        </section>

        {/* Right: Revision Tasks */}
        <section className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-card">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
              <CalendarCheck className="h-4 w-4" aria-hidden="true" />
            </span>
            <h2 className="text-base font-semibold text-navy-900">Upcoming revision tasks</h2>
          </div>
          <p className="mt-1 text-xs text-navy-400">Suggested tasks based on your weakest topics.</p>

          <ol className="mt-5 space-y-3">
            {revisionTasks.map((task, index) => (
              <li key={task.id} className="flex items-start gap-3 rounded-xl bg-neutral-50 px-4 py-3">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium leading-snug text-navy-800">{task.label}</p>
                  <p className="mt-0.5 text-xs text-navy-400">{task.topicLabel}</p>
                </div>
              </li>
            ))}
          </ol>

          <button
            type="button"
            onClick={() => navigate('/practice')}
            className="mt-5 w-full rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-600/20 transition-all hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-lg"
          >
            Start practice session
          </button>
        </section>
      </div>
    </div>
  );
}
