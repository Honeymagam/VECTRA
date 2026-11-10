import type { PracticeTopic } from '@/services/practice';

export const CONCEPT_PREREQUISITES: Record<PracticeTopic, PracticeTopic[]> = {
  percentages: [],
  time_and_work: ['percentages'],
  number_series: [],
};

export const MASTERY_THRESHOLD = 70;
export const DEVELOPING_THRESHOLD = 40;
