# AGENTS.md

## Project state

- UTN final project: Spanish-language commercial management system (products, sales, stock, stats).
- npm workspaces monorepo: `apps/api` (Express 5 + TS) and `apps/client` (React 19 + Vite 8).
- Auth, the products CRUD and the tags/categories CRUD are implemented in the API (JWT login, `/api/auth/me`, role middleware, `/api/products`, `/api/tags`, `/api/categories`). The client has a login screen plus a protected dashboard; its **Productos** section is connected to the API (list, detail, create, edit and soft delete) and **Settings** includes admin-only tags and categories managers (list, create, edit, soft delete and reactivate) plus the user creation form, while profile/preferences in Settings remain simulated. Ventas and Estadisticas are still mocks. Sales, stock and stats are still mocks: do not assume real modules exist.
- Users, categories and tags are persisted in PostgreSQL through `pg`; the API seeds `admin`/`admin` plus the base categories and tags when `npm run db:setup -w api` runs. Products remain in memory.
- Docs and SQL comments are in Spanish; code identifiers are in English.

## Setup and commands

- `npm install` or `pnpm install` from the repo root (single root lockfile; no package-level installs). pnpm needs the committed `pnpm-workspace.yaml`; both `package-lock.json` and `pnpm-lock.yaml` are tracked, so update the one for the package manager you use.
- Root `npm run dev` or `pnpm dev` runs the API and the client together with `concurrently`, with labeled output. It replaces the old sequential `--workspaces` script that blocked on the API watcher.
- Run `npm run dev -w api` and `npm run dev -w client` in separate terminals only when isolated logs are needed.
- With pnpm, workspace commands use `pnpm --filter <name> <script>` (for example `pnpm --filter client build`); `-w` in pnpm means workspace root, not workspace name.
- Client lint: `npm run lint -w client` (ESLint flat config, only workspace with lint).
- Client typecheck + build: `npm run build -w client` (`tsc -b && vite build`).
- API typecheck: `npx tsc --noEmit -p apps/api/tsconfig.json`. Production build: `npm run build -w api` (`tsc` to `apps/api/dist`, gitignored) and `npm start -w api` (`node dist/server.js`).
- Do not run `npm test` (root, api, or client): all three are placeholders that exit 1. No test framework is configured.
- No CI, formatter, or pre-commit hooks.
- API reads `PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `DATABASE_URL`, `DATABASE_SSL` and `CLIENT_URL`. The API loads the repository-root `.env` with Node's `process.loadEnvFile` when it exists (no dotenv dependency), and variables already defined in the environment win, so the Render panel overrides the file. Defaults are dev-only (`admin`/`admin`, `dev-secret-change-me`, `postgres://postgres:postgres@localhost:5432/utn_tfi`). `DATABASE_SSL` defaults to `true` for non-local hosts (Render, Neon). `CLIENT_URL` accepts a comma-separated list of allowed origins for CORS and defaults to `http://localhost:5173`.
- Prepare the database with `npm run db:setup -w api`: creates `utn_tfi` if needed, applies `database/crear-base-datos.sql` (idempotent), seeds the admin user and the base categories/tags (explicit ids matching the in-memory products, `ON CONFLICT DO NOTHING`). The API verifies the connection on startup and exits if PostgreSQL is unreachable.
- Vite serves on 5173 and proxies `/api` to `http://localhost:3000` in development; `VITE_API_URL` overrides the client's API base URL in production. The API enables `cors` with the origins listed in `CLIENT_URL`, so deployed clients must be registered there.

## API conventions

- ESM (`"type": "module"`) with NodeNext and `allowImportingTsExtensions`: relative imports must include the `.ts` extension (e.g. `import app from "./app.ts"`).
- `verbatimModuleSyntax` is on: use `import type` for type-only imports.
- Entrypoints: `src/server.ts` (listen) and `src/app.ts` (Express app, routes mounted at `/api/<module>`).
- Follow the three-layer layout in `docs/arquitectura/01-arquitectura-general.md` (routes → controllers → services → repositories); `routes/`, `controllers/`, `services/`, `repositories/`, `middlewares/`, `errors/`, `config/` and `types/` exist today. Keep business rules in services and data access in repositories.
- Auth endpoints: `POST /api/auth/login` and `GET /api/auth/me`. Errors use `{ error: { code, message } }`; protect routes with `authenticate` and restrict roles with `authorize(...roles)`. Users are read from PostgreSQL; `login` and `getProfile` are async.
- Product endpoints: `GET /api/products` and `GET /api/products/:id` require authentication; `POST /api/products`, `PATCH /api/products/:id` and `DELETE /api/products/:id` require `admin`. `DELETE` is a soft delete. In `PATCH`, a category or tag that is already assigned is kept even if it became inactive; only newly added categories/tags must be active. `POST` still requires every category and tag to be active.
- Tag endpoints: `GET /api/tags` and `GET /api/tags/:id` require authentication; `POST /api/tags`, `PATCH /api/tags/:id` and `DELETE /api/tags/:id` require `admin`. `DELETE` is a soft delete and `PATCH` with `isActive: true` reactivates. `GET /api/tags?includeInactive=true` is honored only for `admin`; for `employee` it is ignored. Names are unique case-insensitively and colors use `#RRGGBB`.
- Category endpoints: `GET /api/categories` and `GET /api/categories/:id` require authentication; `POST /api/categories`, `PATCH /api/categories/:id` and `DELETE /api/categories/:id` require `admin`. `DELETE` is a soft delete and `PATCH` with `isActive: true` reactivates. `GET /api/categories?includeInactive=true` is honored only for `admin`; for `employee` it is ignored. Names are unique case-insensitively and limited to 100 characters; `description` is optional and limited to 500. For `admin`, category responses include `activeProductCount` so the UI can warn before deactivating a category in use.
- Strict TS extras: API enables `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`; client enables `noUnusedLocals`/`noUnusedParameters`.

## Code style and clean code

- Keep functions small and focused on one responsibility. Use guard clauses and early returns/throws instead of deeply nested `if` blocks.
- Validate input declaratively. Define a shape that maps each field to a parser from `src/validators/validation.ts` and parse it with `parseObject`, `parsePartialObject` or `parseOptionalObject`; do not repeat one `if` per field in each validator.
- Add reusable parsers and generic helpers to `src/validators/validation.ts` instead of duplicating validation mechanics. Keep module-specific limits, messages and schemas in the module validator.
- Keep input parsing in `validators/`, business rules in `services/` and data access in `repositories/`.
- Extract named constants for limits and defaults; avoid magic numbers and duplicated strings.
- Prefer the shared parser helpers over adding a new validation dependency (for example Zod). If a dependency is still needed, make it an explicit decision first.
- Keep user-facing messages in Spanish and code identifiers in English.

## Database

- PostgreSQL on Render. The executable schema is `database/crear-base-datos.sql` (idempotent, applied by `npm run db:setup -w api` or manually with `psql -f`). The README link to `docs/base-de-datos/crear-base-datos.sql` is stale; edit the file under `database/`.
- Design source is `docs/base-de-datos/dbml.dbml`. For model changes, follow the documented order: edit `dbml.dbml` → export `db-model.png` → update `docs/base-de-datos/01-modelo-relacional.md` and the SQL script.
- Conventions: plural snake_case tables, English enum values (`admin`/`employee`, `completed`/`cancelled`, `cash`/`transfer`/`card`/`other`), money as `decimal(10,2)`, `timestamptz` stored in UTC, soft delete via `is_active` (sales use `status` + cancellation fields instead), sale numbers from `sale_number_seq`.
- The API uses `pg` (no Prisma, no `schema.prisma`, no migrations folder). `src/config/database.ts` owns the pool; `src/scripts/setup-database.ts` creates the database, applies the SQL schema and seeds the admin plus the base categories and tags.
- Users, categories and tags are read from and written to their PostgreSQL tables (`users`, `categories`, `tags`). Products still use an in-memory repository that mirrors the `products` table.

## Deployment

- Frontend on Vercel; the API and PostgreSQL run on Render. `apps/client/vercel.json` rewrites every route to `index.html` so the React Router deep links work.
- Render Web Service (repo root, Node 22): build `npm install --include=dev && npm run build -w api`, start `npm start -w api`, health check path `/api/health`. Required env vars: `DATABASE_URL` (Render Postgres internal URL; database and service must share a region), `JWT_SECRET` and `CLIENT_URL`; `JWT_EXPIRES_IN` is optional. `ADMIN_USERNAME`/`ADMIN_PASSWORD` only matter when running `db:setup`.
- Vercel (root directory `apps/client`): build `npm run build`, output `dist`, env `VITE_API_URL=https://<service>.onrender.com/api` (must include `/api`). Vite bakes it in at build time, so redeploy the client after changing it.
- Apply the schema against Render Postgres from a local machine with the external database URL before the first API deploy; the API warns at startup and `/api/health` returns 503 when the schema is missing. Free Render Postgres expires 30 days after creation and has no backups.

## Git workflow

- Always commit and push changes when a task is finished, including doc-only edits to `AGENTS.md`.
- Commits must always be atomic: one logical task per commit, only the files related to it, and the build must stay green. Do not mix features, fixes, refactors, formatting or docs in the same commit; split the work into ordered commits.
- Start each task from an up-to-date `main` on a topic branch. Work directly on `main` only for trivial changes explicitly requested.
- Branch names follow `<type>/<scope>-<short-description>`:
  - `type`: same values as commit types (`feat`, `fix`, `docs`, `refactor`, `chore`, `test`, `perf`, `build`, `ci`).
  - `scope`: affected area (`api`, `client`, `docs`, `db`, `repo`).
  - `short-description`: lowercase kebab-case, imperative and brief.
  - Examples: `feat/api-products-crud`, `fix/client-login-redirect`, `docs/product-plan`.
- Push the topic branch to `origin` and report its name. Merge or open a pull request only when explicitly requested.
- Commit messages are written in English and follow [Conventional Commits](https://www.conventionalcommits.org/): `<type>(<scope>): <subject>`.
  - `type`: `feat`, `fix`, `docs`, `refactor`, `chore`, `test`, `perf`, `build` or `ci`.
  - `scope`: optional but recommended; use the affected area (`api`, `client`, `docs`, `db`, `repo`).
  - `subject`: imperative, lowercase, no trailing period, at most 72 characters.
  - Add a body when the reason for the change is not obvious and a `BREAKING CHANGE:` footer when applicable.
  - Examples: `feat(api): add products CRUD`, `docs: define branch and commit conventions`.
- Confirm `git status` is clean and the push succeeded before reporting the task as done.

## Docs

- `docs/README.md` is the index; `README.md` has the stack table, DB diagram and setup commands.
- `docs/planificacion/04-plan-autenticacion.md` documents the auth plan, endpoints, routes and pending work.
- `docs/planificacion/05-plan-productos.md` documents the products plan, endpoints and pending work.
- `docs/planificacion/06-plan-productos-frontend.md` documents the client integration for products and its verification steps.
- `docs/planificacion/07-plan-tags-categorias.md` documents the tags and categories CRUD (API and Settings UI), permissions, the inactive category/tag product-edit rule and verification.
- `docs/arquitectura` and `docs/modulos` define intended structure and module priority (auth → products → categories/tags → sales → stock → stats), useful for deciding where new code belongs.
