import { Radar } from 'lucide-react';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'lg' ? 'h-12 w-12' : size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const icon = size === 'lg' ? 'h-7 w-7' : size === 'sm' ? 'h-4.5 w-4.5' : 'h-5 w-5';
  return (
    <span className={`relative flex ${dim} items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm`}>
      <Radar className={icon} />
    </span>
  );
}

export function Wordmark({ light = false }: { light?: boolean }) {
  return (
    <span className={`font-display font-bold tracking-tight text-lg ${light ? 'text-white' : 'text-ink-900'}`}>
      StudyGap<span className="text-brand-500">Radar</span>
    </span>
  );
}
