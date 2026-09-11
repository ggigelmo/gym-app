# Gym Tracker

Gym Tracker is an offline-first Progressive Web App for recording gym training
sessions — exercises, routines, logged sets (weight, reps, unit), progress
stats, and personal goals — built primarily for one-handed use on a phone,
mid-workout. It works fully offline and syncs when a connection is available.

## Data & privacy

**Everything is stored locally, on your own device — nothing is sent to a
server.** All app data (exercises, routines, workout sessions, logged sets,
and the Profile screen's weight/strength goals) lives entirely in your
browser's local IndexedDB storage via [Dexie](https://dexie.org/). The app
makes no network calls to send or sync this data anywhere; the `worker/`
package is an unimplemented placeholder for an optional future sync backend
(see `worker/README.md`). Uninstalling the app or clearing your browser's
site data deletes it for good — use the Profile screen's Export/Import backup
feature to keep a copy.

## Design

The app's visual design (color system, typography, icons, and the layout of
every screen) was designed with [Sleek](https://sleek.design), an AI-powered
mobile app design tool, and implemented in code from Sleek's generated
designs.

## Monorepo layout

npm workspaces, three packages:

- `app/` — the Vite + React 19 + TypeScript PWA. This is the actual
  application; almost everything lives here.
- `shared/` — shared TypeScript types used by the app (and, eventually, the
  worker): `Exercise`, `Routine`, `RoutineExercise`, `WorkoutSession`,
  `LoggedSet`, `OutboxEntry`, `MuscleGroup`, `WeightUnit`, `SyncMeta`, etc.
- `worker/` — placeholder for a future sync backend. Not implemented yet.

## Running locally

From the repo root:

```bash
npm install
npm run dev
```

This starts the Vite dev server for `app/` (via the root `dev` script,
which proxies to `npm run dev --workspace=app`).

## Building

From the repo root:

```bash
npm run build
```

This runs `tsc -b && vite build` inside `app/`, producing a static build in
`app/dist`.

## Deploying to Cloudflare



The app is a static build with no backend, deployed as a Cloudflare Worker
serving static assets (Cloudflare's current unified model — this superseded
classic "Pages projects"; `app/wrangler.toml`'s `[assets]` block with
`not_found_handling = "single-page-application"` handles both static file
serving and the client-side routing fallback, so deep links like
`/routines/<id>` work on a hard refresh). Two ways to deploy:

### Option A — CLI (Wrangler)

From the repo root:

```bash
npx wrangler login          # one-time browser auth, run from anywhere in the repo
npm run build                # produces app/dist
npm run deploy --workspace=app
```

`npm run deploy --workspace=app` runs `wrangler deploy` inside `app/`, which
reads `app/wrangler.toml` (`name`, `[assets] directory = "./dist"`) and
uploads the built assets — no separate project-creation step needed, it
creates/updates the Worker on first deploy.

### Option B — Cloudflare dashboard (Git integration / Workers Builds)

Connect the repo in the Cloudflare dashboard and set, under Build
configuration:

- **Root directory:** `app`
- **Build command:** `npm run build`
- **Deploy command:** `npx wrangler deploy` (the dashboard's default — no
  override needed once `wrangler.toml` uses the `[assets]` block above)

With Git integration, every push triggers a new deploy automatically — no
CI/CD pipeline to maintain beyond that.

### Notes

- `app/wrangler.toml` uses the modern `[assets]` directive (not the legacy
  `pages_build_output_dir` key) — that's what makes plain `wrangler deploy`
  work directly, matching Cloudflare's current default deploy command.
- `app/public/_headers` sets sane Cloudflare cache headers for the
  service worker and manifest (always revalidated, so the in-app update
  prompt isn't blocked by a stale HTTP cache) and long-lived immutable
  caching for hashed build assets.
- This is a small, single-user static site — no Kubernetes, no Terraform,
  no multi-region setup. Cloudflare Pages' own build/deploy handles
  everything needed here.
