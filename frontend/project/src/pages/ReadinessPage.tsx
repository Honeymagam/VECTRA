import { useEffect, useState } from 'react';
import ReadinessMetrics from '@/components/readiness/ReadinessMetrics';
import TopicBreakdown from '@/components/readiness/TopicBreakdown';
import PageHeader from '@/components/ui/PageHeader';
import StatePanel from '@/components/ui/StatePanel';
import { fetchReadinessSummary, type ReadinessSummary } from '@/services/readiness';

type ReadinessView =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'empty' }
  | { kind: 'ready'; summary: ReadinessSummary };

export default function ReadinessPage() {
  const [view, setView] = useState<ReadinessView>({ kind: 'loading' });

  useEffect(() => {
    document.title = 'Placement Readiness | VECTRA';
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchReadinessSummary()
      .then((summary) => {
        if (cancelled) return;
        const hasActivity = summary.practiceAttempts > 0 || summary.mockTests > 0;
        setView(hasActivity ? { kind: 'ready', summary } : { kind: 'empty' });
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
        eyebrow="Assessment"
        title="Placement Readiness"
        description="Accuracy, speed and consistency from your own practice and mock tests."
      />

      {view.kind === 'loading' && (
        <StatePanel variant="loading" title="Loading your readiness" message="Gathering your results." />
      )}

      {view.kind === 'error' && (
        <StatePanel
          variant="error"
          title="Your readiness could not be loaded"
          message="Check your connection and refresh the page."
        />
      )}

      {view.kind === 'empty' && (
        <StatePanel
          variant="empty"
          title="No results yet"
          message="Complete a practice session or a mock test and your readiness will appear here."
        />
      )}

      {view.kind === 'ready' && (
        <div className="space-y-8">
          <ReadinessMetrics summary={view.summary} />
          <TopicBreakdown topics={view.summary.topics} />
          <p className="text-sm leading-relaxed text-navy-400">
            Mistake recovery and revision progress are not tracked yet, so they are not part of this view.
          </p>
        </div>
      )}
    </>
  );
}
