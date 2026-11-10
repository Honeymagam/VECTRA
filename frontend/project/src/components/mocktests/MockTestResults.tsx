import { Check, RotateCcw, X } from 'lucide-react';
import { formatClock, type MockTestAttempt, type MockTestReviewItem } from '@/services/mockTests';

interface MockTestResultsProps {
  attempt: MockTestAttempt;
  onRetake: () => void;
}

const OPTION_LETTERS = ['A', 'B', 'C', 'D'];

function describeAnswer(item: MockTestReviewItem) {
  if (item.selectedIndex === null) return 'Not answered';
  return `${OPTION_LETTERS[item.selectedIndex]}. ${item.question.options[item.selectedIndex]}`;
}

function ReviewStatus({ item }: { item: MockTestReviewItem }) {
  if (item.selectedIndex === null) {
    return <span className="rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-navy-600">Skipped</span>;
  }
  if (item.isCorrect) {
    return (
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-success-500 text-white" aria-label="Correct">
        <Check className="h-4 w-4" aria-hidden="true" />
      </span>
    );
  }
  return (
    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-error-500 text-white" aria-label="Incorrect">
      <X className="h-4 w-4" aria-hidden="true" />
    </span>
  );
}

export default function MockTestResults({ attempt, onRetake }: MockTestResultsProps) {
  const percentage = attempt.totalCount === 0 ? 0 : Math.round((attempt.correctCount / attempt.totalCount) * 100);
  const skippedCount = attempt.items.filter((item) => item.selectedIndex === null).length;

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-6 rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-600">Test complete</p>
          <p className="mt-2 text-5xl font-bold tracking-tight text-navy-900">{percentage}%</p>
          <p className="mt-2 text-sm text-navy-500">
            {attempt.correctCount} of {attempt.totalCount} correct
          </p>
        </div>

        <dl className="grid grid-cols-2 gap-4 sm:gap-6">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-navy-400">Time used</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums text-navy-900">
              {formatClock(attempt.durationSeconds)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-navy-400">Skipped</dt>
            <dd className="mt-1 text-lg font-semibold tabular-nums text-navy-900">{skippedCount}</dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={onRetake}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-primary-600/20 transition-all hover:bg-primary-700"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Take another test
        </button>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-navy-900">Review your answers</h2>
        <ol className="space-y-4">
          {attempt.items.map((item, index) => (
            <li
              key={item.question.id}
              className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-card sm:p-6"
            >
              <div className="flex items-start gap-4">
                <ReviewStatus item={item} />
                <div className="min-w-0 flex-1 space-y-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-navy-400">Question {index + 1}</p>
                  <h3 className="text-base font-semibold leading-relaxed text-navy-900">{item.question.question}</h3>
                  <dl className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 sm:gap-6">
                    <div>
                      <dt className="text-navy-400">Your answer</dt>
                      <dd className={item.isCorrect ? 'font-medium text-success-700' : 'font-medium text-navy-700'}>
                        {describeAnswer(item)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-navy-400">Correct answer</dt>
                      <dd className="font-medium text-success-700">
                        {OPTION_LETTERS[item.correctIndex]}. {item.question.options[item.correctIndex]}
                      </dd>
                    </div>
                  </dl>
                  <p className="rounded-xl bg-neutral-50 px-4 py-3 text-sm leading-relaxed text-navy-700">
                    {item.explanation}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
