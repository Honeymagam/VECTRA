import { GitBranch } from 'lucide-react';
import { Link } from 'react-router-dom';
import BrandMark from '@/components/layout/BrandMark';
import { PROJECT_REPOSITORY_URL } from '@/config/project';

export default function LandingFooter() {
  return (
    <>
      <section className="bg-primary-700 py-16 text-white lg:py-20">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-8 px-6 lg:flex-row lg:items-center lg:justify-between lg:px-10">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Start your first practice set today</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-primary-100">
              Create a free account and see your accuracy by topic after your first few questions.
            </p>
          </div>
          <Link
            to="/sign-in?mode=sign-up"
            className="inline-flex items-center rounded-xl bg-white px-6 py-3.5 text-sm font-semibold text-primary-800 shadow-lg shadow-primary-900/30 transition-all hover:-translate-y-0.5 hover:bg-primary-50"
          >
            Create your free account
          </Link>
        </div>
      </section>

      <footer className="bg-navy-900 py-10 text-navy-300">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 sm:flex-row sm:items-center sm:justify-between lg:px-10">
          <BrandMark />
          <nav className="flex gap-6 text-sm" aria-label="Footer">
            <a href="#features" className="transition-colors hover:text-white">Features</a>
            <a href="#how-it-works" className="transition-colors hover:text-white">How it works</a>
            <a href="#research-evaluation" className="transition-colors hover:text-white">Research evaluation</a>
            <Link to="/sign-in" className="transition-colors hover:text-white">Sign in</Link>
            <a
              href={PROJECT_REPOSITORY_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 transition-colors hover:text-white"
            >
              <GitBranch className="h-4 w-4" aria-hidden="true" />
              Project files
            </a>
          </nav>
          <p className="text-xs">Copyright {new Date().getFullYear()} VECTRA. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
}
