import { useState, type FormEvent } from 'react';
import { createKnowledgeResource, type KnowledgeResource } from '@/services/knowledgeResources';

interface AddResourceFormProps {
  onCreated: (resource: KnowledgeResource) => void;
  onCancel: () => void;
}

const INPUT_CLASS =
  'w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-navy-900 placeholder:text-navy-300 transition-colors focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20';
const MAX_CSV_BYTES = 5_000_000_000;
const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;

async function isCsvFile(file: File): Promise<boolean> {
  if (file.name.toLowerCase().endsWith('.csv') || file.type === 'text/csv') return true;
  if (file.size <= MAX_DOCUMENT_BYTES || file.type === 'application/pdf') return false;
  try {
    const sample = await file.slice(0, 8192).text();
    if (sample.startsWith('%PDF-') || sample.startsWith('PK')) return false;
    const firstLine = sample.split(/\r?\n/, 1)[0];
    return /[,;\t|]/.test(firstLine) && sample.includes('\n');
  } catch {
    return false;
  }
}

export default function AddResourceForm({ onCreated, onCancel }: AddResourceFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!file) {
      setError('Choose a PDF, DOCX, TXT, or CSV file to upload.');
      return;
    }
    const isCsv = await isCsvFile(file);
    if (file.size > (isCsv ? MAX_CSV_BYTES : MAX_DOCUMENT_BYTES)) {
      setError(isCsv ? 'CSV files can be up to 5 GB.' : 'PDF, DOCX, and TXT files can be up to 20 MB. Use CSV for larger datasets.');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const created = await createKnowledgeResource(file);
      onCreated(created);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'We could not save this resource. Please try again.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      <div className="space-y-2">
        <label htmlFor="resource-title" className="text-sm font-medium text-navy-800">
          Learning file
        </label>
        <input
          id="resource-title"
          type="file"
          accept=".pdf,.docx,.txt,.csv"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className={INPUT_CLASS}
          autoFocus
        />
      </div>

  <p className="text-xs text-navy-500">Supported formats: PDF, DOCX, TXT (up to 20 MB) and CSV (up to 5 GB). Large CSV files are indexed in the background after upload.</p>

      {error && (
        <p role="alert" className="rounded-xl bg-error-50 px-4 py-3 text-sm text-error-700">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-navy-600 transition-colors hover:bg-neutral-100 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-xl bg-primary-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-600/20 transition-all hover:bg-primary-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Uploading file...' : 'Add resource'}
        </button>
      </div>
    </form>
  );
}
