interface MockTestNavigatorProps {
  total: number;
  currentIndex: number;
  answered: boolean[];
  onSelect: (index: number) => void;
}

export default function MockTestNavigator({ total, currentIndex, answered, onSelect }: MockTestNavigatorProps) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-navy-800">Questions</p>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-5 lg:grid-cols-4">
        {Array.from({ length: total }, (_, index) => {
          const isCurrent = index === currentIndex;
          const isAnswered = answered[index];
          return (
            <button
              key={index}
              type="button"
              onClick={() => onSelect(index)}
              aria-label={`Go to question ${index + 1}${isAnswered ? ', answered' : ', unanswered'}`}
              aria-current={isCurrent ? 'step' : undefined}
              className={`flex h-10 items-center justify-center rounded-lg text-sm font-semibold transition-all duration-150 ${
                isCurrent
                  ? 'bg-navy-900 text-white shadow-card'
                  : isAnswered
                    ? 'bg-primary-100 text-primary-800 hover:bg-primary-200'
                    : 'bg-neutral-100 text-navy-500 hover:bg-neutral-200'
              }`}
            >
              {index + 1}
            </button>
          );
        })}
      </div>
      <p className="text-xs leading-relaxed text-navy-400">
        Blue numbers are answered. You can change any answer before you submit.
      </p>
    </div>
  );
}
