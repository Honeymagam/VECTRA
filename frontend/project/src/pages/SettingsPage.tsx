import { useEffect, useState } from 'react';
import { Save, LogOut, KeyRound, Bell, User } from 'lucide-react';
import PageHeader from '@/components/ui/PageHeader';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/lib/api';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Prefs {
  showExplanations: boolean;
  adaptiveDifficulty: boolean;
  weeklyEmail: boolean;
}

const PREFS_KEY = 'vectra.prefs';

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return JSON.parse(raw) as Prefs;
  } catch {
    // ignore
  }
  return { showExplanations: true, adaptiveDifficulty: true, weeklyEmail: false };
}

function savePrefs(prefs: Prefs): void {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-neutral-200/80 bg-white p-6 shadow-card">
      <div className="flex items-center gap-3 mb-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
          {icon}
        </span>
        <h2 className="text-base font-semibold text-navy-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function Toggle({ label, description, checked, onChange }: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 py-3">
      <span className="min-w-0">
        <span className="block text-sm font-medium text-navy-800">{label}</span>
        {description && <span className="block text-xs text-navy-500 mt-0.5">{description}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
          checked ? 'bg-primary-600' : 'bg-neutral-200'
        }`}
      >
        <span
          aria-hidden="true"
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </label>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { session, signOut, updateUser } = useAuth();

  // Account section
  const [displayName, setDisplayName] = useState<string>(
    session?.name ?? ''
  );
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountMsg, setAccountMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // Prefs section
  const [prefs, setPrefs] = useState<Prefs>(loadPrefs);

  // Security section
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityMsg, setSecurityMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [securitySaving, setSecuritySaving] = useState(false);

  useEffect(() => {
    document.title = 'Settings | VECTRA';
  }, []);

  // Persist prefs whenever they change
  useEffect(() => {
    savePrefs(prefs);
  }, [prefs]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  async function handleAccountSave(e: React.FormEvent) {
    e.preventDefault();
    setAccountSaving(true);
    setAccountMsg(null);
    try {
      const updated = await api<typeof session>('/auth/profile', { method: 'PATCH', body: JSON.stringify({ name: displayName.trim() }) });
      if (updated) updateUser(updated);
      setAccountMsg({ ok: true, text: 'Display name updated successfully.' });
    } catch (error) {
      setAccountMsg({ ok: false, text: error instanceof Error ? error.message : 'Could not update name.' });
    } finally { setAccountSaving(false); }
  }

  function setPref<K extends keyof Prefs>(key: K, value: Prefs[K]) {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setSecurityMsg(null);

    if (newPassword.length < 8) {
      setSecurityMsg({ ok: false, text: 'Password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setSecurityMsg({ ok: false, text: 'Passwords do not match.' });
      return;
    }

    setSecuritySaving(true);
    try {
      await api<void>('/auth/password', { method: 'POST', body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }) });
      setSecurityMsg({ ok: true, text: 'Password changed successfully.' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) { setSecurityMsg({ ok: false, text: error instanceof Error ? error.message : 'Could not update password.' }); }
    finally { setSecuritySaving(false); }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <>
      <PageHeader eyebrow="Account" title="Settings" description="Manage your account, preferences, and security." />

      <div className="animate-fade-in space-y-6">

        {/* ── Account ─────────────────────────────────────────────────────── */}
        <SectionCard title="Account" icon={<User className="h-4 w-4" aria-hidden="true" />}>
          <form onSubmit={handleAccountSave} className="space-y-4">
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-navy-700 mb-1.5">
                Display name
              </label>
              <input
                id="displayName"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="block w-full max-w-sm rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-navy-900 placeholder-navy-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-navy-700 mb-1.5">Email address</label>
              <input
                type="email"
                value={session?.email ?? ''}
                readOnly
                disabled
                className="block w-full max-w-sm rounded-xl border border-neutral-200 bg-neutral-100 px-3.5 py-2.5 text-sm text-navy-500 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-navy-400">Email cannot be changed here.</p>
            </div>

            {accountMsg && (
              <p className={`text-sm font-medium ${accountMsg.ok ? 'text-success-600' : 'text-error-600'}`}>
                {accountMsg.text}
              </p>
            )}

            <button
              type="submit"
              disabled={accountSaving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-600/20 transition-all hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-lg disabled:opacity-60 disabled:pointer-events-none"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              {accountSaving ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </SectionCard>

        {/* ── Learning Preferences ────────────────────────────────────────── */}
        <SectionCard title="Learning Preferences" icon={<Bell className="h-4 w-4" aria-hidden="true" />}>
          <div className="divide-y divide-neutral-100">
            <Toggle
              label="Show explanations after each answer"
              description="See a detailed explanation every time you submit an answer."
              checked={prefs.showExplanations}
              onChange={(v) => setPref('showExplanations', v)}
            />
            <Toggle
              label="Enable adaptive difficulty"
              description="VECTRA will adjust question difficulty based on your performance."
              checked={prefs.adaptiveDifficulty}
              onChange={(v) => setPref('adaptiveDifficulty', v)}
            />
            <Toggle
              label="Email me weekly progress"
              description="Receive a summary of your practice and test results every week."
              checked={prefs.weeklyEmail}
              onChange={(v) => setPref('weeklyEmail', v)}
            />
          </div>
          <p className="mt-4 text-xs text-navy-400">Preferences are saved automatically.</p>
        </SectionCard>

        {/* ── Security ────────────────────────────────────────────────────── */}
        <SectionCard title="Security" icon={<KeyRound className="h-4 w-4" aria-hidden="true" />}>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-navy-700 mb-1.5">Current password</label>
              <input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} autoComplete="current-password" className="block w-full max-w-sm rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-navy-900" />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-navy-700 mb-1.5">
                New password
              </label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
                className="block w-full max-w-sm rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-navy-900 placeholder-navy-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-navy-700 mb-1.5">
                Confirm new password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat your new password"
                autoComplete="new-password"
                className="block w-full max-w-sm rounded-xl border border-neutral-200 bg-neutral-50 px-3.5 py-2.5 text-sm text-navy-900 placeholder-navy-400 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20 transition-colors"
              />
            </div>

            {securityMsg && (
              <p className={`text-sm font-medium ${securityMsg.ok ? 'text-success-600' : 'text-error-600'}`}>
                {securityMsg.text}
              </p>
            )}

            <button
              type="submit"
              disabled={securitySaving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary-600/20 transition-all hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-lg disabled:opacity-60 disabled:pointer-events-none"
            >
              <KeyRound className="h-4 w-4" aria-hidden="true" />
              {securitySaving ? 'Updating…' : 'Change password'}
            </button>
          </form>
        </SectionCard>

        {/* ── Danger Zone ─────────────────────────────────────────────────── */}
        <section className="rounded-2xl border border-error-200/80 bg-white p-6 shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-error-50 text-error-600">
              <LogOut className="h-4 w-4" aria-hidden="true" />
            </span>
            <h2 className="text-base font-semibold text-navy-900">Danger Zone</h2>
          </div>
          <p className="text-sm text-navy-500 mb-4">
            Sign out of your account on this device.
          </p>
          <button
            type="button"
            onClick={() => void signOut()}
            className="inline-flex items-center gap-2 rounded-xl border border-error-200 bg-error-50 px-4 py-2.5 text-sm font-semibold text-error-700 transition-colors hover:bg-error-100"
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            Sign out
          </button>
        </section>

      </div>
    </>
  );
}
