import { Hexagon } from 'lucide-react';

interface BrandMarkProps {
  compact?: boolean;
}

export default function BrandMark({ compact = false }: BrandMarkProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-primary-600 text-white shadow-md shadow-accent-600/20">
        <Hexagon className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
      </div>
      {!compact && (
        <div className="min-w-0 leading-tight">
          <p className="text-base font-bold tracking-wide text-white">VECTRA</p>
          <p className="truncate text-[11px] font-medium text-navy-300">Placement Intelligence</p>
        </div>
      )}
    </div>
  );
}
