import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-sm">
        <li className="flex-shrink-0">
          <Link
            to="/dashboard"
            aria-label="Dashboard home"
            className="flex items-center rounded-md p-1 text-navy-400 transition-colors hover:text-navy-900"
          >
            <Home className="h-4 w-4" aria-hidden="true" />
          </Link>
        </li>
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
              <ChevronRight className="h-4 w-4 flex-shrink-0 text-navy-300" aria-hidden="true" />
              {item.to && !isLast ? (
                <Link
                  to={item.to}
                  className="truncate rounded-md px-1 text-navy-500 transition-colors hover:text-navy-900"
                >
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={isLast ? 'page' : undefined}
                  className={`truncate px-1 ${isLast ? 'font-semibold text-navy-900' : 'text-navy-500'}`}
                >
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
