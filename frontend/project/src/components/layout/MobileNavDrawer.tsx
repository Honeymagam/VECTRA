import { useEffect } from 'react';
import { X } from 'lucide-react';
import BrandMark from '@/components/layout/BrandMark';
import SidebarNavList from '@/components/layout/SidebarNavList';

interface MobileNavDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileNavDrawer({ open, onClose }: MobileNavDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <button
        type="button"
        aria-label="Close navigation menu"
        onClick={onClose}
        className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm animate-fade-in"
      />
      <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-navy-900 shadow-2xl animate-slide-in-left">
        <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-white/5 px-4">
          <BrandMark />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation menu"
            className="rounded-lg p-1.5 text-navy-300 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <SidebarNavList onNavigate={onClose} />
      </div>
    </div>
  );
}
