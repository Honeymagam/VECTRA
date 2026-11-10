import { useEffect } from 'react';
import { ArrowDown, Database, FileSpreadsheet, Sparkles } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';

const datasetRows = [
  { id: 'PCT-01', topic: 'Percentages', level: 'Easy', source: 'Marked price ₹800; increase 15%', target: 'New price' },
  { id: 'PCT-02', topic: 'Percentages', level: 'Medium', source: '25% of an unknown value equals 60', target: 'Find the whole' },
  { id: 'PCT-03', topic: 'Percentages', level: 'Easy', source: 'Price ₹1,500; discount 20%', target: 'Sale price' },
  { id: 'WORK-01', topic: 'Time & Work', level: 'Hard', source: 'A: 12 days; B: 18 days', target: 'Combined time' },
  { id: 'RATIO-01', topic: 'Ratio', level: 'Easy', source: 'Boys:girls = 3:5; class size 40', target: 'Count in each group' },
  { id: 'PL-01', topic: 'Profit & Loss', level: 'Medium', source: 'Cost ₹500; selling price ₹575', target: 'Profit percentage' },
  { id: 'AVG-01', topic: 'Average', level: 'Easy', source: 'Scores 68, 74, 82, 76', target: 'Mean score' },
  { id: 'SI-01', topic: 'Simple Interest', level: 'Medium', source: 'Principal ₹5,000; rate 8%; time 2 years', target: 'Interest earned' },
  { id: 'PROB-01', topic: 'Probability', level: 'Easy', source: 'One fair six-sided die', target: 'Chance of an even number' },
  { id: 'DI-01', topic: 'Data Interpretation', level: 'Medium', source: 'Quarterly sales: 120, 150, 180, 210 units', target: 'Quarter-over-quarter change' },
  { id: 'SER-01', topic: 'Number Series', level: 'Medium', source: '2, 6, 12, 20, 30, ?', target: 'Next term' },
  { id: 'SER-02', topic: 'Number Series', level: 'Easy', source: '3, 9, 27, 81, ?', target: 'Next term' },
];

const formulas = [
  { topic: 'Percent change', formula: '(New value − Original value) ÷ Original value × 100%', example: '₹800 increased by 15% → ₹800 × 1.15 = ₹920', source: 'https://www.indiabix.com/aptitude/percentage/formulas' },
  { topic: 'Ratio sharing', formula: 'Part = Total × (part ratio ÷ sum of ratio terms)', example: '3:5 in a class of 40 → boys = 40 × 3/8 = 15', source: 'https://www.indiabix.com/aptitude/ratio-and-proportion/formulas' },
  { topic: 'Profit percentage', formula: '(Selling price − Cost price) ÷ Cost price × 100%', example: '₹575 − ₹500 → profit = ₹75/₹500 × 100 = 15%', source: 'https://www.indiabix.com/aptitude/profit-and-loss/formulas' },
  { topic: 'Arithmetic mean', formula: 'Sum of observations ÷ Number of observations', example: '(68 + 74 + 82 + 76) ÷ 4 = 75', source: 'https://www.indiabix.com/aptitude/average/formulas' },
  { topic: 'Simple interest', formula: 'Principal × Annual rate × Time ÷ 100', example: '₹5,000 × 8 × 2 ÷ 100 = ₹800', source: 'https://www.indiabix.com/aptitude/simple-interest/formulas' },
  { topic: 'Combined work rate', formula: 'Combined time = 1 ÷ (1/time₁ + 1/time₂ + …)', example: '12-day and 18-day workers → 1 ÷ (1/12 + 1/18) = 7.2 days', source: 'https://www.indiabix.com/aptitude/time-and-work/formulas' },
  { topic: 'Compound interest', formula: 'Amount = Principal × (1 + Rate/100)ⁿ', example: '₹1,000 at 10% for 2 years → ₹1,000 × 1.1² = ₹1,210', source: 'https://www.indiabix.com/aptitude/compound-interest/formulas' },
  { topic: 'Probability', formula: 'Favourable outcomes ÷ Total equally likely outcomes', example: 'Even result on a fair die → 3/6 = 1/2', source: 'https://www.indiabix.com/aptitude/probability/formulas' },
  { topic: 'Percentage change in data', formula: '(Current period − Previous period) ÷ Previous period × 100%', example: 'Sales 120 → 150 → increase = 30/120 × 100 = 25%', source: 'https://www.indiabix.com/aptitude/percentage/formulas' },
  { topic: 'Number series', formula: 'Identify the rule in differences, ratios, or alternating terms', example: '2, 6, 12, 20, 30 → differences +4, +6, +8, +10; next is +12', source: 'https://www.indiabix.com/aptitude/odd-man-out-and-series/072002' },
];

const questionExamples = [
  {
    source: 'PCT-01 · Marked price ₹800; increase 15%',
    rule: 'Apply the percentage increase: 800 × (1 + 15/100).',
    question: 'A jacket costs ₹800. Its price increases by 15%. What is the new price?',
    choices: ['₹880', '₹900', '₹920', '₹940'],
    answer: '₹920',
    reason: '15% of ₹800 is ₹120; adding that increase gives ₹920.',
  },
  {
    source: 'WORK-01 · A: 12 days; B: 18 days',
    rule: 'Add work rates, then take the reciprocal: 1 ÷ (1/12 + 1/18).',
    question: 'A can finish a job in 12 days and B in 18 days. How long will they take working together?',
    choices: ['6 days', '7.2 days', '8 days', '15 days'],
    answer: '7.2 days',
    reason: 'Their combined rate is 5/36 of the job each day, so the time is 36/5 = 7.2 days.',
  },
  {
    source: 'SER-01 · 2, 6, 12, 20, 30, ?',
    rule: 'Compare adjacent differences: +4, +6, +8, +10; continue with +12.',
    question: 'What number comes next: 2, 6, 12, 20, 30, __?',
    choices: ['36', '40', '42', '44'],
    answer: '42',
    reason: 'The differences increase by 2 each time, so the next term is 30 + 12 = 42.',
  },
];

export default function DatasetReviewPage() {
  useEffect(() => { document.title = 'Dataset Review | VECTRA'; }, []);

  return (
    <>
      <PageHeader
        eyebrow="Review workspace"
        title="Dataset Review"
        description="A separate, synthetic sample dataset for reviewing source records and question traceability. It does not mix with your uploaded resources."
      />

      <div className="space-y-6 animate-fade-in">
        <section className="grid gap-4 sm:grid-cols-3" aria-label="Dataset summary">
          {[
            { label: 'Sample records', value: datasetRows.length.toString(), icon: FileSpreadsheet },
            { label: 'Topics covered', value: new Set(datasetRows.map((row) => row.topic)).size.toString(), icon: Database },
            { label: 'Formula examples', value: formulas.length.toString(), icon: Sparkles },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-card">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-navy-500">{label}</p>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-bold tabular-nums text-navy-900">{value}</p>
            </div>
          ))}
        </section>

        <section className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-card sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">Demo dataset · synthetic</p>
              <h2 className="mt-1 text-lg font-semibold text-navy-900">Placement Aptitude Sample</h2>
              <p className="mt-1 text-sm text-navy-500">Synthetic aptitude records covering quantitative, reasoning and data interpretation practice.</p>
            </div>
            <span className="rounded-full bg-accent-50 px-3 py-1 text-xs font-semibold text-accent-700">Review only</span>
          </div>
          <div className="mt-5 overflow-x-auto rounded-xl border border-neutral-200">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-navy-500">
                <tr>
                  <th className="px-4 py-3 font-semibold">Record</th>
                  <th className="px-4 py-3 font-semibold">Topic</th>
                  <th className="px-4 py-3 font-semibold">Level</th>
                  <th className="px-4 py-3 font-semibold">Source data</th>
                  <th className="px-4 py-3 font-semibold">Expected task</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {datasetRows.map((row) => (
                  <tr key={row.id}>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-navy-500">{row.id}</td>
                    <td className="px-4 py-3 font-medium text-navy-800">{row.topic}</td>
                    <td className="px-4 py-3 text-navy-600">{row.level}</td>
                    <td className="px-4 py-3 text-navy-700">{row.source}</td>
                    <td className="px-4 py-3 text-navy-600">{row.target}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-card sm:p-6" aria-labelledby="formula-reference-heading">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">Formula reference</p>
            <h2 id="formula-reference-heading" className="mt-1 text-lg font-semibold text-navy-900">Core formulas in the sample data</h2>
            <p className="mt-1 text-sm leading-relaxed text-navy-500">Each example connects a dataset row to the calculation expected in its practice question.</p>
          </div>
          <div className="mt-5 grid gap-3 lg:grid-cols-2">
            {formulas.map((item) => (
              <article key={item.topic} className="rounded-xl border border-neutral-200 bg-neutral-50/60 p-4">
                <h3 className="text-sm font-semibold text-navy-800">{item.topic}</h3>
                <p className="mt-2 rounded-lg bg-white px-3 py-2 font-mono text-xs leading-relaxed text-primary-800">{item.formula}</p>
                <p className="mt-2 text-xs leading-relaxed text-navy-500">Example: {item.example}</p>
                <a href={item.source} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-medium text-primary-700 underline hover:text-primary-900">IndiaBIX formula source</a>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-card sm:p-6" aria-labelledby="question-traces-heading">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">Source → transformation → question</p>
            <h2 id="question-traces-heading" className="mt-1 text-lg font-semibold text-navy-900">Question generation review</h2>
            <p className="mt-1 text-sm leading-relaxed text-navy-500">
              These examples show a transparent rule-based transformation from a source record to a practice question, including its answer and rationale.
            </p>
          </div>
          <div className="mt-5 space-y-4">
            {questionExamples.map((example, index) => (
              <article key={example.source} className="rounded-xl border border-neutral-200 bg-neutral-50/70 p-4 sm:p-5">
                <div className="flex items-center gap-2 text-xs font-semibold text-navy-500">
                  <span className="rounded-md bg-white px-2 py-1">{example.source}</span>
                  <ArrowDown className="h-3.5 w-3.5 text-primary-500" aria-hidden="true" />
                  <span>Question {index + 1}</span>
                </div>
                <p className="mt-3 font-semibold leading-relaxed text-navy-900">{example.question}</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  {example.choices.map((choice) => (
                    <span key={choice} className={`rounded-lg border px-3 py-2 text-sm ${choice === example.answer ? 'border-success-200 bg-success-50 font-semibold text-success-800' : 'border-neutral-200 bg-white text-navy-600'}`}>
                      {choice}{choice === example.answer ? ' · Answer' : ''}
                    </span>
                  ))}
                </div>
                <div className="mt-3 space-y-1 text-sm">
                  <p><span className="font-medium text-navy-700">Transformation:</span> <span className="text-navy-500">{example.rule}</span></p>
                  <p><span className="font-medium text-navy-700">Rationale:</span> <span className="text-navy-500">{example.reason}</span></p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="rounded-2xl border border-warning-200 bg-warning-50/70 p-5">
          <h2 className="text-sm font-semibold text-warning-900">What this represents in the current build</h2>
          <p className="mt-1 text-sm leading-relaxed text-warning-800">
            The sample questions are curated starter-bank examples with visible source mapping. Uploading a learner CSV currently extracts rows, chunks the text and indexes it for search; it does not automatically generate new questions from that upload. This tab is isolated demo content for dataset and question-generation reviews.
          </p>
        </aside>
        <p className="text-xs leading-relaxed text-navy-400">Formula summaries are adapted as short references from the linked IndiaBIX formula pages. The synthetic records, values, question wording, options and explanations on this page were generated for VECTRA and are not copied from IndiaBIX.</p>
      </div>
    </>
  );
}
