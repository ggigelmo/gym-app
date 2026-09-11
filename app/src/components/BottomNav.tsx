import { NavLink } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
  /** Iconify icon name, outline/bold weight — swapped for the *-fill variant when active. */
  icon: string;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/train', label: 'Train', icon: 'ph:house-bold' },
  { to: '/routines', label: 'Routines', icon: 'ph:barbell-bold' },
  { to: '/exercises', label: 'Exercises', icon: 'ph:list-bullets-bold' },
  { to: '/history', label: 'History', icon: 'ph:clock-counter-clockwise-bold' },
  { to: '/progress', label: 'Progress', icon: 'ph:trend-up-bold' },
];

/**
 * Fixed bottom tab bar. Mobile-first: large tap targets, safe-area aware.
 * Uses NavLink so each tab gets an "active" class we style directly.
 */
export default function BottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t px-2 backdrop-blur-xl"
      style={{
        background: 'color-mix(in srgb, var(--color-bg) 90%, transparent)',
        borderColor: 'var(--color-border)',
        // A little breathing room above the safe area even on devices with
        // none (e.g. no home-indicator gesture bar) — otherwise the icons
        // sit flush against the physical bottom edge of the screen.
        paddingBottom: 'calc(env(safe-area-inset-bottom) + 8px)',
      }}
    >
      <ul className="flex">
        {NAV_ITEMS.map((item) => (
          <li key={item.to} className="flex-1">
            <NavLink
              to={item.to}
              className="flex flex-col items-center justify-center gap-1 py-2"
              style={({ isActive }) => ({
                minHeight: 56,
                color: isActive ? 'var(--color-accent)' : 'var(--color-text-muted)',
              })}
            >
              {({ isActive }) => (
                <>
                  <iconify-icon
                    icon={isActive ? item.icon.replace(/-bold$/, '-fill') : item.icon}
                    className="text-2xl"
                    aria-hidden="true"
                  />
                  <span className="text-[10px] font-bold uppercase tracking-widest leading-none">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
