import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger';

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

const VARIANT_STYLE: Record<Variant, { background: string; color: string; border: string; boxShadow?: string }> = {
  primary: {
    background: 'var(--color-accent)',
    color: 'var(--color-accent-contrast)',
    border: '1px solid var(--color-accent)',
    boxShadow: '0 16px 40px -12px rgba(255, 90, 60, 0.45)',
  },
  secondary: {
    background: 'var(--color-bg-elevated)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
    boxShadow: '0 8px 30px rgb(0, 0, 0, 0.04)',
  },
  danger: {
    background: 'var(--color-danger-muted)',
    color: 'var(--color-danger)',
    border: '1px solid var(--color-danger)',
  },
};

/**
 * Consistent large tappable CTA button (min 44px tall). Use `variant` for
 * secondary/destructive actions instead of reaching for raw Tailwind classes,
 * so every screen gets the same touch target and states for free.
 */
export default function PrimaryButton({
  variant = 'primary',
  fullWidth = false,
  className = '',
  style,
  disabled,
  ...rest
}: PrimaryButtonProps) {
  return (
    <button
      type="button"
      className={`rounded-xl px-4 text-[15px] font-bold transition-all active:scale-[0.98] active:opacity-80 disabled:opacity-40 disabled:shadow-none disabled:active:scale-100 ${fullWidth ? 'w-full' : ''} ${className}`}
      style={{
        minHeight: 44,
        ...VARIANT_STYLE[variant],
        ...style,
      }}
      disabled={disabled}
      {...rest}
    />
  );
}
