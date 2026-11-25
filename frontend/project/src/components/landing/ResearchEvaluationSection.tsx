import { Activity, BookCheck, ChartNoAxesCombined, Database, SearchCheck, ShieldCheck } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fetchLatestModelEvaluation } from '@/services/modelEvaluation';

const METRICS = [
  {
    group: 'Answer quality',
    icon: BookCheck,
    items: [
      ['End-to-end exact-answer accuracy', 'Correct final answers ÷ all benchmark questions × 100'],
      ['Precision, recall, and F1', 'Report per class and macro / micro averages for labelled outcomes'],
      ['Question validity rate', 'Questions with a verified answer and sound rationale ÷ generated questions × 100'],
    ],
  },
  {
    group: 'Knowledge retrieval',
    icon: SearchCheck,
    items: [
      ['Hit@5', 'Queries with a relevant source in the top 5 ÷ all benchmark queries × 100'],
      ['Precision@5 and Recall@5', 'Relevant retrieved passages ÷ retrieved passages; relevant retrieved ÷ all relevant'],
      ['MRR / nDCG@5', 'Ranking quality for the first relevant passage and all relevant passages'],
    ],
  },
  {
    group: 'Grounding and reliability',
    icon: ShieldCheck,
    items: [
      ['Faithfulness / citation support', 'Verifiable answer claims supported by retrieved sources ÷ verifiable claims × 100'],
      ['Coverage and failure rate', 'Answered benchmark cases ÷ all cases; failed or invalid responses ÷ all cases'],
      ['Calibration', 'Brier score or expected calibration error, with confidence intervals'],
    ],
  },
  {
    group: 'System performance',
    icon: Activity,
    items: [
      ['Latency', 'Report median and 95th-percentile response time; include throughput'],
      ['Resource use', 'Report memory, CPU, and storage for the stated dataset and deployment'],
      ['Operational success', 'Successful ingestion and retrieval requests ÷ all benchmark requests × 100'],
    ],
  },
];

export default function ResearchEvaluationSection() {
  const [evaluation, setEvaluation] = useState<Awaited<ReturnType<typeof fetchLatestModelEvaluation>> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchLatestModelEvaluation()
      .then((result) => { if (!cancelled) setEvaluation(result); })
      .catch(() => { if (!cancelled) setEvaluation(null); });
    return () => { cancelled = true; };
  }, []);

  const realReport = evaluation?.real_data_report ?? null;
  const answerReport = realReport?.answer_accuracy ? realReport : evaluation?.report ?? null;
  const retrievalReport = realReport ?? evaluation?.report ?? null;

  return (
    <section id="research-evaluation" className="bg-navy-900 py-20 text-white lg:py-28">
      <div className="mx-auto max-w-6xl px-6 lg:px-10">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-wider text-primary-300">Research transparency</p>
          <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Model evaluation and paper metrics</h2>
          <p className="mt-4 text-sm leading-relaxed text-navy-200 sm:text-base">
            VECTRA separates embedding retrieval quality from tutor answer accuracy. Scores come from the latest held-out benchmark report; missing metrics are shown as not measured, never as zero.
          </p>
        </div>

        <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <div className="flex items-start gap-3">
            <ChartNoAxesCombined className="mt-0.5 h-5 w-5 flex-shrink-0 text-accent-300" aria-hidden="true" />
            <div>
              <h3 className="font-semibold">Tutor numeric answer accuracy</h3>
              {answerReport?.answer_accuracy ? (
                <p className="mt-1 text-sm text-navy-200">{answerReport.answer_accuracy.percentage.toFixed(2)}% · {answerReport.answer_accuracy.numerator} correct out of {answerReport.answer_accuracy.denominator} labeled prompts. 95% Wilson interval: {answerReport.answer_accuracy.confidence_95_percent.lower.toFixed(2)}%–{answerReport.answer_accuracy.confidence_95_percent.upper.toFixed(2)}%.</p>
              ) : (
                <p className="mt-1 text-sm text-navy-200">Not measured in the latest run. Run the optional tutor benchmark to score numeric answers; this is not a 0% result.</p>
              )}
            </div>
          </div>
          <span className="w-fit flex-shrink-0 rounded-full border border-warning-300/30 bg-warning-300/10 px-3 py-1 text-xs font-semibold text-warning-200">{answerReport === realReport && realReport ? 'Uploaded-data diagnostic' : 'Not measured'}</span>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <h3 className="font-semibold">Embedding retrieval quality</h3>
          {retrievalReport ? (
            <>
              <p className="mt-1 text-sm text-navy-200">Hit@5: {retrievalReport.retrieval.hit_at_5_percent.toFixed(2)}% ({retrievalReport.retrieval.numerator}/{retrievalReport.retrieval.denominator}); Precision@5: {retrievalReport.retrieval.precision_at_5_percent.toFixed(2)}%; MRR@5: {retrievalReport.retrieval.mrr_at_5_percent.toFixed(2)}%; nDCG@5: {retrievalReport.retrieval.ndcg_at_5_percent.toFixed(2)}%.</p>
              <p className="mt-2 text-xs leading-relaxed text-navy-300">Embedding model: {retrievalReport.embedding_model}. Benchmark scope: {retrievalReport.sample_size} {realReport === retrievalReport ? 'sampled questions from uploaded labeled datasets' : 'held-out synthetic formula queries'}. These scores use the source chunk as the relevance label.</p>
            </>
          ) : (
            <p className="mt-1 text-sm text-navy-200">No benchmark report is available yet. Run the retrieval evaluation to publish measured results here.</p>
          )}
        </div>

        <p className="mt-3 text-xs leading-relaxed text-navy-300">Uploaded-data results use the answer labels supplied with those datasets and have not been independently expert-validated. Synthetic and real-data results are diagnostics, not general-purpose model scores. Learner practice accuracy is a separate student metric.</p>

        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {METRICS.map(({ group, icon: Icon, items }) => (
            <article key={group} className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-400/15 text-primary-200">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <h3 className="text-base font-semibold">{group}</h3>
              </div>
              <dl className="mt-5 space-y-4">
                {items.map(([name, definition]) => (
                  <div key={name}>
                    <dt className="text-sm font-medium text-white">{name}</dt>
                    <dd className="mt-1 text-xs leading-relaxed text-navy-200">{definition}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-success-300" aria-hidden="true" />
            <h3 className="font-semibold">What a reproducible paper should report</h3>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-navy-200">
            Name and cite the benchmark; document sample counts, topic balance, label rules, train / validation / test split, model and embedding versions, retrieval k, prompt and decoding settings, and hardware. Report per-topic results, macro and micro averages, sample size, and 95% confidence intervals. Keep synthetic training data out of the held-out test set and include human review for faithfulness and question validity.
          </p>
          <p className="mt-3 text-xs leading-relaxed text-navy-300">
            The displayed baseline is from a synthetic benchmark and should not be presented as a general or expert-validated model score. VECTRA's learner analytics are available inside the app, but they must not be presented as model evaluation results.
          </p>
        </div>
      </div>
    </section>
  );
}
