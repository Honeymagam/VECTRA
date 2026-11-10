import { NavLink } from 'react-router-dom';
import { NAV_SECTIONS } from '@/config/routes';

interface SidebarNavListProps {
  collapsed?: boolean;
  onNavigate?: () => void;
}

export default function SidebarNavList({ collapsed = false, onNavigate }: SidebarNavListProps) {
  return (
    <nav aria-label="Main navigation" className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {NAV_SECTIONS.map((section) => (
        <div key={section.id} className="space-y-1">
          {collapsed ? (
            <div className="mx-3 mb-2 h-px bg-navy-700/60" aria-hidden="true" />
          ) : (
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-navy-400">
              {section.title}
            </p>
          )}
          {section.items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
                aria-label={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  `group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150 ${
                    collapsed ? 'justify-center' : ''
                  } ${
                    isActive
                      ? 'bg-white/10 text-white shadow-inner shadow-white/5'
                      : 'text-navy-200 hover:bg-white/5 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-accent-400 transition-opacity duration-200 ${
                        isActive ? 'opacity-100' : 'opacity-0'
                      }`}
                      aria-hidden="true"
                    />
                    <Icon
                      className={`h-5 w-5 flex-shrink-0 ${isActive ? 'text-accent-300' : 'text-navy-300 group-hover:text-navy-100'}`}
                      aria-hidden="true"
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
