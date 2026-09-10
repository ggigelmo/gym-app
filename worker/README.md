# Worker (not implemented yet)

Placeholder for a future Cloudflare Worker sync layer. Not built in the initial
local-only release — the app works fully offline via IndexedDB (see `app/src/db`).

## Intended shape, when sync is added

- `POST /sync/push` — accepts a batch of `OutboxEntry` rows (see `shared/types.ts`)
  from a device's local `outbox` table and applies them.
- `GET /sync/pull?since=<updatedAt>` — returns entities (`exercises`, `routines`,
  `workoutSessions`, `loggedSets`) changed after the given timestamp.
- Backed by Cloudflare D1, with tables mirroring the Dexie schema 1:1 by UUID
  (`id`, `updatedAt`, `deletedAt` columns match exactly).
- Conflict resolution: last-write-wins on `updatedAt`; `deletedAt` tombstones
  propagate deletes instead of hard-deleting rows.
- Auth: not designed yet — likely a simple device token or Cloudflare Access,
  to be decided when this is actually built.

The app's repository layer (`app/src/db/repo/*.ts`) already writes every
mutation to the local `outbox` table, so wiring this up later means adding a
sync client that drains `outbox` and talks to these endpoints — no changes to
the entity schema, UI, or existing write paths.
