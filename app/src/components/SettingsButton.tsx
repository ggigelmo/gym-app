import { Link } from 'react-router-dom';

/**
 * Small fixed gear icon in the top-right corner, present on every screen
 * except Profile itself. Deliberately not a 6th bottom tab — goals/backup
 * are occasional actions, not a daily one (unlike Progress, which is).
 */
export default function SettingsButton() {
  return (
    <Link
      to="/profile"
      aria-label="Profile and settings"
      className="fixed z-30 flex items-center justify-center rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.08)] active:scale-95 transition-transform"
      style={{
        top: `calc(env(safe-area-inset-top) + 12px)`,
        right: 16,
        width: 44,
        height: 44,
        background: 'var(--color-bg-elevated)',
        color: 'var(--color-text)',
      }}
    >
      <iconify-icon icon="ph:gear-six-bold" className="text-xl" aria-hidden="true" />
    </Link>
  );
}
