import { useEffect, useState } from 'react';
import PracticeSession from '@/components/practice/PracticeSession';
import PracticeSetup from '@/components/practice/PracticeSetup';
import PageHeader from '@/components/ui/PageHeader';
import StatePanel from '@/components/ui/StatePanel';
import {
  fetchPracticeQuestions,
  type PracticeDifficulty,
  type PracticeQuestion,
  type PracticeTopic,
} from '@/services/practice';

type PracticeView =
  | { kind: 'setup' }
  | { kind: 'loading' }
  | { kind: 'error' }
  | { kind: 'empty' }
  | { kind: 'session'; questions: PracticeQuestion[] };

export default function PracticePage() {
  const [view, setView] = useState<PracticeView>({ kind: 'setup' });

  useEffect(() => {
    document.title = 'Adaptive Practice | VECTRA';
  }, []);

  async function handleStart(topic: PracticeTopic, difficulty: PracticeDifficulty) {
    setView({ kind: 'loading' });
    try {
      const questions = await fetchPracticeQuestions(topic, difficulty);
      setView(questions.length === 0 ? { kind: 'empty' } : { kind: 'session', questions });
    } catch {
      setView({ kind: 'error' });
    }
  }

  const backToSetup = () => setView({ kind: 'setup' });

  return (
    <>
      <PageHeader
        eyebrow="Assessment"
        title="Adaptive Practice"
        description="Practise by topic and difficulty, then review explanations and performance."
      />

      {view.kind === 'setup' && (
        <section className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-card sm:p-8">
          <PracticeSetup onStart={(topic, difficulty) => void handleStart(topic, difficulty)} />
        </section>
      )}

      {view.kind === 'loading' && (
        <StatePanel variant="loading" title="Preparing your questions" message="This will only take a moment." />
      )}

      {view.kind === 'error' && (
        <div className="space-y-4">
          <StatePanel
            variant="error"
            title="Practice could not be loaded"
            message="Check your connection and choose your practice again."
          />
          <div className="flex justify-center">
            <button
              type="button"
              onClick={backToSetup}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-700 shadow-card transition-colors hover:bg-neutral-50"
            >
              Back to practice setup
            </button>
          </div>
        </div>
      )}

      {view.kind === 'empty' && (
        <div className="space-y-4">
          <StatePanel
            variant="empty"
            title="No questions for this selection"
            message="Try a different difficulty, or choose Mixed to include every level."
          />
          <div className="flex justify-center">
            <button
              type="button"
              onClick={backToSetup}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-700 shadow-card transition-colors hover:bg-neutral-50"
            >
              Back to practice setup
            </button>
          </div>
        </div>
      )}

      {view.kind === 'session' && <PracticeSession questions={view.questions} onExit={backToSetup} />}
    </>
  );
}
