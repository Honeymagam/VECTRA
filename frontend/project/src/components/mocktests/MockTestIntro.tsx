import { Clock, ListChecks, Shuffle, Timer } from 'lucide-react';
import { MOCK_TEST_QUESTION_COUNT, MOCK_TEST_SECONDS } from '@/services/mockTests';

interface MockTestIntroProps {
  onBegin: () => void;
  loading: boolean;
}

const FACTS = [
  { icon: ListChecks, label: 'Questions', value: `${MOCK_TEST_QUESTION_COUNT} questions` },
  { icon: Timer, label: 'Time limit', value: `${MOCK_TEST_SECONDS / 60} minutes` },
  { icon: Shuffle, label: 'Coverage', value: 'All topics, mixed' },
];

export default function MockTestIntro({ onBegin, loading }: MockTestIntroProps) {
  return (
    <section className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-card sm:p-8">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          <Clock className="h-5 w-5" aria-hidden="true" />
        </span>
        <h2 className="text-lg font-semibold text-navy-900">Ready for a timed test?</h2>
      </div>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-navy-500">
        Work through placement-style questions under time pressure. You can move between questions and change your
        answers until you submit. Results and explanations appear once you finish.
      </p>

      <dl className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {FACTS.map((fact) => (
          <div key={fact.label} className="rounded-xl bg-neutral-50 p-4">
            <dt className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-navy-400">
              <fact.icon className="h-3.5 w-3.5" aria-hidden="true" />
              {fact.label}
            </dt>
            <dd className="mt-2 text-sm font-semibold text-navy-900">{fact.value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={onBegin}
          disabled={loading}
          className="rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-primary-600/20 transition-all hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? 'Preparing test...' : 'Begin test'}
        </button>
      </div>
    </section>
  );
}
