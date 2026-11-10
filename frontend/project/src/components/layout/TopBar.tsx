import { LogOut, Menu, UserRound } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import Breadcrumbs, { type BreadcrumbItem } from '@/components/layout/Breadcrumbs';
import { findRouteContext } from '@/config/routes';
import { useAuth } from '@/hooks/useAuth';

interface TopBarProps {
  onOpenMobileNav: () => void;
}

function buildBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const context = findRouteContext(pathname);
  if (!context) return [{ label: 'Page not found' }];
  return [
    { label: context.section.title },
    { label: context.route.label },
  ];
}

export default function TopBar({ onOpenMobileNav }: TopBarProps) {
  const { pathname } = useLocation();
  const { signOut } = useAuth();

  return (
    <header className="sticky top-0 z-30 flex h-16 flex-shrink-0 items-center gap-3 border-b border-neutral-200/80 bg-white/90 px-4 backdrop-blur supports-[backdrop-filter]:bg-white/75 sm:px-6">
      <button
        type="button"
        onClick={onOpenMobileNav}
        aria-label="Open navigation menu"
        className="rounded-lg p-2 text-navy-600 transition-colors hover:bg-neutral-100 hover:text-navy-900 lg:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="min-w-0 flex-1">
        <Breadcrumbs items={buildBreadcrumbs(pathname)} />
      </div>

      <button
        type="button"
        onClick={() => void signOut()}
        aria-label="Sign out"
        className="flex flex-shrink-0 items-center gap-2 rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-navy-600 shadow-sm transition-colors hover:border-neutral-300 hover:bg-neutral-50 hover:text-navy-900"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        <span className="hidden md:inline">Sign out</span>
      </button>

      <Link
        to="/profile"
        aria-label="Open student profile"
        className="flex flex-shrink-0 items-center gap-2 rounded-full border border-neutral-200 bg-white py-1 pl-1 pr-3 text-sm font-medium text-navy-700 shadow-sm transition-colors hover:border-accent-200 hover:bg-accent-50 hover:text-accent-700"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-900 text-white">
          <UserRound className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="hidden sm:inline">Student</span>
      </Link>
    </header>
  );
}
