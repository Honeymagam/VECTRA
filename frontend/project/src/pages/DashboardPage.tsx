import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CalendarCheck,
  Gauge,
  Target,
  Timer,
  type LucideIcon,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatePanel from '@/components/ui/StatePanel';
import { ROUTES } from '@/config/routes';
import {
  ACTIVITY_WINDOW_DAYS,
  MIN_TOPIC_ATTEMPTS,
  fetchReadinessSummary,
  type ReadinessSummary,
} from '@/services/readiness';

interface StatCard {
  label: string;
  value: string;
  hint: string;
  icon: LucideIcon;
}

interface NextStep {
  title: string;
  description: string;
  path: string;
}

const NEXT_STEPS: NextStep[] = [
  {
    title: 'Add your learning resources',
    description: 'Upload notes or textbooks so VECTRA can build your knowledge base.',
    path: '/knowledge-extraction',
  },
  {
    title: 'Start an adaptive practice set',
    description: 'Pick a topic and difficulty to get questions matched to your level.',
    path: '/practice',
  },
  {
    title: 'Take your first mock test',
    description: 'A timed, placement-style test gives you a realistic baseline.',
    path: '/mock-tests',
  },
];

const routeByPath = new Map(ROUTES.map((route) => [route.path, route]));

function buildStats(summary: ReadinessSummary): StatCard[] {
  return [
    {
      label: 'Practice accuracy',
      value: summary.practiceAccuracy === null ? '--' : `${summary.practiceAccuracy}%`,
      hint: `${summary.practiceAttempts} practice ${summary.practiceAttempts === 1 ? 'answer' : 'answers'} recorded`,
      icon: Target,
    },
    {
      label: 'Mock test average',
      value: summary.mockAverageScore === null ? '--' : `${summary.mockAverageScore}%`,
      hint: `${summary.mockTests} mock ${summary.mockTests === 1 ? 'test' : 'tests'} completed`,
      icon: Gauge,
    },
    {
      label: 'Pace per question',
      value: summary.secondsPerMockQuestion === null ? '--' : `${summary.secondsPerMockQuestion}s`,
      hint: 'Average time per question in mock tests',
      icon: Timer,
    },
    {
      label: 'Consistency',
      value: `${summary.activeDays} / ${ACTIVITY_WINDOW_DAYS}`,
      hint: 'Days active in the last two weeks',
      icon: CalendarCheck,
    },
  ];
}

type DashboardView =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'ready'; summary: ReadinessSummary };

export default function DashboardPage() {
  const [view, setView] = useState<DashboardView>({ kind: 'loading' });
  const practiceRoute = routeByPath.get('/practice');
  const readinessRoute = routeByPath.get('/readiness');

  useEffect(() => {
    document.title = 'Dashboard | VECTRA';
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchReadinessSummary()
      .then((summary) => {
        if (!cancelled) setView({ kind: 'ready', summary });
      })
      .catch(() => {
        if (!cancelled) setView({ kind: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Welcome to VECTRA"
        description="Your learning progress and readiness at a glance."
        actions={
          practiceRoute && (
            <Link
              to={practiceRoute.path}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-600/20 transition-all hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-lg"
            >
              Start practising
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          )
        }
      />

      {view.kind === 'loading' && (
        <StatePanel variant="loading" title="Loading your dashboard" message="Gathering your results." />
      )}

      {view.kind === 'error' && (
        <StatePanel
          variant="error"
          title="Your dashboard could not be loaded"
          message="Check your connection and refresh the page."
        />
      )}

      {view.kind === 'ready' && <DashboardContent summary={view.summary} readinessHref={readinessRoute?.path} />}
    </>
  );
}

interface DashboardContentProps {
  summary: ReadinessSummary;
  readinessHref?: string;
}

function DashboardContent({ summary, readinessHref }: DashboardContentProps) {
  const hasActivity = summary.practiceAttempts > 0 || summary.mockTests > 0;
  const stats = buildStats(summary);

  return (
    <>
      <section aria-label="Key metrics" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="group rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-navy-500">{stat.label}</p>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-100">
                <stat.icon className="h-4 w-4" aria-hidden="true" />
              </span>
            </div>
            <p className="mt-3 text-3xl font-bold tracking-tight tabular-nums text-navy-900">{stat.value}</p>
            <p className="mt-1 text-xs leading-relaxed text-navy-400">{stat.hint}</p>
          </article>
        ))}
      </section>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <section className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-card lg:col-span-2">
          <h2 className="text-lg font-semibold text-navy-900">Recommended next steps</h2>
          <p className="mt-1 text-sm text-navy-500">
            {hasActivity ? 'Keep your momentum going with these.' : 'Complete these to unlock personalised insights.'}
          </p>

          <ol className="mt-6 divide-y divide-neutral-100">
            {NEXT_STEPS.map((step, index) => {
              const route = routeByPath.get(step.path);
              if (!route) return null;
              return (
                <li key={step.path}>
                  <Link
                    to={route.path}
                    className="group flex items-center gap-4 py-4 transition-colors first:pt-0 last:pb-0"
                  >
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-navy-50 text-sm font-semibold text-navy-700 transition-colors group-hover:bg-primary-600 group-hover:text-white">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-navy-900">{step.title}</span>
                      <span className="block text-sm leading-relaxed text-navy-500">{step.description}</span>
                    </span>
                    <ArrowRight
                      className="h-4 w-4 flex-shrink-0 text-navy-300 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary-600"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="flex flex-col rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-card">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-success-50 text-success-600">
              <Target className="h-4 w-4" aria-hidden="true" />
            </span>
            <h2 className="text-lg font-semibold text-navy-900">Topic accuracy</h2>
          </div>

          <ul className="mt-5 space-y-4">
            {summary.topics.map((topic) => (
              <li key={topic.topic} className="space-y-1.5 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-navy-700">{topic.label}</span>
                  <span className="font-semibold tabular-nums text-navy-900">
                    {topic.accuracy === null ? 'Not enough data' : `${topic.accuracy}%`}
                  </span>
                </div>
                {topic.accuracy !== null && (
                  <div className="h-1.5 overflow-hidden rounded-full bg-neutral-100">
                    <div className="h-full rounded-full bg-primary-500 transition-all duration-500 ease-out" style={{ width: `${topic.accuracy}%` }} />
                  </div>
                )}
                {topic.accuracy === null && topic.attempts < MIN_TOPIC_ATTEMPTS && (
                  <p className="text-xs text-navy-400">
                    {topic.attempts} of {MIN_TOPIC_ATTEMPTS} answers needed
                  </p>
                )}
              </li>
            ))}
          </ul>

          {readinessHref && (
            <Link
              to={readinessHref}
              className="mt-auto pt-6 text-sm font-semibold text-primary-600 transition-colors hover:text-primary-800"
            >
              View readiness details
            </Link>
          )}
        </section>
      </div>
    </>
  );
}
