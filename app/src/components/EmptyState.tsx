import type { ReactNode } from 'react';

interface EmptyStateProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
}

/**
 * Centered placeholder for empty lists (no exercises / routines / history
 * yet). `action` is typically a <PrimaryButton> or <Link>.
 */
export default function EmptyState({ title, subtitle, action, icon }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
      {icon && (
        <div
          className="flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: 'var(--color-accent-muted)', color: 'var(--color-accent)' }}
          aria-hidden="true"
        >
          <div className="h-7 w-7">{icon}</div>
        </div>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
          {title}
        </p>
        {subtitle && (
          <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>
            {subtitle}
          </p>
        )}
      </div>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
