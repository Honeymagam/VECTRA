import type { LucideIcon } from 'lucide-react';
import { AlertCircle, Inbox, Loader2 } from 'lucide-react';

type StateVariant = 'empty' | 'loading' | 'error';

interface StatePanelProps {
  variant: StateVariant;
  title: string;
  message: string;
  icon?: LucideIcon;
}

const VARIANT_STYLES: Record<StateVariant, { wrapper: string; iconWrapper: string; iconClass: string; defaultIcon: LucideIcon }> = {
  empty: {
    wrapper: 'border-neutral-200 bg-neutral-50/60',
    iconWrapper: 'bg-white text-navy-400 shadow-card',
    iconClass: '',
    defaultIcon: Inbox,
  },
  loading: {
    wrapper: 'border-primary-100 bg-primary-50/50',
    iconWrapper: 'bg-white text-primary-600 shadow-card',
    iconClass: 'animate-spin',
    defaultIcon: Loader2,
  },
  error: {
    wrapper: 'border-error-200 bg-error-50/60',
    iconWrapper: 'bg-white text-error-600 shadow-card',
    iconClass: '',
    defaultIcon: AlertCircle,
  },
};

export default function StatePanel({ variant, title, message, icon }: StatePanelProps) {
  const styles = VARIANT_STYLES[variant];
  const Icon = icon ?? styles.defaultIcon;

  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-6 py-12 text-center animate-fade-in ${styles.wrapper}`}
    >
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${styles.iconWrapper}`}>
        <Icon className={`h-6 w-6 ${styles.iconClass}`} aria-hidden="true" />
      </div>
      <div className="space-y-1">
        <h3 className="text-base font-semibold text-navy-900">{title}</h3>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-navy-500">{message}</p>
      </div>
    </div>
  );
}
