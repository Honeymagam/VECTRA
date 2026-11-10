import { useCallback, useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import AddResourceForm from '@/components/knowledge/AddResourceForm';
import ResourceList from '@/components/knowledge/ResourceList';
import Modal from '@/components/ui/Modal';
import PageHeader from '@/components/ui/PageHeader';
import StatePanel from '@/components/ui/StatePanel';
import {
  deleteKnowledgeResource,
  listKnowledgeResources,
  type KnowledgeResource,
} from '@/services/knowledgeResources';

export default function KnowledgeExtractionPage() {
  const [resources, setResources] = useState<KnowledgeResource[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [removeError, setRemoveError] = useState<string | null>(null);

  const loadResources = useCallback(async () => {
    setLoadFailed(false);
    try {
      setResources(await listKnowledgeResources());
    } catch {
      setLoadFailed(true);
    }
  }, []);

  useEffect(() => {
    document.title = 'Knowledge Extraction | VECTRA';
    void loadResources();
  }, [loadResources]);

  useEffect(() => {
    if (!resources?.some((resource) => resource.status === 'queued' || resource.status === 'processing')) return;
    const timer = window.setInterval(() => void loadResources(), 3000);
    return () => window.clearInterval(timer);
  }, [resources, loadResources]);

  const closeAddModal = useCallback(() => setAddOpen(false), []);

  function handleCreated(resource: KnowledgeResource) {
    setResources((current) => [resource, ...(current ?? [])]);
    setAddOpen(false);
  }

  async function handleDelete(resource: KnowledgeResource) {
    if (!window.confirm(`Remove "${resource.title}" from your library?`)) return;

    setDeletingId(resource.id);
    setRemoveError(null);
    try {
      await deleteKnowledgeResource(resource.id);
      setResources((current) => (current ?? []).filter((item) => item.id !== resource.id));
    } catch {
      setRemoveError('We could not remove that resource. Please try again.');
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Core Intelligence"
        title="Knowledge Extraction"
        description="Manage learning resources and track how each one is processed into structured knowledge."
        actions={
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-600/20 transition-all hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-lg"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add resource
          </button>
        }
      />

      {resources === null && !loadFailed && (
        <StatePanel variant="loading" title="Loading your library" message="Fetching your learning resources." />
      )}

      {loadFailed && (
        <div className="space-y-4">
          <StatePanel
            variant="error"
            title="Your library could not be loaded"
            message="Check your connection and try again."
          />
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => void loadResources()}
              className="rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-navy-700 shadow-card transition-colors hover:bg-neutral-50"
            >
              Try again
            </button>
          </div>
        </div>
      )}

      {resources !== null && resources.length === 0 && (
        <div className="space-y-4">
          <StatePanel
            variant="empty"
            title="No resources yet"
            message="Add a document, video, article or your own notes to start building your knowledge base."
          />
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-600/20 transition-all hover:bg-primary-700"
            >
              Add your first resource
            </button>
          </div>
        </div>
      )}

      {resources !== null && resources.length > 0 && (
        <div className="space-y-4">
          {removeError && (
            <p role="alert" className="rounded-xl bg-error-50 px-4 py-3 text-sm text-error-700">
              {removeError}
            </p>
          )}
          <ResourceList resources={resources} deletingId={deletingId} onDelete={handleDelete} />
        </div>
      )}

      <Modal
        open={addOpen}
        title="Add a learning resource"
        description="Resources are stored in your library so they can be processed into knowledge."
        onClose={closeAddModal}
      >
        <AddResourceForm onCreated={handleCreated} onCancel={closeAddModal} />
      </Modal>
    </>
  );
}
