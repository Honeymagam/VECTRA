import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, description, eyebrow, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 pb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0 space-y-2">
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-600">{eyebrow}</p>
        )}
        <h1 className="text-2xl font-bold leading-tight text-navy-900 sm:text-3xl">{title}</h1>
        {description && (
          <p className="max-w-2xl text-sm leading-relaxed text-navy-500 sm:text-base">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-shrink-0 flex-wrap gap-3">{actions}</div>}
    </header>
  );
}
