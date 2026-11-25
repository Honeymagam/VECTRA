import { useEffect, useState } from 'react';
import { BrainCircuit, ChartNoAxesCombined, Target } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatePanel from '@/components/ui/StatePanel';
import { api } from '@/lib/api';

interface MetricReport {
  evaluated_at: string;
  benchmark: string;
  sample_size: number;
  topic_count: number;
  embedding_model: string;
  tutor_model: string | null;
  answer_accuracy: {
    label: string;
    percentage: number;
    numerator: number;
    denominator: number;
    confidence_95_percent: { lower: number; upper: number };
  } | null;
  retrieval: {
    hit_at_5_percent: number;
    precision_at_5_percent: number;
    recall_at_5_percent: number;
    mrr_at_5_percent: number;
    ndcg_at_5_percent: number;
  };
  per_topic: Record<string, {
    questions: number;
    answer_accuracy_percent: number | null;
    retrieval_hit_at_5_percent: number;
    mrr_at_5_percent: number;
  }>;
  limitations: string[];
}

interface EvaluationResponse {
  embedding_model: string;
  tutor_model: string;
  report: MetricReport | null;
}

type ViewState = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; data: EvaluationResponse };

function PercentCard({ label, value, detail, icon: Icon }: { label: string; value: number; detail: string; icon: typeof Target }) {
  return (
    <article className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-card">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-navy-500">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tabular-nums text-navy-900">{value.toFixed(1)}%</p>
      <p className="mt-1 text-xs text-navy-500">{detail}</p>
    </article>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

export default function ModelAccuracyPage() {
  const [view, setView] = useState<ViewState>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;
    api<EvaluationResponse>('/model-evaluation/latest')
      .then((data) => { if (!cancelled) setView({ kind: 'ready', data }); })
      .catch(() => { if (!cancelled) setView({ kind: 'error' }); });
    return () => { cancelled = true; };
  }, []);

  const report = view.kind === 'ready' ? view.data.report : null;

  return (
    <>
      <PageHeader
        eyebrow="Model Evaluation"
        title="Model Accuracy"
        description="Measured tutor answer accuracy and embedding retrieval quality on a held-out benchmark."
      />

      {view.kind === 'loading' && <StatePanel variant="loading" title="Loading evaluation" message="Fetching the latest benchmark report…" />}
      {view.kind === 'error' && <StatePanel variant="error" title="Could not load model evaluation" message="Check your connection and refresh." />}

      {view.kind === 'ready' && !report && (
        <div className="space-y-5">
          <StatePanel
            variant="empty"
            title="No benchmark run yet"
            message="VECTRA does not have measured model results to show yet. Run the held-out benchmark to create a report; this page will display those results instead of sample figures."
            icon={ChartNoAxesCombined}
          />
          <section className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-card">
            <h2 className="text-base font-semibold text-navy-900">Run the evaluation</h2>
            <p className="mt-2 text-sm leading-6 text-navy-600">From the project root, run this command where the VECTRA API configuration and provider keys are available:</p>
            <code className="mt-3 block overflow-x-auto rounded-xl bg-navy-950 px-4 py-3 text-sm text-white">python scripts/evaluate_tutor_benchmark.py</code>
            <p className="mt-3 text-xs leading-5 text-navy-500">The default run makes 100 embedding requests. To also evaluate tutor answer accuracy, run <code>python scripts/evaluate_tutor_benchmark.py --include-tutor</code>; that sends 100 chat requests and can incur provider charges. The latest report is saved for the API and appears here after refresh.</p>
          </section>
        </div>
      )}

      {report && (
        <div className="space-y-6">
          <section className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${report.answer_accuracy ? 'xl:grid-cols-5' : 'xl:grid-cols-4'}`} aria-label="Model evaluation metrics">
            {report.answer_accuracy && <PercentCard label="Tutor numeric accuracy" value={report.answer_accuracy.percentage} detail={`${report.answer_accuracy.numerator} exact matches / ${report.answer_accuracy.denominator} questions`} icon={Target} />}
            <PercentCard label="Retrieval Hit@5" value={report.retrieval.hit_at_5_percent} detail="Queries with the relevant topic in the top 5" icon={ChartNoAxesCombined} />
            <PercentCard label="Precision@5" value={report.retrieval.precision_at_5_percent} detail="Relevant passages per five retrieved results" icon={Target} />
            <PercentCard label="Mean reciprocal rank@5" value={report.retrieval.mrr_at_5_percent} detail="Rewards relevant results appearing near rank 1" icon={BrainCircuit} />
            <PercentCard label="nDCG@5" value={report.retrieval.ndcg_at_5_percent} detail="Rank-sensitive retrieval quality, normalized to 100%" icon={ChartNoAxesCombined} />
          </section>

          <section className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-navy-900">Latest benchmark</h2>
                <p className="mt-1 text-sm text-navy-500">{report.benchmark} · {report.sample_size} questions · {report.topic_count} topics</p>
              </div>
              <p className="text-xs text-navy-500">Run {formatDate(report.evaluated_at)}</p>
            </div>
            <dl className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl bg-neutral-50 p-4"><dt className="text-xs font-medium uppercase tracking-wide text-navy-500">Embedding model</dt><dd className="mt-1 break-all text-sm font-semibold text-navy-900">{report.embedding_model}</dd></div>
              <div className="rounded-xl bg-neutral-50 p-4"><dt className="text-xs font-medium uppercase tracking-wide text-navy-500">Tutor model</dt><dd className="mt-1 break-all text-sm font-semibold text-navy-900">{report.tutor_model ?? 'Not run in this evaluation'}</dd></div>
            </dl>
            {report.answer_accuracy && <p className="mt-4 text-sm text-navy-600">95% Wilson interval for tutor numeric accuracy: <strong>{report.answer_accuracy.confidence_95_percent.lower.toFixed(1)}%–{report.answer_accuracy.confidence_95_percent.upper.toFixed(1)}%</strong>.</p>}
          </section>

          <section className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-card">
            <h2 className="text-base font-semibold text-navy-900">How the percentages are calculated</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-neutral-100 p-4"><h3 className="text-sm font-semibold text-navy-800">Tutor numeric accuracy</h3><p className="mt-2 font-mono text-sm text-primary-700">exact numeric matches ÷ questions × 100</p><p className="mt-2 text-xs leading-5 text-navy-500">{report.answer_accuracy ? "Checks whether the expected answer appears in the tutor's final response. It does not score explanation quality or factuality." : 'Not measured in this retrieval-only run. Use the optional --include-tutor flag to evaluate it.'}</p></div>
              <div className="rounded-xl border border-neutral-100 p-4"><h3 className="text-sm font-semibold text-navy-800">Retrieval Hit@5</h3><p className="mt-2 font-mono text-sm text-primary-700">queries with relevant topic in top 5 ÷ queries × 100</p><p className="mt-2 text-xs leading-5 text-navy-500">Measures whether the embedding search retrieves the expected topic among its five highest-ranked passages.</p></div>
              <div className="rounded-xl border border-neutral-100 p-4"><h3 className="text-sm font-semibold text-navy-800">Precision@5</h3><p className="mt-2 font-mono text-sm text-primary-700">relevant passages in top 5 ÷ 5, averaged × 100</p><p className="mt-2 text-xs leading-5 text-navy-500">This benchmark has one relevant formula passage for each question, so a hit contributes one relevant result out of five.</p></div>
              <div className="rounded-xl border border-neutral-100 p-4"><h3 className="text-sm font-semibold text-navy-800">Recall@5, MRR@5 and nDCG@5</h3><p className="mt-2 font-mono text-sm text-primary-700">relevant passages found ÷ all relevant passages × 100</p><p className="mt-2 text-xs leading-5 text-navy-500">With one relevant passage per query, Recall@5 equals Hit@5. MRR and nDCG reward higher-ranked results; nDCG discounts lower positions logarithmically.</p></div>
            </div>
          </section>

          <section className="rounded-2xl border border-neutral-200/80 bg-white shadow-card">
            <div className="border-b border-neutral-100 px-5 py-4"><h2 className="text-base font-semibold text-navy-900">Results by topic</h2></div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-navy-500"><tr><th className="px-5 py-3">Topic</th><th className="px-5 py-3 text-right">Questions</th><th className="px-5 py-3 text-right">Tutor accuracy</th><th className="px-5 py-3 text-right">Retrieval Hit@5</th><th className="px-5 py-3 text-right">MRR@5</th></tr></thead>
                <tbody className="divide-y divide-neutral-100">{Object.entries(report.per_topic).map(([topic, stats]) => <tr key={topic}><th scope="row" className="px-5 py-3 font-medium text-navy-800">{topic}</th><td className="px-5 py-3 text-right tabular-nums">{stats.questions}</td><td className="px-5 py-3 text-right tabular-nums">{stats.answer_accuracy_percent === null ? '—' : `${stats.answer_accuracy_percent.toFixed(1)}%`}</td><td className="px-5 py-3 text-right tabular-nums">{stats.retrieval_hit_at_5_percent.toFixed(1)}%</td><td className="px-5 py-3 text-right tabular-nums">{stats.mrr_at_5_percent.toFixed(1)}%</td></tr>)}</tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-warning-200 bg-warning-50 p-5">
            <h2 className="text-sm font-semibold text-warning-900">Read these scores as diagnostics</h2>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-warning-900">{report.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}</ul>
          </section>
        </div>
      )}
    </>
  );
}
