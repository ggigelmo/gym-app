import type { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
}

// Simple inline stroke icons — no icon library dependency. Each is a 24x24
// viewBox so they line up regardless of which one is active.
const icons = {
  train: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5v11M17.5 6.5v11M2 9.5v5M22 9.5v5M6.5 12h11" />
    </svg>
  ),
  routines: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 3v2h6V3M8 10h8M8 14h8M8 18h5" />
    </svg>
  ),
  exercises: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  ),
  history: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v6h6" />
      <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6" />
      <path d="M12 8v4l3 2" />
    </svg>
  ),
};

const NAV_ITEMS: NavItem[] = [
  { to: '/train', label: 'Train', icon: icons.train },
  { to: '/routines', label: 'Routines', icon: icons.routines },
  { to: '/exercises', label: 'Exercises', icon: icons.exercises },
  { to: '/history', label: 'History', icon: icons.history },
];

/**
 * Fixed bottom tab bar. Mobile-first: large tap targets, safe-area aware.
 * Uses NavLink so each tab gets an "active" class we style directly.
 */
export default function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t"
      style={{
        background: 'var(--color-bg-elevated)',
        borderColor: 'var(--color-border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <ul className="flex">
        {NAV_ITEMS.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              className="flex flex-col items-center justify-center gap-0.5 py-1.5"
              style={({ isActive }) => ({
                minHeight: 56,
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
              })}
            >
              <span className="h-6 w-6" aria-hidden="true">
                {item.icon}
              </span>
              <span className="text-[11px] font-medium leading-none">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
