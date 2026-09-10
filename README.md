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

`npm run deploy --workspace=app` runs `wrangler pages deploy dist` inside
`app/`, using `pages_build_output_dir = "dist"` from `app/wrangler.toml` to
resolve the output folder. Wrangler prompts to select or create the Pages
project on first deploy if run interactively; pass `--project-name=<name>`
to pin it explicitly (e.g. in a non-interactive script).

### Option B — Cloudflare Pages dashboard (Git integration)

Connect the repo in the Cloudflare Pages / Workers Builds dashboard and set,
under Build configuration:

- **Root directory:** `app`
- **Build command:** `npm run build`
- **Deploy command:** `npx wrangler pages deploy dist`

(This project uses Cloudflare's unified "Workers Builds" pipeline, which runs
an explicit deploy command rather than a separate "build output directory"
field — `wrangler deploy` alone does **not** work here, since it expects a
Worker entry point or an `[assets]` block, not `pages_build_output_dir`; use
`wrangler pages deploy` instead.)

With Git integration, every push triggers a new deploy automatically — no
CI/CD pipeline to maintain beyond that.

### Notes

- `app/wrangler.toml` sets `pages_build_output_dir = "dist"` so
  `wrangler pages deploy dist` resolves output correctly once authenticated.
- `app/public/_headers` sets sane Cloudflare Pages cache headers for the
  service worker and manifest (always revalidated, so the in-app update
  prompt isn't blocked by a stale HTTP cache) and long-lived immutable
  caching for hashed build assets.
- This is a small, single-user static site — no Kubernetes, no Terraform,
  no multi-region setup. Cloudflare Pages' own build/deploy handles
  everything needed here.
