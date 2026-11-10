import { api } from '@/lib/api';

export const PRACTICE_TOPICS = [
  {
    id: 'percentages',
    label: 'Percentages',
    description: 'Discounts, increases, successive changes and comparisons.',
  },
  {
    id: 'time_and_work',
    label: 'Time and Work',
    description: 'Combined rates, pipes and tanks, and worker-day problems.',
  },
  {
    id: 'number_series',
    label: 'Number Series',
    description: 'Spot the pattern and find the missing term.',
  },
] as const;

export const PRACTICE_DIFFICULTIES = ['easy', 'medium', 'hard', 'mixed'] as const;

export type PracticeTopic = (typeof PRACTICE_TOPICS)[number]['id'];
export type PracticeDifficulty = (typeof PRACTICE_DIFFICULTIES)[number];
export type QuestionDifficulty = Exclude<PracticeDifficulty, 'mixed'>;

export interface PracticeQuestion {
  id: number;
  topic: PracticeTopic;
  difficulty: QuestionDifficulty;
  question: string;
  options: string[];
}

export interface PracticeAnswerResult {
  isCorrect: boolean;
  correctIndex: number;
  explanation: string;
}

export async function fetchQuestionBank(
  filters: { topic?: PracticeTopic; difficulty?: QuestionDifficulty } = {},
): Promise<PracticeQuestion[]> {
  const rows = await api<Array<{ id: number; question_text: string; options: string[]; difficulty: string; topic: string | null }>>('/questions');
  return rows.map((row) => ({
    id: row.id,
    topic: normalizeTopic(row.topic),
    difficulty: row.difficulty.toLowerCase() as QuestionDifficulty,
    question: row.question_text,
    options: row.options,
  })).filter((row) => row.options.length >= 2
    && (!filters.topic || row.topic === filters.topic)
    && (!filters.difficulty || row.difficulty === filters.difficulty));
}

export function normalizeTopic(value: string | null): PracticeTopic {
  const topic = (value ?? '').toLowerCase().replace(/[^a-z]/g, '');
  if (topic.includes('percent')) return 'percentages';
  if (topic.includes('timeandwork') || topic.includes('work')) return 'time_and_work';
  return 'number_series';
}

export function fetchPracticeQuestions(
  topic: PracticeTopic,
  difficulty: PracticeDifficulty,
): Promise<PracticeQuestion[]> {
  return fetchQuestionBank({
    topic,
    difficulty: difficulty === 'mixed' ? undefined : difficulty,
  });
}

export async function submitPracticeAnswer(questionId: number, selectedIndex: number, selectedAnswer: string, solvingTimeSeconds = 0): Promise<PracticeAnswerResult> {
  const row = await api<{ is_correct: boolean; explanation: string; correct_index: number }>(`/practice/frontend/answer`, {
    method: 'POST',
    body: JSON.stringify({ question_id: questionId, selected_answer: selectedAnswer, solving_time_seconds: solvingTimeSeconds, hints_used: 0, confidence_score: 0.5 }),
  });
  return { isCorrect: row.is_correct, correctIndex: row.correct_index, explanation: row.explanation };
}
