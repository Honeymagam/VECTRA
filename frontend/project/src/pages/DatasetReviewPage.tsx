import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Database, FileSpreadsheet, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import StatePanel from '@/components/ui/StatePanel';
import { loadDatasetReview, type DatasetReview } from '@/services/datasetReview';

function formatBytes(bytes: number) {
  if (bytes >= 1_000_000_000) return `${(bytes / 1_000_000_000).toFixed(2)} GB`;
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(1)} MB`;
  return `${(bytes / 1_000).toFixed(0)} KB`;
}

function IndexingSummary({ data }: { data: NonNullable<DatasetReview['document']> }) {
  const progress = data.indexing_progress;
  if (data.status !== 'PROCESSING' || !progress) return null;
  return (
    <section className="rounded-2xl border border-primary-100 bg-primary-50/60 p-5" aria-label="Dataset indexing progress">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-navy-900">Indexing this CSV</h2>
          <p className="mt-1 text-xs text-navy-600">
            {progress.records_processed.toLocaleString()} rows scanned · {progress.chunks_created.toLocaleString()} chunks indexed{progress.chunks_skipped ? ` · ${progress.chunks_skipped.toLocaleString()} skipped` : ''}
          </p>
        </div>
        <span className="text-sm font-semibold tabular-nums text-primary-700">{progress.percent.toFixed(2)}%</span>
      </div>
      <div role="progressbar" aria-label="Dataset indexing progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress.percent} className="mt-3 h-2 overflow-hidden rounded-full bg-white">
        <div className="h-full rounded-full bg-primary-500 transition-[width] duration-500" style={{ width: `${Math.max(1, progress.percent)}%` }} />
      </div>
      <p className="mt-2 text-xs text-navy-500">{formatBytes(progress.bytes_processed)} of {formatBytes(progress.bytes_total)} read</p>
    </section>
  );
}

export default function DatasetReviewPage() {
  const [data, setData] = useState<DatasetReview | null>(null);
  const [failed, setFailed] = useState(false);
  const load = useCallback(async () => {
    try { setData(await loadDatasetReview()); setFailed(false); }
    catch { setFailed(true); }
  }, []);

  useEffect(() => { document.title = 'Dataset Review | VECTRA'; void load(); }, [load]);
  useEffect(() => {
    if (data?.document?.status !== 'PROCESSING') return;
    const timer = window.setInterval(() => void load(), 10000);
    return () => window.clearInterval(timer);
  }, [data?.document?.status, load]);

  return (
    <>
      <PageHeader
        eyebrow="Uploaded data"
        title="Dataset Review"
        description="Review actual rows and formulas from the latest CSV in your resource library."
        actions={<Link to="/formulas" className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-700 shadow-card hover:bg-neutral-50">Formula library<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>}
      />

      {data === null && !failed && <StatePanel variant="loading" title="Loading dataset" message="Reading the latest uploaded CSV." />}
      {failed && <StatePanel variant="error" title="Dataset could not be loaded" message="Check your connection and try again." />}
      {data && !data.document && <StatePanel variant="empty" title="No uploaded CSV yet" message="Upload a CSV in Knowledge Extraction to review its actual records and formulas here." />}

      {data?.document && (
        <div className="space-y-6 animate-fade-in">
          <section className="grid gap-4 sm:grid-cols-3" aria-label="Uploaded dataset summary">
            {[
              { label: 'File size', value: formatBytes(data.document.file_size_bytes), icon: FileSpreadsheet },
              { label: 'Rows previewed', value: data.summary.records_previewed.toLocaleString(), icon: Database },
              { label: 'Formulas found', value: data.summary.formula_count.toLocaleString(), icon: Sparkles },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-card">
                <div className="flex items-center justify-between"><p className="text-sm font-medium text-navy-500">{label}</p><Icon className="h-4 w-4 text-primary-600" aria-hidden="true" /></div>
                <p className="mt-3 text-2xl font-bold tabular-nums text-navy-900">{value}</p>
              </div>
            ))}
          </section>

          <IndexingSummary data={data.document} />

          <section className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-card sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary-600">Uploaded CSV · {data.document.status.toLowerCase()}</p>
                <h2 className="mt-1 text-lg font-semibold text-navy-900">{data.document.filename}</h2>
                <p className="mt-1 text-sm text-navy-500">Showing the first {data.summary.records_previewed} records from the actual uploaded file. Formula discovery scanned {data.summary.records_scanned_for_formulas.toLocaleString()} rows and found {data.summary.topic_count} topics.</p>
              </div>
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-navy-700">{data.document.chunk_count.toLocaleString()} indexed chunks</span>
            </div>
            <div className="mt-5 overflow-x-auto rounded-xl border border-neutral-200">
              <table className="w-full min-w-[1120px] text-left text-sm">
                <thead className="bg-neutral-50 text-xs uppercase tracking-wide text-navy-500">
                  <tr>
                    {['Record', 'Topic', 'Level', 'Source values', 'Question', 'Formula', 'Answer'].map((heading) => <th key={heading} className="px-4 py-3 font-semibold">{heading}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {data.records.map((row) => (
                    <tr key={row.record_id}>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-navy-500">{row.record_id}</td>
                      <td className="px-4 py-3 font-medium text-navy-800">{row.topic}</td>
                      <td className="px-4 py-3 text-navy-600">{row.difficulty || '—'}</td>
                      <td className="max-w-64 px-4 py-3 text-navy-700">{row.source || '—'}</td>
                      <td className="max-w-96 px-4 py-3 text-navy-700">{row.question || '—'}</td>
                      <td className="max-w-72 px-4 py-3 font-mono text-xs text-primary-800">{row.formula || '—'}</td>
                      <td className="px-4 py-3 text-navy-700">{row.answer || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.records.length === 0 && <p className="py-8 text-center text-sm text-navy-500">The uploaded CSV has no data rows to preview.</p>}
            <p className="mt-3 text-xs text-navy-400">Rows shown here are read directly from the uploaded CSV. The current 5 GB file contains synthetic stress-test records.</p>
          </section>
        </div>
      )}
    </>
  );
}
