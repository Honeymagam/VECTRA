import { MIN_TOPIC_ATTEMPTS, type ReadinessSummary } from '@/services/readiness';

export default function TopicBreakdown({ topics }: { topics: ReadinessSummary['topics'] }) {
  return (
    <section className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-card">
      <h2 className="text-lg font-semibold text-navy-900">Accuracy by topic</h2>
      <ul className="mt-6 space-y-6">
        {topics.map((topic) => (
          <li key={topic.topic} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-navy-800">{topic.label}</span>
              <span className="text-navy-400">{topic.attempts} answered</span>
            </div>
            {topic.accuracy === null ? (
              <p className="text-sm text-navy-500">
                Answer at least {MIN_TOPIC_ATTEMPTS} questions in this topic to see your accuracy.
              </p>
            ) : (
              <div className="flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200">
                  <div
                    className="h-full rounded-full bg-primary-500 transition-all duration-500 ease-out"
                    style={{ width: `${topic.accuracy}%` }}
                  />
                </div>
                <span className="w-12 text-right text-sm font-semibold tabular-nums text-navy-900">
                  {topic.accuracy}%
                </span>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
