import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const HERO_IMAGE_URL =
  'https://images.pexels.com/photos/5553049/pexels-photo-5553049.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

const HIGHLIGHTS = ['Timed mock tests in placement format', 'Practice by topic and difficulty', 'One readiness view for your progress'];

export default function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-navy-900 text-white">
      <div className="pointer-events-none absolute -left-32 top-24 h-96 w-96 rounded-full bg-primary-600/25 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-success-500/15 blur-3xl" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 pb-20 pt-16 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:pb-28 lg:pt-24">
        <div className="animate-fade-in">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-navy-100">
            <span className="h-1.5 w-1.5 rounded-full bg-success-500" aria-hidden="true" />
            Placement preparation, measured honestly
          </p>
          <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            Know exactly where you stand before placement day.
          </h1>
          <p className="mt-6 max-w-xl text-base leading-relaxed text-navy-200 sm:text-lg">
VECTRA is a placement intelligence framework. It connects your study material, practice and mock tests
            into one picture of your accuracy, pace and readiness, so you know which topics to focus on.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/sign-in?mode=sign-up"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary-900/40 transition-all hover:-translate-y-0.5 hover:bg-primary-400"
            >
              Create your free account
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/sign-in"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Sign in
            </Link>
          </div>

          <ul className="mt-10 space-y-3">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-center gap-3 text-sm text-navy-200">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-success-500" aria-hidden="true" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative animate-fade-in">
          <div className="overflow-hidden rounded-3xl border border-white/10 bg-navy-800 shadow-2xl shadow-black/40">
            <img
              src={HERO_IMAGE_URL}
              alt="Two students reviewing notes and a laptop together"
              className="aspect-[4/3] w-full object-cover"
              loading="eager"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
