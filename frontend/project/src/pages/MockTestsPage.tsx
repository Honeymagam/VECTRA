import { useEffect, useState } from 'react';
import MockTestIntro from '@/components/mocktests/MockTestIntro';
import MockTestResults from '@/components/mocktests/MockTestResults';
import MockTestRunner from '@/components/mocktests/MockTestRunner';
import PageHeader from '@/components/ui/PageHeader';
import StatePanel from '@/components/ui/StatePanel';
import {
  buildMockTestAttempt,
  fetchMockTestQuestions,
  submitMockTest,
  type MockTestAnswer,
  type MockTestAttempt,
} from '@/services/mockTests';
import type { PracticeQuestion } from '@/services/practice';

type MockTestView =
  | { kind: 'intro' }
  | { kind: 'empty' }
  | { kind: 'error' }
  | { kind: 'running'; questions: PracticeQuestion[]; startedAt: number }
  | { kind: 'results'; attempt: MockTestAttempt };

export default function MockTestsPage() {
  const [view, setView] = useState<MockTestView>({ kind: 'intro' });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    document.title = 'Mock Tests | VECTRA';
  }, []);

  async function handleBegin() {
    setLoading(true);
    try {
      const questions = await fetchMockTestQuestions();
      setView(questions.length === 0 ? { kind: 'empty' } : { kind: 'running', questions, startedAt: Date.now() });
    } catch {
      setView({ kind: 'error' });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(questions: PracticeQuestion[], answers: MockTestAnswer[], durationSeconds: number) {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const grades = await submitMockTest(answers, durationSeconds);
      setView({ kind: 'results', attempt: buildMockTestAttempt(questions, grades, durationSeconds) });
    } catch {
      setSubmitError('We could not submit your test. Your answers are still here, so please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Assessment"
        title="Mock Tests"
        description="Timed placement-style tests with question navigation and result summaries."
      />

      {view.kind === 'intro' && <MockTestIntro onBegin={() => void handleBegin()} loading={loading} />}

      {view.kind === 'empty' && (
        <div className="space-y-4">
          <StatePanel
            variant="empty"
            title="No questions available yet"
            message="The question bank is empty, so a mock test cannot be built right now."
          />
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setView({ kind: 'intro' })}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-700 shadow-card transition-colors hover:bg-neutral-50"
            >
              Back to mock tests
            </button>
          </div>
        </div>
      )}

      {view.kind === 'error' && (
        <div className="space-y-4">
          <StatePanel
            variant="error"
            title="Your test could not be prepared"
            message="Check your connection and try again."
          />
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setView({ kind: 'intro' })}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-700 shadow-card transition-colors hover:bg-neutral-50"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {view.kind === 'running' && (
        <MockTestRunner
          questions={view.questions}
          startedAt={view.startedAt}
          submitting={submitting}
          submitError={submitError}
          onSubmit={(answers, durationSeconds) => void handleSubmit(view.questions, answers, durationSeconds)}
        />
      )}

      {view.kind === 'results' && (
        <MockTestResults attempt={view.attempt} onRetake={() => setView({ kind: 'intro' })} />
      )}
    </>
  );
}
