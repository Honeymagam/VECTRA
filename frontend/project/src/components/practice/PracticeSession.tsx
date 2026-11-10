import { useState } from 'react';
import { ArrowRight, Check, X } from 'lucide-react';
import {
  submitPracticeAnswer,
  type PracticeAnswerResult,
  type PracticeQuestion,
} from '@/services/practice';

interface PracticeSessionProps {
  questions: PracticeQuestion[];
  onExit: () => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

export default function PracticeSession({ questions, onExit }: PracticeSessionProps) {
  const [index, setIndex] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [result, setResult] = useState<PracticeAnswerResult | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [correctCount, setCorrectCount] = useState(0);

  const total = questions.length;
  const current = questions[index];
  const finished = index >= total;

  async function handleSelect(optionIndex: number) {
    if (!current || result || submitting) return;

    setSubmitting(true);
    setError(null);
    setSelectedIndex(optionIndex);
    try {
      const answer = await submitPracticeAnswer(current.id, optionIndex, current.options[optionIndex], 0);
      setResult(answer);
      if (answer.isCorrect) setCorrectCount((count) => count + 1);
    } catch {
      setSelectedIndex(null);
      setError('We could not check that answer. Please choose again.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleNext() {
    setIndex((value) => value + 1);
    setSelectedIndex(null);
    setResult(null);
  }

  if (finished) {
    const percentage = total === 0 ? 0 : Math.round((correctCount / total) * 100);
    return (
      <section className="rounded-2xl border border-neutral-200/80 bg-white p-8 text-center shadow-card animate-fade-in">
        <p className="text-xs font-semibold uppercase tracking-wider text-accent-600">Session complete</p>
        <p className="mt-3 text-5xl font-bold tracking-tight text-navy-900">{percentage}%</p>
        <p className="mt-2 text-sm text-navy-500">
          You answered {correctCount} of {total} questions correctly.
        </p>
        <button
          type="button"
          onClick={onExit}
          className="mt-8 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-primary-600/20 transition-all hover:bg-primary-700"
        >
          Choose another practice
        </button>
      </section>
    );
  }

  const progress = ((index + (result ? 1 : 0)) / total) * 100;

  return (
    <section className="space-y-6">
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-navy-600">
            Question {index + 1} of {total}
          </span>
          <span className="text-navy-400">{correctCount} correct so far</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-neutral-200">
          <div
            className="h-full rounded-full bg-primary-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <article className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-card sm:p-8 animate-fade-in" key={current.id}>
        <h2 className="text-lg font-semibold leading-relaxed text-navy-900 sm:text-xl">{current.question}</h2>

        <ul className="mt-6 space-y-3" aria-label="Answer options">
          {current.options.map((option, optionIndex) => {
            const isCorrectOption = result !== null && optionIndex === result.correctIndex;
            const isWrongChoice = result !== null && optionIndex === selectedIndex && !result.isCorrect;

            const stateClass = isCorrectOption
              ? 'border-success-500 bg-success-50 text-success-700'
              : isWrongChoice
                ? 'border-error-500 bg-error-50 text-error-700'
                : result
                  ? 'border-neutral-200 bg-white text-navy-500'
                  : 'border-neutral-200 bg-white text-navy-800 hover:-translate-y-0.5 hover:border-primary-300 hover:bg-primary-50/40 hover:shadow-card';

            return (
              <li key={optionIndex}>
                <button
                  type="button"
                  onClick={() => void handleSelect(optionIndex)}
                  disabled={result !== null || submitting}
                  className={`flex w-full items-center gap-4 rounded-xl border px-4 py-3.5 text-left text-sm font-medium transition-all duration-200 disabled:cursor-default ${stateClass}`}
                >
                  <span
                    className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                      isCorrectOption
                        ? 'bg-success-500 text-white'
                        : isWrongChoice
                          ? 'bg-error-500 text-white'
                          : 'bg-neutral-100 text-navy-600'
                    }`}
                  >
                    {isCorrectOption ? (
                      <Check className="h-4 w-4" aria-hidden="true" />
                    ) : isWrongChoice ? (
                      <X className="h-4 w-4" aria-hidden="true" />
                    ) : (
                      OPTION_LETTERS[optionIndex]
                    )}
                  </span>
                  <span>{option}</span>
                </button>
              </li>
            );
          })}
        </ul>

        {submitting && <p className="mt-4 text-sm text-navy-500">Checking your answer...</p>}

        {error && (
          <p role="alert" className="mt-4 rounded-xl bg-error-50 px-4 py-3 text-sm text-error-700">
            {error}
          </p>
        )}

        {result && (
          <div className="mt-6 space-y-4 rounded-xl bg-neutral-50 p-5 animate-fade-in">
            <p className={`text-sm font-semibold ${result.isCorrect ? 'text-success-700' : 'text-error-700'}`}>
              {result.isCorrect ? 'Correct' : 'Not quite'}
            </p>
            <p className="text-sm leading-relaxed text-navy-700">{result.explanation}</p>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleNext}
                className="inline-flex items-center gap-2 rounded-xl bg-navy-900 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-navy-800"
              >
                {index + 1 === total ? 'See results' : 'Next question'}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </article>
    </section>
  );
}
