import { useState, type FormEvent } from 'react';
import { ArrowRight } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

type AuthMode = 'sign-in' | 'sign-up';

const MIN_PASSWORD_LENGTH = 8;

const MODE_COPY: Record<AuthMode, { heading: string; submit: string; switchPrompt: string; switchAction: string }> = {
  'sign-in': {
    heading: 'Welcome back',
    submit: 'Sign in',
    switchPrompt: 'New to VECTRA?',
    switchAction: 'Create an account',
  },
  'sign-up': {
    heading: 'Create your account',
    submit: 'Create account',
    switchPrompt: 'Already have an account?',
    switchAction: 'Sign in',
  },
};

export default function AuthForm() {
  const { signIn, signUp } = useAuth();
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(searchParams.get('mode') === 'sign-up' ? 'sign-up' : 'sign-in');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const copy = MODE_COPY[mode];

  function switchMode() {
    setMode((current) => (current === 'sign-in' ? 'sign-up' : 'sign-in'));
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Your password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }

    setSubmitting(true);
    setError(null);
    const result = mode === 'sign-in' ? await signIn(trimmedEmail, password) : await signUp(name.trim(), trimmedEmail, password);
    if (result) setError(result);
    setSubmitting(false);
  }

  return (
    <div className="w-full max-w-md animate-fade-in">
      <h1 className="text-2xl font-bold tracking-tight text-navy-900">{copy.heading}</h1>
      <p className="mt-2 text-sm text-navy-500">
        {mode === 'sign-in'
          ? 'Sign in to continue your practice and tests.'
          : 'Your practice and test results are saved to your account.'}
      </p>

      <form onSubmit={(event) => void handleSubmit(event)} className="mt-8 space-y-5" noValidate>
        {mode === 'sign-up' && <div className="space-y-2">
          <label htmlFor="auth-name" className="text-sm font-medium text-navy-800">Name</label>
          <input id="auth-name" type="text" autoComplete="name" required value={name} onChange={(event) => setName(event.target.value)} className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-navy-900 shadow-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20" placeholder="Your name" />
        </div>}
        <div className="space-y-2">
          <label htmlFor="auth-email" className="text-sm font-medium text-navy-800">
            Email
          </label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-navy-900 shadow-sm transition-colors placeholder:text-navy-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="auth-password" className="text-sm font-medium text-navy-800">
            Password
          </label>
          <input
            id="auth-password"
            type="password"
            autoComplete={mode === 'sign-in' ? 'current-password' : 'new-password'}
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-navy-900 shadow-sm transition-colors placeholder:text-navy-300 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            placeholder={`At least ${MIN_PASSWORD_LENGTH} characters`}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-error-50 px-4 py-3 text-sm text-error-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-primary-600/20 transition-all hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? 'Please wait...' : copy.submit}
          {!submitting && <ArrowRight className="h-4 w-4" aria-hidden="true" />}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-navy-500">
        {copy.switchPrompt}{' '}
        <button
          type="button"
          onClick={switchMode}
          className="font-semibold text-primary-700 underline-offset-4 transition-colors hover:text-primary-800 hover:underline"
        >
          {copy.switchAction}
        </button>
      </p>
    </div>
  );
}
