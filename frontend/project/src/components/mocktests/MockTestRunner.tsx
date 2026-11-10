import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Clock, Send } from 'lucide-react';
import MockTestNavigator from '@/components/mocktests/MockTestNavigator';
import { formatClock, MOCK_TEST_SECONDS, type MockTestAnswer } from '@/services/mockTests';
import type { PracticeQuestion } from '@/services/practice';

interface MockTestRunnerProps {
  questions: PracticeQuestion[];
  startedAt: number;
  submitting: boolean;
  submitError: string | null;
  onSubmit: (answers: MockTestAnswer[], durationSeconds: number) => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

function toAnswers(questions: PracticeQuestion[], selections: Record<string, number>): MockTestAnswer[] {
  return questions.map((question) => ({
    questionId: question.id,
    selectedIndex: selections[question.id] ?? null,
  }));
}

export default function MockTestRunner({
  questions,
  startedAt,
  submitting,
  submitError,
  onSubmit,
}: MockTestRunnerProps) {
  const [selections, setSelections] = useState<Record<string, number>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [now, setNow] = useState(() => Date.now());
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const elapsedSeconds = Math.min(MOCK_TEST_SECONDS, Math.max(0, Math.floor((now - startedAt) / 1000)));
  const remainingSeconds = MOCK_TEST_SECONDS - elapsedSeconds;
  const timeUp = remainingSeconds === 0;

  useEffect(() => {
    if (!timeUp || autoSubmittedRef.current) return;
    autoSubmittedRef.current = true;
    onSubmit(toAnswers(questions, selections), MOCK_TEST_SECONDS);
  }, [timeUp, questions, selections, onSubmit]);

  const question = questions[currentIndex];
  const answered = questions.map((item) => selections[item.id] !== undefined);
  const unansweredCount = answered.filter((value) => !value).length;
  const timerTone =
    remainingSeconds <= 60 ? 'text-error-600' : remainingSeconds <= 180 ? 'text-warning-700' : 'text-navy-900';

  function handleSubmitClick() {
    if (unansweredCount > 0) {
      const confirmed = window.confirm(
        `${unansweredCount} ${unansweredCount === 1 ? 'question is' : 'questions are'} unanswered. Submit anyway?`,
      );
      if (!confirmed) return;
    }
    onSubmit(toAnswers(questions, selections), elapsedSeconds);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-neutral-200/80 bg-white p-4 shadow-card">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-navy-600">
            <Clock className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className={`text-xl font-bold tabular-nums transition-colors ${timerTone}`} aria-live="off">
              {formatClock(remainingSeconds)}
            </p>
            <p className="text-xs text-navy-400">Time remaining</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleSubmitClick}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-600/20 transition-all hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
          {submitting ? 'Submitting...' : 'Submit test'}
        </button>
      </div>

      {submitError && (
        <p role="alert" className="rounded-xl bg-error-50 px-4 py-3 text-sm text-error-700">
          {submitError}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <section className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-card sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-600">
            Question {currentIndex + 1} of {questions.length}
          </p>
          <h2 className="mt-3 text-lg font-semibold leading-relaxed text-navy-900 sm:text-xl">{question.question}</h2>

          <ul className="mt-6 space-y-3" aria-label="Answer options">
            {question.options.map((option, optionIndex) => {
              const selected = selections[question.id] === optionIndex;
              return (
                <li key={optionIndex}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSelections((current) => ({ ...current, [question.id]: optionIndex }))}
                    className={`flex w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all duration-200 ${
                      selected
                        ? 'border-primary-500 bg-primary-50 text-primary-900 shadow-card ring-2 ring-primary-500/20'
                        : 'border-neutral-200 bg-white text-navy-800 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-card'
                    }`}
                  >
                    <span
                      className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                        selected ? 'bg-primary-600 text-white' : 'bg-neutral-100 text-navy-600'
                      }`}
                    >
                      {OPTION_LETTERS[optionIndex]}
                    </span>
                    <span>{option}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-8 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setCurrentIndex((index) => Math.max(0, index - 1))}
              disabled={currentIndex === 0}
              className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-navy-600 transition-colors hover:bg-neutral-100 disabled:opacity-40"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Previous
            </button>
            <button
              type="button"
              onClick={() => setCurrentIndex((index) => Math.min(questions.length - 1, index + 1))}
              disabled={currentIndex === questions.length - 1}
              className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-navy-800 disabled:opacity-40"
            >
              Next
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </section>

        <aside className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-card lg:self-start">
          <MockTestNavigator
            total={questions.length}
            currentIndex={currentIndex}
            answered={answered}
            onSelect={setCurrentIndex}
          />
        </aside>
      </div>
    </div>
  );
}
