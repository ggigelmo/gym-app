import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  /** Render as a different element/component, e.g. Card.as={Link} for a tappable row. */
  as?: ElementType;
}

/**
 * Rounded-corner surface for list rows and grouped content. Sits one step
 * "up" from the page background using --color-bg-elevated so it reads as
 * distinct in both light and dark. Soft drop shadow instead of a border does
 * most of that lifting — the border stays, but faint, as a fallback for
 * high-contrast/print contexts where shadows don't render.
 */
export default function Card({
  children,
  className = '',
  as: Component = 'div',
  style,
  ...rest
}: CardProps & Omit<ComponentPropsWithoutRef<ElementType>, keyof CardProps>) {
  return (
    <Component
      className={`rounded-xl border p-4 shadow-[0_8px_30px_rgb(0,0,0,0.04)] ${className}`}
      style={{
        background: 'var(--color-bg-elevated)',
        borderColor: 'var(--color-border)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </Component>
  );
}
