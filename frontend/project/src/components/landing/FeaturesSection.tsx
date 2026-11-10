import { BrainCircuit, FileSearch, Gauge, SlidersHorizontal, Timer, type LucideIcon } from 'lucide-react';

interface Feature {
  title: string;
  description: string;
  icon: LucideIcon;
}

const FEATURES: Feature[] = [
  {
    title: 'Adaptive practice',
    description: 'Choose a topic and difficulty, answer questions, and review a clear explanation for every one.',
    icon: SlidersHorizontal,
  },
  {
    title: 'Placement-style mock tests',
    description: 'Timed tests with question navigation, so the pressure feels like the real thing.',
    icon: Timer,
  },
  {
    title: 'Placement readiness',
    description: 'Accuracy, pace and consistency combined into one honest view of where you stand.',
    icon: Gauge,
  },
  {
    title: 'Learning from your own notes',
    description: 'Add the resources you already study from and keep them organised in one place.',
    icon: FileSearch,
  },
];

const STEPS = [
  { title: 'Create your account', description: 'Sign up with your email in under a minute.' },
  { title: 'Practise by topic', description: 'Work through questions and see which topics need attention.' },
  { title: 'Track your readiness', description: 'Take mock tests and watch your accuracy and pace change over time.' },
];

export default function FeaturesSection() {
  return (
    <>
      <section id="features" className="bg-neutral-50 py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-6 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary-700">Features</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-navy-900 sm:text-4xl">
One framework, three connected layers
            </h2>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="group rounded-2xl border border-neutral-200/80 bg-white p-8 shadow-card transition-all duration-200 hover:-translate-y-1 hover:shadow-card-hover"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-colors group-hover:bg-primary-600 group-hover:text-white">
                  <feature.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <h3 className="mt-6 text-lg font-semibold text-navy-900">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-navy-500">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="bg-white py-20 lg:py-28">
        <div className="mx-auto grid max-w-6xl gap-12 px-6 lg:grid-cols-[1fr_1.4fr] lg:gap-20 lg:px-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary-700">How it works</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-navy-900 sm:text-4xl">
              From first question to clear readiness
            </h2>
            <p className="mt-4 flex items-center gap-2 text-sm text-navy-500">
              <BrainCircuit className="h-4 w-4 text-primary-600" aria-hidden="true" />
              Every result is saved to your own account.
            </p>
          </div>

          <ol className="space-y-8">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-5">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-navy-900 text-sm font-semibold text-white">
                  {index + 1}
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-navy-900">{step.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-navy-500">{step.description}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </>
  );
}
