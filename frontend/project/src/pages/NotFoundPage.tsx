import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageHeader from '@/components/ui/PageHeader';
import StatePanel from '@/components/ui/StatePanel';
import { DEFAULT_ROUTE_PATH } from '@/config/routes';

export default function NotFoundPage() {
  return (
    <>
      <PageHeader title="Page not found" description="The page you are looking for does not exist or has moved." />
      <StatePanel
        variant="error"
        icon={Compass}
        title="Nothing here"
        message="Use the sidebar to find the section you need, or return to your dashboard."
      />
      <div className="mt-6 flex justify-center">
        <Link
          to={DEFAULT_ROUTE_PATH}
          className="rounded-xl bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-navy-800"
        >
          Go to dashboard
        </Link>
      </div>
    </>
  );
}
