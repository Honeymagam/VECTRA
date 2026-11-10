import { api } from '@/lib/api';
import { PRACTICE_TOPICS, normalizeTopic, type PracticeTopic } from '@/services/practice';

export const MIN_TOPIC_ATTEMPTS = 5;
export const ACTIVITY_WINDOW_DAYS = 14;

export interface TopicReadiness {
  topic: PracticeTopic;
  label: string;
  attempts: number;
  accuracy: number | null;
}

export interface ReadinessSummary {
  practiceAttempts: number;
  practiceAccuracy: number | null;
  mockTests: number;
  mockAverageScore: number | null;
  secondsPerMockQuestion: number | null;
  activeDays: number;
  topics: TopicReadiness[];
}

interface PracticeRow {
  is_correct: boolean;
  created_at: string;
  question: { topic: string } | null;
}

interface MockRow {
  total_questions: number;
  correct_answers: number;
  duration_seconds: number;
  created_at: string;
}

function percent(numerator: number, denominator: number): number | null {
  if (denominator === 0) return null;
  return Math.round((numerator / denominator) * 100);
}

function dayKey(date: Date): string {
  return date.toDateString();
}

function summarizeReadiness(practiceRows: PracticeRow[], mockRows: MockRow[], now: Date): ReadinessSummary {
  const validPractice = practiceRows.filter((row) => row.question && typeof row.question.topic === 'string');

  const practiceCorrect = validPractice.filter((row) => row.is_correct).length;

  const topics = PRACTICE_TOPICS.map((topic): TopicReadiness => {
    const rows = validPractice.filter((row) => row.question?.topic === topic.id);
    const attempts = rows.length;
    const correct = rows.filter((row) => row.is_correct).length;
    return {
      topic: topic.id,
      label: topic.label,
      attempts,
      accuracy: attempts >= MIN_TOPIC_ATTEMPTS ? percent(correct, attempts) : null,
    };
  });

  const mockQuestions = mockRows.reduce((sum, row) => sum + row.total_questions, 0);
  const mockCorrect = mockRows.reduce((sum, row) => sum + row.correct_answers, 0);
  const mockSeconds = mockRows.reduce((sum, row) => sum + row.duration_seconds, 0);

  const windowDays = new Set<string>();
  for (let offset = 0; offset < ACTIVITY_WINDOW_DAYS; offset += 1) {
    windowDays.add(dayKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() - offset)));
  }
  const activeDays = new Set(
    [...validPractice.map((row) => row.created_at), ...mockRows.map((row) => row.created_at)]
      .map((timestamp) => dayKey(new Date(timestamp)))
      .filter((key) => windowDays.has(key)),
  );

  return {
    practiceAttempts: validPractice.length,
    practiceAccuracy: percent(practiceCorrect, validPractice.length),
    mockTests: mockRows.length,
    mockAverageScore: percent(mockCorrect, mockQuestions),
    secondsPerMockQuestion: mockQuestions === 0 ? null : Math.round(mockSeconds / mockQuestions),
    activeDays: activeDays.size,
    topics,
  };
}

export async function fetchReadinessSummary(): Promise<ReadinessSummary> {
  const activity = await api<{ practice_rows: PracticeRow[]; mock_rows: MockRow[] }>('/analytics/activity');
  return summarizeReadiness(
    activity.practice_rows.map((row) => ({ ...row, question: row.question ? { topic: normalizeTopic(row.question.topic) } : null })),
    activity.mock_rows,
    new Date(),
  );
}
