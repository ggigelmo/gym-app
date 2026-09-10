import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'secondary' | 'danger';

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

const VARIANT_STYLE: Record<Variant, { background: string; color: string; border: string }> = {
  primary: {
    background: 'var(--color-accent)',
    color: 'var(--color-accent-contrast)',
    border: '1px solid var(--color-accent)',
  },
  secondary: {
    background: 'var(--color-bg-elevated)',
    color: 'var(--color-text)',
    border: '1px solid var(--color-border)',
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
      className={`rounded-lg px-4 text-[15px] font-semibold transition-opacity active:opacity-70 disabled:opacity-40 ${fullWidth ? 'w-full' : ''} ${className}`}
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
