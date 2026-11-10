import { useEffect, useState } from 'react';
import ConceptGraphView from '@/components/concepts/ConceptGraphView';
import PageHeader from '@/components/ui/PageHeader';
import StatePanel from '@/components/ui/StatePanel';
import { fetchReadinessSummary, type TopicReadiness } from '@/services/readiness';

type ConceptGraphState =
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'ready'; topics: TopicReadiness[] };

export default function ConceptGraphPage() {
  const [state, setState] = useState<ConceptGraphState>({ kind: 'loading' });

  useEffect(() => {
    document.title = 'Concept Memory Graph | VECTRA';
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchReadinessSummary()
      .then((summary) => {
        if (!cancelled) setState({ kind: 'ready', topics: summary.topics });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Core Intelligence"
        title="Concept Memory Graph"
        description="The concepts VECTRA tracks for you, what each one builds on, and how well you have mastered it."
      />

      {state.kind === 'loading' && (
        <StatePanel variant="loading" title="Loading your concept map" message="Gathering your results." />
      )}

      {state.kind === 'error' && (
        <StatePanel
          variant="error"
          title="Your concept map could not be loaded"
          message="Check your connection and refresh the page."
        />
      )}

      {state.kind === 'ready' && <ConceptGraphView topics={state.topics} />}
    </>
  );
}
