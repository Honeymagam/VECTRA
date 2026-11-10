import { api } from '@/lib/api';
import { normalizeTopic, type PracticeQuestion } from '@/services/practice';

export const MOCK_TEST_QUESTION_COUNT = 10;
export const MOCK_TEST_SECONDS = 10 * 60;

export interface MockTestAnswer {
  questionId: number;
  selectedIndex: number | null;
}

export interface MockTestGrade {
  questionId: number;
  selectedIndex: number | null;
  isCorrect: boolean;
  correctIndex: number;
  explanation: string;
}

export interface MockTestReviewItem {
  question: PracticeQuestion;
  selectedIndex: number | null;
  isCorrect: boolean;
  correctIndex: number;
  explanation: string;
}

export interface MockTestAttempt {
  correctCount: number;
  totalCount: number;
  durationSeconds: number;
  items: MockTestReviewItem[];
}

let activeMockTestId: number | null = null;
let activeMockQuestions: PracticeQuestion[] = [];

export function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export async function fetchMockTestQuestions(): Promise<PracticeQuestion[]> {
  const result = await api<{ mock_test_id: number | null; questions: Array<{ id: number; question_text: string; options: string[]; difficulty: string; topic: string | null }> }>('/mock-tests/quick-start', { method: 'POST' });
  activeMockTestId = result.mock_test_id;
  activeMockQuestions = result.questions.map((row) => ({ id: row.id, question: row.question_text, options: row.options, difficulty: row.difficulty.toLowerCase() as PracticeQuestion['difficulty'], topic: normalizeTopic(row.topic) }));
  return activeMockQuestions;
}

export async function submitMockTest(answers: MockTestAnswer[], durationSeconds: number): Promise<MockTestGrade[]> {
  if (activeMockTestId === null) throw new Error('Start a mock test before submitting answers');
  const questionById = new Map(activeMockQuestions.map((question) => [question.id, question]));
  const selectedIndexById = new Map(answers.map((answer) => [answer.questionId, answer.selectedIndex]));
  const result = await api<{ grades: Array<{ question_id: number; is_correct: boolean; correct_index: number; explanation: string }> }>(`/mock-tests/${activeMockTestId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ answers: answers.map((answer) => {
      const question = questionById.get(answer.questionId);
      if (!question) throw new Error(`Question ${answer.questionId} is unavailable`);
      return { question_id: answer.questionId, selected_answer: answer.selectedIndex === null ? '' : question.options[answer.selectedIndex], solving_time_seconds: durationSeconds / Math.max(answers.length, 1), hints_used: 0, confidence_score: 0.5 };
    }) }),
  });
  activeMockTestId = null;
  return result.grades.map((grade) => ({ questionId: grade.question_id, selectedIndex: selectedIndexById.get(grade.question_id) ?? null, isCorrect: grade.is_correct, correctIndex: grade.correct_index, explanation: grade.explanation }));
}

export function buildMockTestAttempt(
  questions: PracticeQuestion[],
  grades: MockTestGrade[],
  durationSeconds: number,
): MockTestAttempt {
  const gradeById = new Map(grades.map((grade) => [grade.questionId, grade]));
  const items = questions.flatMap((question): MockTestReviewItem[] => {
    const grade = gradeById.get(question.id);
    if (!grade) return [];
    return [
      {
        question,
        selectedIndex: grade.selectedIndex,
        isCorrect: grade.isCorrect,
        correctIndex: grade.correctIndex,
        explanation: grade.explanation,
      },
    ];
  });

  return {
    correctCount: items.filter((item) => item.isCorrect).length,
    totalCount: items.length,
    durationSeconds,
    items,
  };
}
