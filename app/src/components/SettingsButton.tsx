import { Link } from 'react-router-dom';

/**
 * Small fixed gear icon in the top-right corner, present on every screen
 * except Backup itself. Deliberately not a 5th bottom tab — backup is an
 * occasional action, not a daily one.
 */
export default function SettingsButton() {
  return (
    <Link
      to="/backup"
      aria-label="Backup and settings"
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
