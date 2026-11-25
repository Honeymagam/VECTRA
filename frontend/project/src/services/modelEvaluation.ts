import { api } from '@/lib/api';

export interface ModelEvaluationReport {
  evaluated_at: string;
  benchmark: string;
  sample_size: number;
  topic_count: number;
  embedding_model: string;
  tutor_model: string | null;
  answer_accuracy: {
    label: string;
    percentage: number | null;
    numerator: number;
    denominator: number;
    confidence_95_percent: { lower: number; upper: number };
    macro_f1_percent?: number | null;
    per_class?: Record<string, { support: number; precision_percent: number; recall_percent: number; f1_percent: number }>;
  } | null;
  retrieval: {
    hit_at_5_percent: number;
    precision_at_5_percent: number;
    recall_at_5_percent: number;
    mrr_at_5_percent: number;
    ndcg_at_5_percent: number;
    numerator: number;
    denominator: number;
  };
  per_topic?: Record<string, {
    questions: number;
    answer_accuracy_percent: number | null;
    retrieval_hit_at_5_percent: number;
    mrr_at_5_percent: number;
  }>;
  dataset_count?: number;
  datasets?: Record<string, {
    questions: number;
    answered_questions?: number;
    answer_accuracy_percent: number | null;
    retrieval_hit_at_5_percent: number;
    mrr_at_5_percent: number;
  }>;
  limitations: string[];
}

export interface ModelEvaluationResponse {
  embedding_model: string;
  tutor_model: string;
  report: ModelEvaluationReport | null;
  real_data_report: ModelEvaluationReport | null;
}

export function fetchLatestModelEvaluation() {
  return api<ModelEvaluationResponse>('/model-evaluation/latest');
}
