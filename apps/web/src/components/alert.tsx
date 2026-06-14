import type { ReactNode } from 'react';

// Status surfaces route through here so they use semantic role tokens that
// already carry light + dark values — no `dark:` variants needed.
type Variant = 'error' | 'success' | 'warning' | 'info';

const styles: Record<Variant, string> = {
  error: 'bg-error-container text-on-error-container border-error/30',
  success: 'bg-success-container text-on-success-container border-success/30',
  warning: 'bg-warning-container text-on-warning-container border-warning/30',
  info: 'bg-info-container text-on-info-container border-info/30',
};

export function Alert({ variant, children }: { variant: Variant; children: ReactNode }) {
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={`rounded-lg border px-3 py-2 text-sm ${styles[variant]}`}
    >
      {children}
    </div>
  );
}
