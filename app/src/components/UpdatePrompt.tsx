import { useEffect, useRef, useState } from 'react';
import { registerSW } from 'virtual:pwa-register';

/**
 * Registers the service worker once on mount and surfaces two states as a
 * dismissible bottom banner:
 *  - "offline ready": first install finished, app now works with no network.
 *  - "update available": a new version is precached and waiting. We never
 *    swap it in automatically — reloading mid-set would drop unsaved work
 *    from a workout in progress — so the reload only happens when the user
 *    taps the button.
 */
export default function UpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const updateSWRef = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    updateSWRef.current = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeedRefresh(true);
      },
      onOfflineReady() {
        setOfflineReady(true);
      },
    });
  }, []);

  // Calling with `true` reloads the page once the new service worker has
  // taken control.
  const handleReload = () => void updateSWRef.current?.(true);

  const dismissOfflineReady = () => setOfflineReady(false);

  if (!needRefresh && !offlineReady) return null;

  return (
    <div
      className="fixed inset-x-0 z-50 mx-auto flex max-w-md items-center gap-3 rounded-xl border px-4 py-3 shadow-lg"
      style={{
        left: 12,
        right: 12,
        bottom: `calc(72px + env(safe-area-inset-bottom))`,
        background: 'var(--color-bg-elevated)',
        borderColor: 'var(--color-border)',
        color: 'var(--color-text)',
      }}
      role="status"
    >
      {needRefresh ? (
        <>
          <p className="min-w-0 flex-1 text-sm font-medium">
            Update available.
          </p>
          <button
            type="button"
            onClick={handleReload}
            className="shrink-0 rounded-lg px-3 text-sm font-semibold active:opacity-70"
            style={{
              minHeight: 40,
              background: 'var(--color-accent)',
              color: 'var(--color-accent-contrast)',
            }}
          >
            Reload
          </button>
        </>
      ) : (
        <>
          <p className="min-w-0 flex-1 text-sm font-medium">
            Ready to work offline.
          </p>
          <button
            type="button"
            onClick={dismissOfflineReady}
            aria-label="Dismiss"
            className="shrink-0 rounded-lg px-3 text-sm font-semibold active:opacity-70"
            style={{ minHeight: 40, color: 'var(--color-text-muted)' }}
          >
            Dismiss
          </button>
        </>
      )}
    </div>
  );
}
