import { useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import AuthForm from '@/components/auth/AuthForm';
import BrandMark from '@/components/layout/BrandMark';

export default function SignInPage() {
  useEffect(() => {
    document.title = 'Sign in | VECTRA';
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-neutral-50 lg:flex-row">
      <aside className="relative flex flex-col justify-between overflow-hidden bg-navy-900 p-8 text-white lg:w-[42%] lg:p-12">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary-600/20 blur-3xl" aria-hidden="true" />
        <BrandMark />
        <div className="relative mt-16 max-w-md lg:mt-0">
          <p className="text-3xl font-bold leading-tight tracking-tight lg:text-4xl">
            Practise smarter, and see exactly where you stand.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-navy-300">
            Your practice answers, mock tests and readiness scores are saved to your own account.
          </p>
        </div>
      </aside>

      <main className="relative flex flex-1 items-center justify-center p-6 sm:p-10">
        <Link
          to="/"
          className="absolute left-6 top-6 inline-flex items-center gap-2 text-sm font-medium text-navy-500 transition-colors hover:text-navy-900 sm:left-10 sm:top-10"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          Back to home
        </Link>
        <AuthForm />
      </main>
    </div>
  );
}
