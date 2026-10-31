# AGENTS.md

## Project state

- UTN final project: Spanish-language commercial management system (products, sales, stock, stats).
- npm workspaces monorepo: `apps/api` (Express 5 + TS) and `apps/client` (React 19 + Vite 8).
- Scaffold stage: only `/api/health` exists. Docs describe the target architecture (JWT, Prisma, services/repositories), not implemented code. Do not assume modules exist.
- Docs and SQL comments are in Spanish; code identifiers are in English.

## Setup and commands

- `npm install` from the repo root (single root lockfile; no package-level installs).
- Root `npm run dev` uses `npm run dev --workspaces`, which runs sequentially and blocks forever on the API watcher, so the client never starts. Run `npm run dev -w api` and `npm run dev -w client` in separate terminals. `concurrently` is installed but unused.
- Client lint: `npm run lint -w client` (ESLint flat config, only workspace with lint).
- Client typecheck + build: `npm run build -w client` (`tsc -b && vite build`).
- API has no build, lint, or typecheck script: use `npx tsc --noEmit -p apps/api/tsconfig.json`.
- Do not run `npm test` (root, api, or client): all three are placeholders that exit 1. No test framework is configured.
- No CI, formatter, or pre-commit hooks.
- API reads only `PORT` (default 3000); no dotenv installed, so set env vars in the shell. Vite serves on 5173 and has no API proxy configured in `vite.config.ts` (call `http://localhost:3000` explicitly or add a proxy).

## API conventions

- ESM (`"type": "module"`) with NodeNext and `allowImportingTsExtensions`: relative imports must include the `.ts` extension (e.g. `import app from "./app.ts"`).
- `verbatimModuleSyntax` is on: use `import type` for type-only imports.
- Entrypoints: `src/server.ts` (listen) and `src/app.ts` (Express app, routes mounted at `/api/<module>`).
- Follow the three-layer layout in `docs/arquitectura/01-arquitectura-general.md` (routes → controllers → services → repositories); only `routes/` and `controllers/` exist today.
- Strict TS extras: API enables `noUncheckedIndexedAccess` and `exactOptionalPropertyTypes`; client enables `noUnusedLocals`/`noUnusedParameters`.

## Database

- PostgreSQL on Neon. The executable schema is `database/crear-base-datos.sql` (idempotent, applied manually with `psql -f`). The README link to `docs/base-de-datos/crear-base-datos.sql` is stale; edit the file under `database/`.
- Design source is `docs/base-de-datos/dbml.dbml`. For model changes, follow the documented order: edit `dbml.dbml` → export `db-model.png` → update `docs/base-de-datos/01-modelo-relacional.md` and the SQL script.
- Conventions: plural snake_case tables, English enum values (`admin`/`employee`, `completed`/`cancelled`, `cash`/`transfer`/`card`/`other`), money as `decimal(10,2)`, `timestamptz` stored in UTC, soft delete via `is_active` (sales use `status` + cancellation fields instead), sale numbers from `sale_number_seq`.
- Prisma is documented as the DB layer but is not installed and there is no `schema.prisma` or `.env`. There is no migrations folder; do not invent a Prisma workflow without adding the dependency.

## Git workflow

- Always commit and push changes when a task is finished, including doc-only edits to `AGENTS.md`.
- Work on `main` unless told otherwise. Stage only files related to the task, then `git push origin main`.
- Commit messages follow the existing conventional style (`feat:`, `fix:`, `docs:`, `refactor:`), in Spanish or English.
- Confirm `git status` is clean and the push succeeded before reporting the task as done.

## Docs

- `docs/README.md` is the index; `README.md` has the stack table and DB diagram.
- `docs/arquitectura` and `docs/modulos` define intended structure and module priority (auth → products → categories/tags → sales → stock → stats), useful for deciding where new code belongs.
