import { useCallback, useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import MobileNavDrawer from '@/components/layout/MobileNavDrawer';
import Sidebar from '@/components/layout/Sidebar';
import TopBar from '@/components/layout/TopBar';

const SIDEBAR_STORAGE_KEY = 'vectra.sidebarCollapsed';

function readStoredCollapsed(): boolean {
  try {
    return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export default function AppLayout() {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState<boolean>(readStoredCollapsed);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
    } catch {
      // Storage can be unavailable (private mode); the preference simply won't persist.
    }
  }, [collapsed]);

  const toggleCollapsed = useCallback(() => setCollapsed((value) => !value), []);
  const closeMobileNav = useCallback(() => setMobileNavOpen(false), []);
  const openMobileNav = useCallback(() => setMobileNavOpen(true), []);

  return (
    <div className="flex min-h-screen bg-neutral-50">
      <Sidebar collapsed={collapsed} onToggleCollapsed={toggleCollapsed} />
      <MobileNavDrawer open={mobileNavOpen} onClose={closeMobileNav} />

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onOpenMobileNav={openMobileNav} />
        <main className="flex-1 px-4 py-8 sm:px-6 lg:px-8">
          <div key={pathname} className="mx-auto w-full max-w-7xl animate-fade-in">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
