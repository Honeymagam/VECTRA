import { useEffect } from 'react';
import PageHeader from '@/components/ui/PageHeader';
import StatePanel from '@/components/ui/StatePanel';
import { findRouteContext, type AppRoute } from '@/config/routes';

interface ModulePlaceholderPageProps {
  route: AppRoute;
}

export default function ModulePlaceholderPage({ route }: ModulePlaceholderPageProps) {
  const context = findRouteContext(route.path);

  useEffect(() => {
    document.title = `${route.title} | VECTRA`;
  }, [route.title]);

  return (
    <>
      <PageHeader
        eyebrow={context?.section.title}
        title={route.title}
        description={route.description}
      />
      <StatePanel
        variant="empty"
        icon={route.icon}
        title={`${route.label} workspace`}
        message="This section is set up and will be populated with its full interface in an upcoming release."
      />
    </>
  );
}
