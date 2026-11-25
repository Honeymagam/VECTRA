import { Link } from 'react-router-dom';
import BrandMark from '@/components/layout/BrandMark';

export default function LandingHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between px-6 lg:px-10">
        <Link to="/" aria-label="VECTRA home" className="flex items-center gap-3 transition-opacity hover:opacity-90">
          <BrandMark compact />
          <span className="text-base font-bold tracking-wide text-navy-900">VECTRA</span>
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3" aria-label="Primary navigation">
          <Link
            to="/sign-in"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-navy-700 transition-colors hover:bg-neutral-100 hover:text-navy-900"
          >
            Sign in
          </Link>
          <Link
            to="/sign-in?mode=sign-up"
            className="rounded-xl bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-primary-700"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
