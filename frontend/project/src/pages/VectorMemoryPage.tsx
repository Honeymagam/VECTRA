import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Clock,
  FileText,
  Globe,
  Layers,
  Link as LinkIcon,
  type LucideIcon,
  RefreshCw,
  Video,
} from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatePanel from '@/components/ui/StatePanel';
import { listKnowledgeResources } from '@/services/knowledgeResources';

/* ─── Types ─────────────────────────────────────────────────────────────── */

type ResourceStatus = 'queued' | 'processing' | 'ready' | 'failed';
type ResourceType = 'document' | 'video' | 'article' | 'link' | 'notes';

interface KnowledgeResource {
  id: string;
  title: string;
  resource_type: ResourceType;
  status: ResourceStatus;
  created_at: string;
  notes: string | null;
  chunk_count?: number;
}

type FilterOption = 'all' | ResourceStatus;
const EMPTY_RESOURCES: KnowledgeResource[] = [];

/* ─── Mock data ──────────────────────────────────────────────────────────── */

const STATUS_BADGE: Record<ResourceStatus, { label: string; classes: string }> = {
  queued:     { label: 'Queued',     classes: 'bg-neutral-100 text-neutral-600' },
  processing: { label: 'Processing', classes: 'bg-warning-50 text-warning-700' },
  ready:      { label: 'Ready',      classes: 'bg-success-50 text-success-700' },
  failed:     { label: 'Failed',     classes: 'bg-error-50 text-error-700' },
};

const STATUS_DOT: Record<ResourceStatus, string> = {
  queued:     'bg-neutral-400',
  processing: 'bg-warning-400 animate-pulse',
  ready:      'bg-success-500',
  failed:     'bg-error-500',
};

const TYPE_ICON: Record<ResourceType, LucideIcon> = {
  document: FileText,
  video:    Video,
  article:  Globe,
  link:     LinkIcon,
  notes:    BookOpen,
};

const FILTERS: { value: FilterOption; label: string }[] = [
  { value: 'all',        label: 'All' },
  { value: 'ready',      label: 'Ready' },
  { value: 'processing', label: 'Processing' },
  { value: 'failed',     label: 'Failed' },
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

type ViewState = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; data: KnowledgeResource[] };

/* ─── Page ───────────────────────────────────────────────────────────────── */

export default function VectorMemoryPage() {
  const [view, setView] = useState<ViewState>({ kind: 'loading' });
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    document.title = 'Vector Memory Bank | VECTRA';
  }, [reloadKey]);

  useEffect(() => {
    if (view.kind !== 'ready' || !view.data.some((resource) => resource.status === 'queued' || resource.status === 'processing')) return;
    const timer = window.setInterval(() => setReloadKey((key) => key + 1), 3000);
    return () => window.clearInterval(timer);
  }, [view]);

  useEffect(() => {
    let cancelled = false;
    listKnowledgeResources()
      .then((data) => {
        if (cancelled) return;
        setView({ kind: 'ready', data: data as KnowledgeResource[] });
      })
      .catch(() => { if (!cancelled) setView({ kind: 'error' }); });

    return () => { cancelled = true; };
  }, []);

  const resources = view.kind === 'ready' ? view.data : EMPTY_RESOURCES;

  const filtered = useMemo(
    () => (activeFilter === 'all' ? resources : resources.filter((r) => r.status === activeFilter)),
    [resources, activeFilter],
  );

  const totalChunks = resources.reduce((acc, r) => acc + (r.chunk_count ?? 0), 0);
  const uniqueTopics = new Set(resources.map((r) => r.resource_type)).size;
  const lastAdded = resources.length > 0 ? formatDate(resources[0].created_at) : '—';

  return (
    <>
      <PageHeader
        eyebrow="Core Intelligence"
        title="Vector Memory Bank"
        description="Indexed knowledge resources that power VECTRA's semantic search and AI reasoning."
      />

      {view.kind === 'loading' && (
        <StatePanel variant="loading" title="Loading knowledge base" message="Fetching indexed resources…" />
      )}

      {view.kind === 'error' && (
        <StatePanel variant="error" title="Could not load resources" message="Check your connection and refresh." />
      )}

      {view.kind === 'ready' && (
        <div className="space-y-6 animate-fade-in">
          {/* Summary cards */}
          <section aria-label="Summary" className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              {
                label: 'Total Chunks Indexed',
                value: totalChunks.toLocaleString(),
                icon: Layers,
                color: 'bg-primary-50 text-primary-600',
              },
              {
                label: 'Resource Types',
                value: uniqueTopics.toString(),
                icon: CheckCircle2,
                color: 'bg-success-50 text-success-600',
              },
              {
                label: 'Last Added',
                value: lastAdded,
                icon: Clock,
                color: 'bg-accent-50 text-accent-600',
              },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="rounded-2xl border border-neutral-200/80 bg-white p-5 shadow-card">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-navy-500">{label}</p>
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${color}`}>
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                </div>
                <p className="mt-3 text-2xl font-bold tabular-nums text-navy-900">{value}</p>
              </div>
            ))}
          </section>

          {/* Filter bar */}
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
            {FILTERS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setActiveFilter(value)}
                className={`rounded-xl px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  activeFilter === value
                    ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                    : 'border border-neutral-200 bg-white text-navy-600 shadow-card hover:bg-neutral-50'
                }`}
              >
                {label}
                {value !== 'all' && (
                  <span
                    className={`ml-1.5 rounded-full px-1.5 text-xs ${
                      activeFilter === value ? 'bg-primary-500 text-white' : 'bg-neutral-100 text-navy-500'
                    }`}
                  >
                    {resources.filter((r) => r.status === value).length}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Resource list */}
          {filtered.length === 0 ? (
            <StatePanel
              variant="empty"
              title="No resources"
              message={activeFilter === 'all' ? 'Add resources via Knowledge Extraction.' : `No ${activeFilter} resources.`}
            />
          ) : (
            <div className="rounded-2xl border border-neutral-200/80 bg-white shadow-card">
              <ul className="divide-y divide-neutral-100">
                {filtered.map((resource) => {
                  const TypeIcon = TYPE_ICON[resource.resource_type] ?? FileText;
                  const badge = STATUS_BADGE[resource.status];
                  const dot = STATUS_DOT[resource.status];
                  return (
                    <li
                      key={resource.id}
                      className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-neutral-50/60"
                    >
                      {/* Type icon */}
                      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-500">
                        <TypeIcon className="h-5 w-5" aria-hidden="true" />
                      </span>

                      {/* Info */}
                      <div className="min-w-0 flex-1 space-y-1">
                        <p className="truncate text-sm font-semibold text-navy-800">{resource.title}</p>
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Status badge */}
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge.classes}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
                            {badge.label}
                          </span>
                          {/* Chunk count */}
                          {resource.status === 'ready' && resource.chunk_count !== undefined && (
                            <span className="text-xs text-navy-400">
                              {resource.chunk_count.toLocaleString()} chunks
                            </span>
                          )}
                          {/* Notes */}
                          {resource.notes && (
                            <span className="truncate text-xs text-navy-400" title={resource.notes}>
                              {resource.notes}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Date */}
                      <div className="hidden flex-shrink-0 text-right sm:block">
                        <p className="text-xs text-navy-400">{formatDate(resource.created_at)}</p>
                        <p className="mt-0.5 text-xs capitalize text-navy-300">{resource.resource_type}</p>
                      </div>

                      {/* Processing spinner */}
                      {resource.status === 'processing' && (
                        <RefreshCw className="h-4 w-4 flex-shrink-0 animate-spin text-warning-500" aria-hidden="true" />
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </>
  );
}
