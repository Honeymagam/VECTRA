import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronRight, GitBranch, RefreshCw } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { PROJECT_REPOSITORY_URL } from '@/config/project';
import { NAV_SECTIONS, type NavSection } from '@/config/routes';

const STAGE_COPY: Record<string, { summary: string }> = {
  'core-intelligence': {
    summary: 'Builds the knowledge base. Learning resources are processed into structured concepts and stored for fast retrieval.',
  },
  'learning-intelligence': {
    summary: 'Turns your answers into insight. Mistakes are analysed, your learner profile updates and revision is scheduled.',
  },
  assessment: {
    summary: 'Measures readiness through adaptive practice, timed tests and an overall placement picture.',
  },
};

const LOOP_STEPS = ['Answer', 'Analyse', 'Update', 'Recommend'];

const STAGES: NavSection[] = Object.keys(STAGE_COPY).flatMap((id) => {
  const section = NAV_SECTIONS.find((item) => item.id === id);
  return section ? [section] : [];
});

export default function FrameworkOverviewPage() {
  useEffect(() => {
    document.title = 'Framework Overview | VECTRA';
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Framework Overview"
        description="VECTRA is a placement intelligence framework. Its layers work together as one system."
      />

      <section className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-card sm:p-8">
        <p className="max-w-3xl text-sm leading-relaxed text-navy-600 sm:text-base">
The framework is built from three connected layers. Each layer feeds the next, so every question you answer
          sharpens what the system shows you to study and when. Institutions and learning products can adopt the same
          layers with their own material.
        </p>

        <ol className="mt-8 grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-0">
          {STAGES.map((stage, index) => (
            <li key={stage.id} className="relative flex lg:px-2">
              <article className="flex w-full flex-col rounded-2xl border border-neutral-200 bg-neutral-50/60 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-200 hover:bg-white hover:shadow-card-hover">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 text-sm font-semibold text-white">
                    {index + 1}
                  </span>
                  <h2 className="text-base font-semibold text-navy-900">{stage.title}</h2>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-navy-500">{STAGE_COPY[stage.id].summary}</p>

                <ul className="mt-5 space-y-1">
                  {stage.items.map((item) => (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white hover:shadow-card"
                      >
                        <item.icon className="h-4 w-4 flex-shrink-0 text-primary-600" aria-hidden="true" />
                        <span className="min-w-0 flex-1 text-sm font-medium text-navy-800">{item.label}</span>
                        <ChevronRight
                          className="h-4 w-4 flex-shrink-0 text-navy-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary-600"
                          aria-hidden="true"
                        />
                      </Link>
                    </li>
                  ))}
                </ul>
              </article>

              {index < STAGES.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-3 top-1/2 z-10 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-white text-primary-600 shadow-card lg:flex"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </span>
              )}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-8 rounded-2xl border border-primary-100 bg-primary-50/50 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-primary-600 shadow-card">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
          </span>
          <h2 className="text-base font-semibold text-navy-900">The learning loop</h2>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-navy-600">
          Every session runs the same cycle. Your response is analysed, your learner profile is updated, and the next
          recommendation adapts to what you actually need.
        </p>

        <ul className="mt-6 flex flex-wrap items-center gap-2" aria-label="Learning loop steps">
          {LOOP_STEPS.map((step, index) => (
            <li key={step} className="flex items-center gap-2">
              <span className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-navy-800 shadow-card">
                {step}
              </span>
              {index < LOOP_STEPS.length - 1 && (
                <ArrowRight className="h-4 w-4 text-primary-400" aria-hidden="true" />
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8 flex flex-col gap-4 rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-card sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-50 text-navy-700">
            <GitBranch className="h-4 w-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-navy-900">Project files</h2>
            <p className="text-sm text-navy-500">Source, documentation and supporting material for the framework.</p>
          </div>
        </div>
        <a
          href={PROJECT_REPOSITORY_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm font-semibold text-navy-800 transition-colors hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
        >
          View on GitHub
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </a>
      </section>
    </>
  );
}
