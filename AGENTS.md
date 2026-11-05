# AGENTS.md

## Project state

- UTN final project: Spanish-language commercial management system (products, sales, stock, stats).
- npm workspaces monorepo: `apps/api` (Express 5 + TS) and `apps/client` (React 19 + Vite 8).
- Auth is implemented (JWT login, `/api/auth/me`, role middleware) and the client has a login screen plus a protected dashboard with mocked Products/Ventas/Estadisticas/Settings sections. Products, sales, stock and stats are still mocks: do not assume real modules exist.
- Users live in an in-memory repository seeded with `admin`/`admin`; PostgreSQL is not connected yet.
- Docs and SQL comments are in Spanish; code identifiers are in English.

## Setup and commands

- `npm install` or `pnpm install` from the repo root (single root lockfile; no package-level installs). pnpm needs the committed `pnpm-workspace.yaml`; both `package-lock.json` and `pnpm-lock.yaml` are tracked, so update the one for the package manager you use.
- Root `npm run dev` or `pnpm dev` runs the API and the client together with `concurrently`, with labeled output. It replaces the old sequential `--workspaces` script that blocked on the API watcher.
- Run `npm run dev -w api` and `npm run dev -w client` in separate terminals only when isolated logs are needed.
- With pnpm, workspace commands use `pnpm --filter <name> <script>` (for example `pnpm --filter client build`); `-w` in pnpm means workspace root, not workspace name.
- Client lint: `npm run lint -w client` (ESLint flat config, only workspace with lint).
- Client typecheck + build: `npm run build -w client` (`tsc -b && vite build`).
- API has no build, lint, or typecheck script: use `npx tsc --noEmit -p apps/api/tsconfig.json`.
- Do not run `npm test` (root, api, or client): all three are placeholders that exit 1. No test framework is configured.
- No CI, formatter, or pre-commit hooks.
- API reads `PORT`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `ADMIN_USERNAME` and `ADMIN_PASSWORD`; no dotenv installed, so set env vars in the shell. Defaults are dev-only (`admin`/`admin`, `dev-secret-change-me`).
- Vite serves on 5173 and proxies `/api` to `http://localhost:3000`; `VITE_API_URL` overrides the client's API base URL.

## API conventions

- ESM (`"type": "module"`) with NodeNext and `allowImportingTsExtensions`: relative imports must include the `.ts` extension (e.g. `import app from "./app.ts"`).
- `verbatimModuleSyntax` is on: use `import type` for type-only imports.
- Entrypoints: `src/server.ts` (listen) and `src/app.ts` (Express app, routes mounted at `/api/<module>`).
- Follow the three-layer layout in `docs/arquitectura/01-arquitectura-general.md` (routes → controllers → services → repositories); `routes/`, `controllers/`, `services/`, `repositories/`, `middlewares/`, `errors/`, `config/` and `types/` exist today. Keep business rules in services and data access in repositories.
- Auth endpoints: `POST /api/auth/login` and `GET /api/auth/me`. Errors use `{ error: { code, message } }`; protect routes with `authenticate` and restrict roles with `authorize(...roles)`. The user store is in memory until PostgreSQL is connected.
- Strict TS extras: API enables `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`; client enables `noUnusedLocals`/`noUnusedParameters`.

## Database

- PostgreSQL on Neon. The executable schema is `database/crear-base-datos.sql` (idempotent, applied manually with `psql -f`). The README link to `docs/base-de-datos/crear-base-datos.sql` is stale; edit the file under `database/`.
- Design source is `docs/base-de-datos/dbml.dbml`. For model changes, follow the documented order: edit `dbml.dbml` → export `db-model.png` → update `docs/base-de-datos/01-modelo-relacional.md` and the SQL script.
- Conventions: plural snake_case tables, English enum values (`admin`/`employee`, `completed`/`cancelled`, `cash`/`transfer`/`card`/`other`), money as `decimal(10,2)`, `timestamptz` stored in UTC, soft delete via `is_active` (sales use `status` + cancellation fields instead), sale numbers from `sale_number_seq`.
- Prisma is documented as the DB layer but is not installed and there is no `schema.prisma` or `.env`. There is no migrations folder; do not invent a Prisma workflow without adding the dependency.
- The API does not query the `users` table yet; the in-memory repository mirrors its fields (including the bcrypt password hash).

## Git workflow

- Always commit and push changes when a task is finished, including doc-only edits to `AGENTS.md`.
- Commits must always be atomic: one logical task per commit, only the files related to it, and the build must stay green. Do not mix features, fixes, refactors, formatting or docs in the same commit; split the work into ordered commits.
- Work on `main` unless told otherwise. Stage only files related to the task, then `git push origin main`.
- Commit messages follow the existing conventional style (`feat:`, `fix:`, `docs:`, `refactor:`), in Spanish or English.
- Confirm `git status` is clean and the push succeeded before reporting the task as done.

## Docs

- `docs/README.md` is the index; `README.md` has the stack table, DB diagram and setup commands.
- `docs/planificacion/04-plan-autenticacion.md` documents the auth plan, endpoints, routes and pending work.
- `docs/arquitectura` and `docs/modulos` define intended structure and module priority (auth → products → categories/tags → sales → stock → stats), useful for deciding where new code belongs.
