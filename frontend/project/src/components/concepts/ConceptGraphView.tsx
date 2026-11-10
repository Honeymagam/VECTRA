import { Network } from 'lucide-react';
import { CONCEPT_PREREQUISITES, DEVELOPING_THRESHOLD, MASTERY_THRESHOLD } from '@/config/conceptGraph';
import { MIN_TOPIC_ATTEMPTS, type TopicReadiness } from '@/services/readiness';

type MasteryStatus = 'mastered' | 'developing' | 'needs-work' | 'not-enough-data';

const STATUS_STYLES: Record<MasteryStatus, { label: string; badge: string; bar: string }> = {
  mastered: { label: 'Mastered', badge: 'bg-success-50 text-success-700', bar: 'bg-success-500' },
  developing: { label: 'Developing', badge: 'bg-warning-50 text-warning-700', bar: 'bg-warning-500' },
  'needs-work': { label: 'Needs work', badge: 'bg-error-50 text-error-700', bar: 'bg-error-500' },
  'not-enough-data': { label: 'Not enough data', badge: 'bg-neutral-100 text-navy-500', bar: 'bg-neutral-300' },
};

function statusFor(topic: TopicReadiness): MasteryStatus {
  if (topic.accuracy === null) return 'not-enough-data';
  if (topic.accuracy >= MASTERY_THRESHOLD) return 'mastered';
  if (topic.accuracy >= DEVELOPING_THRESHOLD) return 'developing';
  return 'needs-work';
}

interface ConceptGraphViewProps {
  topics: TopicReadiness[];
}

export default function ConceptGraphView({ topics }: ConceptGraphViewProps) {
  const labelFor = new Map(topics.map((topic) => [topic.topic, topic.label]));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3 text-xs font-medium text-navy-500">
        {(Object.keys(STATUS_STYLES) as MasteryStatus[]).map((status) => (
          <span key={status} className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-card">
            <span className={`h-2 w-2 rounded-full ${STATUS_STYLES[status].bar}`} aria-hidden="true" />
            {STATUS_STYLES[status].label}
          </span>
        ))}
      </div>

      <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {topics.map((topic) => {
          const status = statusFor(topic);
          const style = STATUS_STYLES[status];
          const prerequisites = CONCEPT_PREREQUISITES[topic.topic];

          return (
            <li key={topic.topic}>
              <article className="flex h-full flex-col rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
                    <Network className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${style.badge}`}>{style.label}</span>
                </div>

                <h2 className="mt-5 text-lg font-semibold text-navy-900">{topic.label}</h2>

                <div className="mt-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-navy-500">Accuracy</span>
                    <span className="font-semibold tabular-nums text-navy-900">
                      {topic.accuracy === null ? '--' : `${topic.accuracy}%`}
                    </span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-neutral-100">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ease-out ${style.bar}`}
                      style={{ width: `${topic.accuracy ?? 0}%` }}
                    />
                  </div>
                  {topic.accuracy === null && (
                    <p className="mt-2 text-xs text-navy-400">
                      {topic.attempts} of {MIN_TOPIC_ATTEMPTS} answers needed to measure this concept.
                    </p>
                  )}
                </div>

                <div className="mt-auto pt-6 text-sm">
                  {prerequisites.length === 0 ? (
                    <p className="text-navy-500">Foundation concept with no prerequisites.</p>
                  ) : (
                    <p className="text-navy-500">
                      Builds on{' '}
                      <span className="font-medium text-navy-800">
                        {prerequisites.map((id) => labelFor.get(id) ?? id).join(', ')}
                      </span>
                      .
                    </p>
                  )}
                </div>
              </article>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
