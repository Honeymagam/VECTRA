import { api } from '@/lib/api';

export const RESOURCE_TYPES = ['document', 'video', 'article', 'notes'] as const;
export type ResourceType = (typeof RESOURCE_TYPES)[number];
export type ResourceStatus = 'queued' | 'processing' | 'ready' | 'failed';

export interface KnowledgeResource {
  id: string;
  title: string;
  resource_type: ResourceType;
  source_url: string | null;
  notes: string | null;
  status: ResourceStatus;
  created_at: string;
  chunk_count: number;
}

interface ApiDocument { id: number; filename: string; file_type: string; status: string; created_at: string; chunk_count: number; }
function fromDocument(doc: ApiDocument): KnowledgeResource {
  const status: ResourceStatus = doc.status === 'COMPLETED' ? 'ready' : doc.status === 'FAILED' ? 'failed' : doc.status === 'PROCESSING' ? 'processing' : 'queued';
  return { id: String(doc.id), title: doc.filename, resource_type: 'document', source_url: null, notes: null, status, created_at: doc.created_at, chunk_count: doc.chunk_count };
}

export async function listKnowledgeResources(): Promise<KnowledgeResource[]> {
  return (await api<ApiDocument[]>('/documents')).map(fromDocument);
}
export async function createKnowledgeResource(file: File): Promise<KnowledgeResource> {
  const body = new FormData(); body.append('file', file);
  const doc = await api<ApiDocument>('/documents/upload', { method: 'POST', body });
  return fromDocument(doc);
}
export async function deleteKnowledgeResource(id: string): Promise<void> {
  await api<void>(`/documents/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
