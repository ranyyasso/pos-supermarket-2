# ميزان — Arabic RTL touch POS

Frontend-only supermarket POS prototype built with React, TypeScript, Vite, and browser storage. The client demo runs in Docker and is available at `http://127.0.0.1:18173`.

## Run with Docker

From the repository root:

```powershell
docker compose up -d --build
```

The Compose project is `mizan-pos`. The web server is bound to localhost only. Application data is saved in each browser's `localStorage`, so rebuilding or restarting the container does not remove that browser's data.

## Development and verification

```powershell
npm ci
npm run typecheck
npm test
npm run build
```

Run the isolated browser regression suite with:

```powershell
npm run test:e2e
```

The Docker image runs type-checking, unit tests, and the production build before creating the nginx runtime image.

## Project structure

- `src/` — application UI, browser-state model, printing, reports, and unit tests.
- `e2e/` — Playwright browser regression tests.
- `Dockerfile` and `compose.yaml` — local client-demo hosting.
- `worker/`, `tests/sites-worker.test.mjs`, and `scripts/prepare-sites-build.mjs` — retained packaging support for a future Sites handoff.

## Prototype boundaries

This is currently a UI prototype with no connected backend. Payments and cash-drawer operations are explicitly simulated. Products created in the UI are saved in browser storage until the Supabase client integration is implemented.

Receipt printing uses the browser's print dialog and a Windows-installed printer driver. A browser print request cannot confirm that physical output succeeded. See `THERMAL-PRINTING.md` for the short deployment checklist.

## Supabase Cloud preparation

Numbered SQL files live in `supabase/migrations/`. They are copy-paste artifacts only. Do not run migrations, commit, or push them from this workspace. Tell the project owner that a migration file is ready so they can copy and paste it into the Supabase SQL Editor.

To connect the app to Supabase Cloud later, the following are required:

1. A Supabase project URL and publishable/anonymous key.
2. Local environment variables named `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. Never put a service-role key in this browser app.
3. The `@supabase/supabase-js` client dependency and a single client module that reads those variables.
4. Supabase Auth and Row Level Security policies for cashier/admin access. Migration `0001` enables RLS but deliberately grants no browser access.
5. Product read/create/update functions that replace the current browser-storage product functions, with loading, validation, offline/error handling, and duplicate-barcode handling.
6. A one-time import path only if existing user-created browser products must be preserved.

The first schema file is `supabase/migrations/0001_create_product_tables.sql`. It contains no sample rows.

For the Cloudflare deployment, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the Cloudflare project's build environment for both Production and Preview, then trigger a new build from GitHub. These values are compiled into the browser bundle; the publishable key is intended for frontend use, while the database password and service-role key must never be added there.

Until Supabase Auth is added, `supabase/migrations/0002_anonymous_product_access.sql` grants temporary anonymous CRUD access only to the two product tables. Replace those policies when cashier/admin authentication is implemented.
