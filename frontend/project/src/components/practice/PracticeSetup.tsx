import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import {
  PRACTICE_DIFFICULTIES,
  PRACTICE_TOPICS,
  type PracticeDifficulty,
  type PracticeTopic,
} from '@/services/practice';

interface PracticeSetupProps {
  onStart: (topic: PracticeTopic, difficulty: PracticeDifficulty) => void;
}

const DIFFICULTY_LABELS: Record<PracticeDifficulty, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  mixed: 'Mixed',
};

export default function PracticeSetup({ onStart }: PracticeSetupProps) {
  const [topic, setTopic] = useState<PracticeTopic>(PRACTICE_TOPICS[0].id);
  const [difficulty, setDifficulty] = useState<PracticeDifficulty>('mixed');

  return (
    <div className="space-y-8">
      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-navy-800">Choose a topic</legend>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {PRACTICE_TOPICS.map((item) => {
            const selected = item.id === topic;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={selected}
                onClick={() => setTopic(item.id)}
                className={`rounded-2xl border p-5 text-left transition-all duration-200 hover:-translate-y-0.5 ${
                  selected
                    ? 'border-primary-500 bg-primary-50/60 shadow-card ring-2 ring-primary-500/20'
                    : 'border-neutral-200 bg-white shadow-card hover:border-primary-200 hover:shadow-card-hover'
                }`}
              >
                <span className="block text-base font-semibold text-navy-900">{item.label}</span>
                <span className="mt-1 block text-sm leading-relaxed text-navy-500">{item.description}</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-navy-800">Difficulty</legend>
        <div className="inline-flex flex-wrap gap-1 rounded-xl bg-neutral-100 p-1">
          {PRACTICE_DIFFICULTIES.map((level) => {
            const selected = level === difficulty;
            return (
              <button
                key={level}
                type="button"
                aria-pressed={selected}
                onClick={() => setDifficulty(level)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all ${
                  selected ? 'bg-white text-navy-900 shadow-card' : 'text-navy-500 hover:text-navy-800'
                }`}
              >
                {DIFFICULTY_LABELS[level]}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => onStart(topic, difficulty)}
          className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-primary-600/20 transition-all hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-lg"
        >
          Start practice
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
