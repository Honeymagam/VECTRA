import type { LucideIcon } from 'lucide-react';
import { CalendarCheck, Gauge, Target, Timer } from 'lucide-react';
import { ACTIVITY_WINDOW_DAYS, type ReadinessSummary } from '@/services/readiness';

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
}

function MetricCard({ icon: Icon, label, value, detail }: MetricCardProps) {
  return (
    <article className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-navy-400">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-4 text-3xl font-bold tracking-tight tabular-nums text-navy-900">{value}</p>
      <p className="mt-1 text-sm text-navy-500">{detail}</p>
    </article>
  );
}

export default function ReadinessMetrics({ summary }: { summary: ReadinessSummary }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        icon={Target}
        label="Practice accuracy"
        value={summary.practiceAccuracy === null ? '--' : `${summary.practiceAccuracy}%`}
        detail={`${summary.practiceAttempts} practice ${summary.practiceAttempts === 1 ? 'answer' : 'answers'}`}
      />
      <MetricCard
        icon={Gauge}
        label="Mock test average"
        value={summary.mockAverageScore === null ? '--' : `${summary.mockAverageScore}%`}
        detail={`${summary.mockTests} mock ${summary.mockTests === 1 ? 'test' : 'tests'} completed`}
      />
      <MetricCard
        icon={Timer}
        label="Pace per question"
        value={summary.secondsPerMockQuestion === null ? '--' : `${summary.secondsPerMockQuestion}s`}
        detail="Average time per question in mock tests"
      />
      <MetricCard
        icon={CalendarCheck}
        label="Consistency"
        value={`${summary.activeDays} / ${ACTIVITY_WINDOW_DAYS}`}
        detail="Days active in the last two weeks"
      />
    </div>
  );
}
