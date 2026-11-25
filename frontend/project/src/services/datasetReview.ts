import { api } from '@/lib/api';
import type { IndexingProgress } from '@/services/knowledgeResources';

export interface DatasetRecord {
  record_id: string;
  topic: string;
  difficulty: string;
  source: string;
  question: string;
  formula: string;
  answer: string;
  explanation: string;
}

export interface DatasetFormula {
  topic: string;
  formula: string;
  formula_reference: string;
  example: string;
  answer: string;
  explanation: string;
}

export interface DatasetReview {
  document: null | {
    id: number;
    filename: string;
    status: string;
    file_size_bytes: number;
    chunk_count: number;
    indexing_progress: IndexingProgress | null;
  };
  summary: {
    records_previewed: number;
    records_scanned_for_formulas: number;
    topic_count: number;
    formula_count: number;
  };
  records: DatasetRecord[];
  formulas: DatasetFormula[];
}

export function loadDatasetReview() {
  return api<DatasetReview>('/dataset-review');
}
