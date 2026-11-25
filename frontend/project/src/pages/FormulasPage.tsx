import { useCallback, useEffect, useState } from 'react';
import { ExternalLink, FileSpreadsheet } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatePanel from '@/components/ui/StatePanel';
import { loadDatasetReview, type DatasetReview } from '@/services/datasetReview';

export default function FormulasPage() {
  const [data, setData] = useState<DatasetReview | null>(null);
  const [failed, setFailed] = useState(false);
  const load = useCallback(async () => {
    try { setData(await loadDatasetReview()); setFailed(false); }
    catch { setFailed(true); }
  }, []);

  useEffect(() => { document.title = 'Formula Library | VECTRA'; void load(); }, [load]);
  useEffect(() => {
    if (data?.document?.status !== 'PROCESSING') return;
    const timer = window.setInterval(() => void load(), 10000);
    return () => window.clearInterval(timer);
  }, [data?.document?.status, load]);

  return (
    <>
      <PageHeader
        eyebrow="Study reference"
        title="Formula Library"
        description="Formulae are extracted from the latest uploaded CSV, with example questions and answers from the same records."
      />

      {data === null && !failed && <StatePanel variant="loading" title="Loading formulas" message="Reading formula fields from your uploaded CSV." />}
      {failed && <StatePanel variant="error" title="Formula library could not be loaded" message="Check your connection and try again." />}
      {data && !data.document && <StatePanel variant="empty" title="No uploaded dataset yet" message="Upload a CSV containing a formula field to build this library from your records." />}
      {data?.document && (
        <div className="space-y-5 animate-fade-in">
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-navy-600">
            <FileSpreadsheet className="h-4 w-4 text-primary-600" aria-hidden="true" />
            <span>Source: <strong className="font-semibold text-navy-800">{data.document.filename}</strong></span>
            <span className="text-navy-300" aria-hidden="true">·</span>
            <span>Scanned {data.summary.records_scanned_for_formulas.toLocaleString()} records</span>
            <span className="text-navy-300" aria-hidden="true">·</span>
            <span>{data.formulas.length} formula patterns</span>
          </div>

          {data.formulas.length > 0 ? (
            <section className="grid gap-4 lg:grid-cols-2" aria-label="Formulas from uploaded data">
              {data.formulas.map((item) => (
                <article key={`${item.topic}:${item.formula}`} className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-card">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">{item.topic}</p>
                      <h2 className="mt-1 text-base font-semibold text-navy-900">Formula</h2>
                    </div>
                    {item.formula_reference && /^https?:\/\//i.test(item.formula_reference) && (
                      <a href={item.formula_reference} target="_blank" rel="noopener noreferrer" aria-label={`Open reference for ${item.topic}`} className="rounded-lg p-2 text-navy-400 hover:bg-neutral-50 hover:text-primary-700">
                        <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      </a>
                    )}
                  </div>
                  <p className="mt-3 rounded-xl bg-primary-50/70 px-4 py-3 font-mono text-sm leading-relaxed text-primary-900">{item.formula}</p>
                  {item.example && <p className="mt-4 text-sm leading-relaxed text-navy-700"><span className="font-semibold">Example:</span> {item.example}</p>}
                  {item.answer && <p className="mt-2 text-sm text-navy-600"><span className="font-semibold">Answer:</span> {item.answer}</p>}
                  {item.explanation && <p className="mt-2 text-sm leading-relaxed text-navy-500">{item.explanation}</p>}
                  {item.formula_reference && <p className="mt-3 break-all text-xs text-navy-400">{item.formula_reference}</p>}
                </article>
              ))}
            </section>
          ) : (
            <StatePanel variant="empty" title="No formulas in this CSV" message="The uploaded file does not include a formula or rule column in the rows scanned." />
          )}
          <p className="text-xs text-navy-400">Formulas and examples above are read from the uploaded file, not from demo content.</p>
        </div>
      )}
    </>
  );
}
