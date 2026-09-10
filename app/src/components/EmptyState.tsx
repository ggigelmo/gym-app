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
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      {icon && (
        <div className="h-12 w-12" style={{ color: 'var(--color-text-faint)' }} aria-hidden="true">
          {icon}
        </div>
      )}
      <div className="flex flex-col gap-1">
        <p className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
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
