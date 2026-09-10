# Gym Tracker

Gym Tracker is an offline-first Progressive Web App for recording gym training
sessions — exercises, routines, and logged sets (weight, reps, unit) — built
primarily for one-handed use on a phone, mid-workout. It works fully offline
and syncs when a connection is available.

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

## Deploying to Cloudflare Pages

The app is a static build with no backend, so Cloudflare Pages is a direct
fit. Two ways to deploy:

### Option A — CLI (Wrangler)

From the repo root:

```bash
npx wrangler login          # one-time browser auth, run from anywhere in the repo
npm run build                # produces app/dist
npm run deploy --workspace=app
```

`npm run deploy --workspace=app` runs
`wrangler pages deploy dist --project-name=gym-tracker-pwa` inside `app/`,
using the settings in `app/wrangler.toml` (project name, `pages_build_output_dir
= "dist"`). Wrangler creates the Pages project on first deploy if it doesn't
exist yet.

### Option B — Cloudflare Pages dashboard (Git integration)

Connect the repo in the Cloudflare Pages dashboard and set:

- **Root directory:** `app`
- **Build command:** `npm run build`
- **Build output directory:** `app/dist`

With Git integration, every push triggers a new deploy automatically — no
CI/CD pipeline to maintain beyond that.

### Notes

- `app/wrangler.toml` pins the project name (`gym-tracker-pwa`) and output
  directory so `wrangler pages deploy` works with no extra flags once
  authenticated.
- `app/public/_headers` sets sane Cloudflare Pages cache headers for the
  service worker and manifest (always revalidated, so the in-app update
  prompt isn't blocked by a stale HTTP cache) and long-lived immutable
  caching for hashed build assets.
- This is a small, single-user static site — no Kubernetes, no Terraform,
  no multi-region setup. Cloudflare Pages' own build/deploy handles
  everything needed here.
