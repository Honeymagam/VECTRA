import { ChevronsLeft, ChevronsRight } from 'lucide-react';
import BrandMark from '@/components/layout/BrandMark';
import SidebarNavList from '@/components/layout/SidebarNavList';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export default function Sidebar({ collapsed, onToggleCollapsed }: SidebarProps) {
  return (
    <aside
      className={`sticky top-0 hidden h-screen flex-shrink-0 flex-col bg-navy-900 transition-[width] duration-300 ease-out lg:flex ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div
        className={`flex h-16 flex-shrink-0 items-center border-b border-white/5 px-4 ${
          collapsed ? 'justify-center' : 'justify-between'
        }`}
      >
        <BrandMark compact={collapsed} />
        {!collapsed && (
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Collapse sidebar"
            className="rounded-lg p-1.5 text-navy-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ChevronsLeft className="h-5 w-5" aria-hidden="true" />
          </button>
        )}
      </div>

      <SidebarNavList collapsed={collapsed} />

      {collapsed && (
        <div className="border-t border-white/5 p-3">
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label="Expand sidebar"
            className="flex w-full items-center justify-center rounded-xl p-2.5 text-navy-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <ChevronsRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      )}
    </aside>
  );
}
