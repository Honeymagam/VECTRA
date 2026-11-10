import { useEffect, useState, useCallback } from 'react';
import { Save, CalendarDays, FlaskConical, ClipboardList } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import StatePanel from '@/components/ui/StatePanel';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

type Goal =
  | 'Get placed in a top company'
  | 'Improve aptitude skills'
  | 'Crack GATE'
  | 'Other';

const GOALS: Goal[] = [
  'Get placed in a top company',
  'Improve aptitude skills',
  'Crack GATE',
  'Other',
];

const TARGET_COMPANIES = ['TCS', 'Infosys', 'Wipro', 'Accenture', 'Cognizant'] as const;
type Company = (typeof TARGET_COMPANIES)[number];

const PREFERRED_TOPICS = ['Percentages', 'Time & Work', 'Number Series'] as const;
type Topic = (typeof PREFERRED_TOPICS)[number];

interface UserProfile {
  display_name: string;
  goal: Goal;
  target_companies: Company[];
  preferred_topics: Topic[];
}

interface Stats {
  createdAt: string;
  practiceSessions: number;
  mockTests: number;
}

type PageView =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; stats: Stats };

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(email: string, name: string): string {
  if (name.trim()) {
    return name
      .trim()
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? '')
      .join('');
  }
  return email.slice(0, 2).toUpperCase();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function isGoal(value: string): value is Goal {
  return GOALS.includes(value as Goal);
}

function isCompany(value: string): value is Company {
  return TARGET_COMPANIES.includes(value as Company);
}

function isTopic(value: string): value is Topic {
  return PREFERRED_TOPICS.includes(value as Topic);
}

// ─── Multi-select Chips ───────────────────────────────────────────────────────

function ChipSelector<T extends string>({
  options,
  selected,
  onChange,
}: {
  options: readonly T[];
  selected: T[];
  onChange: (next: T[]) => void;
}) {
  function toggle(option: T) {
    onChange(
      selected.includes(option)
        ? selected.filter((s) => s !== option)
        : [...selected, option]
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            type="button"
            onClick={() => toggle(opt)}
            className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
              active
                ? 'bg-primary-600 text-white shadow-md shadow-primary-600/20'
                : 'border border-neutral-200 bg-white text-navy-600 hover:bg-neutral-50'
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────────────

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs text-navy-500">{label}</p>
        <p className="text-sm font-semibold text-navy-900">{value}</p>
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { session, updateUser } = useAuth();

  const userEmail = session?.email ?? '';
  const userCreatedAt = session?.created_at ?? '';

  // Profile form state
  const [profile, setProfile] = useState<UserProfile>({
    display_name: session?.name ?? '',
    goal: 'Get placed in a top company',
    target_companies: [],
    preferred_topics: [],
  });

  // Page loading/error/ready
  const [view, setView] = useState<PageView>({ kind: 'loading' });

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    document.title = 'Profile | VECTRA';
  }, []);

  // ── Fetch profile + stats ─────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    if (!session) return;
    setView({ kind: 'loading' });

    try {
      // Fetch profile
      const [dbProfile, activity, overview] = await Promise.all([
        api<{ name: string; goal: string; target_companies: string[]; preferred_topics: string[] }>('/auth/profile'),
        api<{ practice_rows: unknown[] }>('/analytics/activity'),
        api<{ mock_tests: number }>('/analytics/overview'),
      ]);
      setProfile((previous) => ({ ...previous, display_name: dbProfile.name, goal: isGoal(dbProfile.goal) ? dbProfile.goal : previous.goal, target_companies: dbProfile.target_companies.filter(isCompany), preferred_topics: dbProfile.preferred_topics.filter(isTopic) }));

      setView({
        kind: 'ready',
        stats: {
          createdAt: userCreatedAt,
          practiceSessions: activity.practice_rows.length,
          mockTests: overview.mock_tests,
        },
      });
    } catch (err) {
      setView({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Failed to load profile.',
      });
    }
  }, [session, userCreatedAt]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // ── Save handler ──────────────────────────────────────────────────────────

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setSaving(true);
    setSaveMsg(null);

    try {
      const updated = await api<{ id: number; name: string; email: string; role: 'STUDENT' | 'EDUCATOR' | 'ADMIN' }>('/auth/profile', {
        method: 'PATCH', body: JSON.stringify({ name: profile.display_name.trim(), goal: profile.goal, target_companies: profile.target_companies, preferred_topics: profile.preferred_topics }),
      });
      updateUser(updated);
      setSaveMsg({ ok: true, text: 'Profile saved successfully.' });
    } catch (error) { setSaveMsg({ ok: false, text: error instanceof Error ? error.message : 'Could not save profile.' }); }
    finally { setSaving(false); }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const initials = getInitials(userEmail, profile.display_name);

  return (
    <>
      <PageHeader
        eyebrow="Account"
        title="Student Profile"
        description="Personalise your VECTRA experience and track your account activity."
      />

      <div className="animate-fade-in">
        {/* ── Profile Header ──────────────────────────────────────────────── */}
        <div className="mb-6 flex flex-col items-start gap-4 sm:flex-row sm:items-center">
          <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-primary-600 text-xl font-bold text-white shadow-md shadow-primary-600/30 select-none">
            {initials}
          </div>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-bold text-navy-900">
              {profile.display_name.trim() || userEmail}
            </h2>
            <p className="text-sm text-navy-500">{userEmail}</p>
            <span className="mt-1 inline-flex items-center rounded-full bg-accent-50 px-2.5 py-0.5 text-xs font-semibold text-accent-700">
              Student
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

          {/* ── Editable Form ─────────────────────────────────────────────── */}
          <section className="lg:col-span-2 rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-card">
            <h3 className="mb-5 text-base font-semibold text-navy-900">Edit Profile</h3>
            <form onSubmit={handleSave} className="space-y-6">

              {/* Display name */}
              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-navy-700 mb-1.5">
                  Display name
                </label>
                <input
                  id="displayName"
                  type="text"
                  value={profile.display_name}
                  onChange={(e) => setProfile((p) => ({ ...p, display_name: e.target.value }))}
                  placeholder="Your name"
                  className="block w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-navy-900 placeholder-navy-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors"
                />
              </div>

              {/* Goal */}
              <div>
                <label htmlFor="goal" className="block text-sm font-medium text-navy-700 mb-1.5">
                  Goal
                </label>
                <select
                  id="goal"
                  value={profile.goal}
                  onChange={(e) => {
                    const val = e.target.value;
                    setProfile((p) => ({
                      ...p,
                      goal: isGoal(val) ? val : 'Get placed in a top company',
                    }));
                  }}
                  className="block w-full rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-navy-900 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors"
                >
                  {GOALS.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
              </div>

              {/* Target companies */}
              <div>
                <p className="block text-sm font-medium text-navy-700 mb-2">Target companies</p>
                <ChipSelector<Company>
                  options={TARGET_COMPANIES}
                  selected={profile.target_companies}
                  onChange={(next) => setProfile((p) => ({ ...p, target_companies: next }))}
                />
              </div>

              {/* Preferred topics */}
              <div>
                <p className="block text-sm font-medium text-navy-700 mb-2">Preferred topics</p>
                <ChipSelector<Topic>
                  options={PREFERRED_TOPICS}
                  selected={profile.preferred_topics}
                  onChange={(next) => setProfile((p) => ({ ...p, preferred_topics: next }))}
                />
              </div>

              {saveMsg && (
                <p className={`text-sm font-medium ${saveMsg.ok ? 'text-success-600' : 'text-error-600'}`}>
                  {saveMsg.text}
                </p>
              )}

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-600/20 transition-all hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-lg disabled:opacity-60 disabled:pointer-events-none"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                {saving ? 'Saving…' : 'Save profile'}
              </button>
            </form>
          </section>

          {/* ── Stats Sidebar ──────────────────────────────────────────────── */}
          <aside className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-card">
            <h3 className="mb-5 text-base font-semibold text-navy-900">Account Stats</h3>

            {view.kind === 'loading' && (
              <StatePanel variant="loading" title="Loading stats" message="Fetching your account data." />
            )}

            {view.kind === 'error' && (
              <StatePanel variant="error" title="Could not load stats" message={view.message} />
            )}

            {view.kind === 'ready' && (
              <div className="space-y-5">
                <StatCard
                  icon={<CalendarDays className="h-4 w-4" aria-hidden="true" />}
                  label="Account created"
                  value={view.stats.createdAt ? formatDate(view.stats.createdAt) : '—'}
                />
                <StatCard
                  icon={<FlaskConical className="h-4 w-4" aria-hidden="true" />}
                  label="Total practice sessions"
                  value={String(view.stats.practiceSessions)}
                />
                <StatCard
                  icon={<ClipboardList className="h-4 w-4" aria-hidden="true" />}
                  label="Total mock tests"
                  value={String(view.stats.mockTests)}
                />
              </div>
            )}
          </aside>

        </div>
      </div>
    </>
  );
}
