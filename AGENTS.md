# AGENTS.md

Plataforma CEITM — Spanish-language digital governance platform for the CEITM student council (ITM). User-facing text, code comments, and commit messages are in **Spanish**; keep it that way.

## Layout
- `backend/` — FastAPI + SQLModel API. Entry `backend/app/main.py`; all routers mounted there under `/api/v1/...`.
- `frontend/` — React 19 SPA (rolldown-vite, TypeScript, Tailwind, Zustand, React Router v7). Entry `frontend/src/main.tsx`, routes `frontend/src/App.tsx`, central API layer in `frontend/src/shared/services/api.ts`.
- `docker-compose.yml` — runs `db` (Postgres 15) + `backend` only. Frontend is NOT containerized; run via `npm run dev`.

## Commands
```
# Backend + DB (canonical dev setup) — API docs at http://localhost:8000/docs
docker-compose up --build -d
docker-compose down

# Frontend
cd frontend
npm install
npm run dev        # localhost:5173; VITE_API_URL -> http://localhost:8000/api/v1
npm run lint       # eslint (frontend only; no backend lint/formatter configured)
npm run build      # vite build (does NOT typecheck)

# Seed/re-seed data (run from backend/ with the repo-root .venv active)
python -m app.initial_data   # idempotent: careers, news, convenios, map, student, admin, shifts, sanctions
```

## Gotchas
- **No migrations.** Tables are auto-created at startup via `SQLModel.metadata.create_all` (`backend/app/core/database.py`). Changing a model does NOT alter existing tables; there is no Alembic. Live-DB model changes require manual SQL or dropping tables.
- **No tests** (no pytest/vitest) and **no typecheck script**. `vite build` doesn't typecheck. Verify with `npm run lint` and, for TS, `npx tsc -b` (tsconfig references `tsconfig.app.json` + `tsconfig.node.json`).
- **Vite is pinned to rolldown-vite** (`"vite": "npm:rolldown-vite@7.2.5"` in deps + overrides). Don't bump Vite independently.
- **Backend config** reads required env vars from `.env` in the process CWD (`backend/app/core/config.py`); docker-compose supplies the root `.env` via `env_file`. `.env` is gitignored and `.env.example` is **empty** — never commit `.env`.
- **Seeded admin**: `admin@ceitm.mx` / `admin123` (created by `backend/app/initial_data.py`).
- **CORS allow-list is hardcoded** in `backend/app/main.py` (localhost:5173 + ceitm.ddnsking.com). A new dev origin requires editing that list.
- **Mapbox token is hardcoded** in `frontend/src/modules/map/pages/MapPage.tsx`.
- **`backup_db.ps1`** dumps Postgres to `backup_ceitm_*.sql` but hardcodes DB creds in plaintext and the container name `ceitm-web-db-1`. Don't add more secrets to committed files.
- **Root `package.json`** only holds stray legacy deps (react-ga4, openssl) — real frontend deps live in `frontend/`.

## Conventions
- Add API calls only through `frontend/src/shared/services/api.ts`; keep the endpoint map in `.../config/constants.ts` (endpoint strings already prefixed with `/api/v1` via `API_BASE_URL`).
- Auth: JWT Bearer auto-attached by the axios interceptor; role gates in `backend/app/api/deps.py` (`ADMIN_SYS`, etc. defined in `backend/app/models/user_model.py`).
- Commits follow Conventional Commits; branches named `feat/...`, `fix/...`.