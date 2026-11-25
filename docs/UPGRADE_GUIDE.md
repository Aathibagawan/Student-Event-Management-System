# Upgrade Guide (what changed vs. the MySQL version)

## Applying the update to your existing repo
```bash
git clone https://github.com/Aathibagawan/Student-Event-Management-System.git
cd Student-Event-Management-System
git checkout -b feature/postgres-tailwind-upgrade
# copy the contents of the zip over the repo (keep the .git folder), then:
git add -A
git commit -m "Upgrade: PostgreSQL, Tailwind CSS, uploads, pagination, debounce, lazy loading, CI, Docker"
git push -u origin feature/postgres-tailwind-upgrade   # open a Pull Request, then merge
```
The zip ships a fresh `frontend/package-lock.json`, so just run `npm ci` / `npm install` in `frontend/`.

## What changed
| Area | Before | Now |
|---|---|---|
| Database | MySQL (`mysqlclient`) | **PostgreSQL** via `DATABASE_URL` (`psycopg2-binary`, `dj-database-url`); SQLite fallback |
| Styling | Hand-written CSS | **Tailwind CSS v4** (responsive sidebar/drawer, cards, tables) |
| Lists | Loaded 200 rows at once | **Server-side pagination**, sorting, filters |
| Search | Request on every key | **Debounced** (400 ms) |
| Pages | One big bundle | **Lazy-loaded** routes (`React.lazy` + `Suspense`) |
| Hooks | `useState/useEffect/useCallback/useMemo` in a few places | + `useDebounce`, race-safe `useFetch`, `useMemo`/`useCallback` in pages |
| Global state | Auth context | + Toast context, `ErrorBoundary` |
| Forms | Inline checks | `FormField` component, `validators.js`, server errors shown under fields |
| Files | - | **Event poster upload** (validated type/size, preview, remove) |
| Auth | JWT | + refresh-token **blacklist on logout** |
| Security | CORS hard-coded | CORS/CSRF from env, **rate limiting**, security headers |
| Backend extras | - | custom **middleware**, `/api/health/`, **raw SQL JOIN report**, M2M `Event.volunteers` |
| DevOps | Render + Vercel | + `Dockerfile`, `docker-compose.yml`, `render.yaml`, **GitHub Actions CI** |
| Tests | 35 backend + 8 frontend | 45 backend + 17 frontend |

## ⚠️ Do these after pulling (your live site)
1. **Render → Environment**: add `DATABASE_URL` (new PostgreSQL), `CORS_ALLOWED_ORIGINS=<your Vercel URL>` and
   `CSRF_TRUSTED_ORIGINS=<your Vercel URL>`. (CORS used to be hard-coded in `settings.py`; now it only reads the env.)
2. Your data lives in MySQL; this version uses a **fresh PostgreSQL** database. Set `SEED_DEMO_DATA=True` to recreate the demo users and events.
3. Remove the old MySQL variables (`DB_ENGINE`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`).
4. Update the live-demo links in `README.md` if your Vercel URL changed.
