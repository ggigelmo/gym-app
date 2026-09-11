// Best-effort request that the browser exempt this origin's storage
// (IndexedDB included) from storage-pressure eviction. Silently a no-op on
// browsers that don't support the Storage API — nothing here should ever
// block or fail app startup.
export function requestPersistentStorage(): void {
  if (!('storage' in navigator) || !navigator.storage?.persist) return;

  void navigator.storage.persist().catch(() => {
    // Ignore — persistence is a nice-to-have, not a requirement.
  });
}
