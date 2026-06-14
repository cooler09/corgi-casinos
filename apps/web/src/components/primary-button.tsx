// Centralized button class vocabulary (see docs/design-system.md). Import these
// instead of hand-rolling `bg-primary hover:…` strings so styling stays in one
// place. Each takes a size.

type Size = 'sm' | 'md';

const base =
  'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-opacity disabled:cursor-not-allowed disabled:opacity-50';

const sizes: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5',
};

export function primaryButtonClass(size: Size = 'md'): string {
  return `${base} ${sizes[size]} bg-primary text-on-primary hover:opacity-90`;
}

export function secondaryButtonClass(size: Size = 'md'): string {
  return `${base} ${sizes[size]} border border-outline text-on-surface hover:bg-surface-container-high`;
}

export function tonalButtonClass(size: Size = 'md'): string {
  return `${base} ${sizes[size]} bg-surface-container-highest text-on-surface hover:opacity-90`;
}
