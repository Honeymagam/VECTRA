import { ExternalLink, FileText, Newspaper, StickyNote, Trash2, Video, type LucideIcon } from 'lucide-react';
import {
  type KnowledgeResource,
  type ResourceStatus,
  type ResourceType,
} from '@/services/knowledgeResources';

interface ResourceListProps {
  resources: KnowledgeResource[];
  deletingId: string | null;
  onDelete: (resource: KnowledgeResource) => void;
}

const TYPE_ICONS: Record<ResourceType, LucideIcon> = {
  document: FileText,
  video: Video,
  article: Newspaper,
  notes: StickyNote,
};

const STATUS_STYLES: Record<ResourceStatus, { label: string; className: string }> = {
  queued: { label: 'Queued', className: 'bg-neutral-100 text-navy-700' },
  processing: { label: 'Processing', className: 'bg-primary-50 text-primary-700' },
  ready: { label: 'Ready', className: 'bg-success-50 text-success-700' },
  failed: { label: 'Failed', className: 'bg-error-50 text-error-700' },
};

const DATE_FORMAT = new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' });

function formatBytes(bytes: number) {
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
}

export default function ResourceList({ resources, deletingId, onDelete }: ResourceListProps) {
  return (
    <ul className="space-y-3">
      {resources.map((resource) => {
        const TypeIcon = TYPE_ICONS[resource.resource_type];
        const status = STATUS_STYLES[resource.status];
        const isDeleting = deletingId === resource.id;

        return (
          <li
            key={resource.id}
            className="flex items-start gap-4 rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-card transition-all duration-200 hover:shadow-card-hover"
          >
            <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
              <TypeIcon className="h-5 w-5" aria-hidden="true" />
            </span>

            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate text-base font-semibold text-navy-900">{resource.title}</h2>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${status.className}`}>
                  {status.label}
                </span>
              </div>
              <p className="text-xs text-navy-400">
                Added {DATE_FORMAT.format(new Date(resource.created_at))}
              </p>
              {resource.status === 'processing' && resource.indexing_progress && (
                <div className="max-w-2xl space-y-2 pt-1">
                  <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-navy-600">
                    <span>{resource.indexing_progress.records_processed.toLocaleString()} rows scanned · {resource.indexing_progress.chunks_created.toLocaleString()} chunks indexed{resource.indexing_progress.chunks_skipped ? ` · ${resource.indexing_progress.chunks_skipped.toLocaleString()} skipped` : ''}</span>
                    <span>{resource.indexing_progress.percent.toFixed(2)}%</span>
                  </div>
                  <div
                    role="progressbar"
                    aria-label={`Indexing ${resource.title}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={resource.indexing_progress.percent}
                    className="h-2 overflow-hidden rounded-full bg-neutral-100"
                  >
                    <div className="h-full rounded-full bg-primary-500 transition-[width] duration-500" style={{ width: `${Math.max(1, resource.indexing_progress.percent)}%` }} />
                  </div>
                  <p className="text-xs text-navy-400">
                    {formatBytes(resource.indexing_progress.bytes_processed)} of {formatBytes(resource.indexing_progress.bytes_total)} read
                  </p>
                </div>
              )}
              {resource.status === 'failed' && resource.indexing_progress?.error && (
                <p className="text-xs text-error-700">Indexing stopped: {resource.indexing_progress.error}</p>
              )}
              {resource.notes && <p className="text-sm leading-relaxed text-navy-500">{resource.notes}</p>}
              {resource.source_url && (
                <a
                  href={resource.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 transition-colors hover:text-primary-800"
                >
                  Open link
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              )}
            </div>

            <button
              type="button"
              onClick={() => onDelete(resource)}
              disabled={isDeleting}
              aria-label={`Remove ${resource.title}`}
              className="rounded-lg p-2 text-navy-400 transition-colors hover:bg-error-50 hover:text-error-600 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </li>
        );
      })}
    </ul>
  );
}
