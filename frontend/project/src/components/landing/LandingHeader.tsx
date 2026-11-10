import { Link } from 'react-router-dom';
import BrandMark from '@/components/layout/BrandMark';

export default function LandingHeader() {
  return (
    <header className="absolute inset-x-0 top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 lg:px-10">
        <Link to="/" aria-label="VECTRA home" className="transition-opacity hover:opacity-90">
          <BrandMark />
        </Link>
        <nav className="flex items-center gap-2 sm:gap-3" aria-label="Primary">
          <Link
            to="/sign-in"
            className="rounded-xl px-4 py-2 text-sm font-semibold text-navy-100 transition-colors hover:bg-white/10 hover:text-white"
          >
            Sign in
          </Link>
          <Link
            to="/sign-in?mode=sign-up"
            className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-navy-900 shadow-md shadow-black/10 transition-all hover:-translate-y-0.5 hover:bg-primary-50"
          >
            Get started
          </Link>
        </nav>
      </div>
    </header>
  );
}
