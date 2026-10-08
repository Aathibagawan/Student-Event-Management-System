# ACE Events — Event & Symposium Management Platform

A full-stack web app for running college events, symposiums and workshops: event creation, student registration with
unique QR codes, volunteer check-in, attendance tracking and budget/expense management.

**Stack:** React (Vite) · Django · Django REST Framework · MySQL · JWT (SimpleJWT) · `qrcode`

---

## ⚠️ Verification status (read this first)

This project was generated in a sandbox **without internet access**, so Django, DRF, MySQL and npm packages could
**not be installed or run** there. What *was* verified:

| Check | Status |
|---|---|
| Every Python file compiles (`py_compile`) | ✅ verified |
| Every JS/JSX file parses; all relative imports resolve | ✅ verified |
| `pip install`, `makemigrations`, `migrate`, `seed_data`, `runserver` | ❌ **not run** – you must run them |
| Backend tests (`python manage.py test`) | ❌ **not run** |
| `npm install`, `npm run dev`, `npm test`, `npm run build` | ❌ **not run** |
| Frontend ↔ backend calls, QR scan with a real camera, MySQL connection | ❌ **not run** |
| Email via real SMTP | ❌ not run (console backend is the default) |

**Migrations are not pre-generated.** Run `python manage.py makemigrations accounts events registrations budgets`
once (step 4 below) — it creates them against *your* Django version. Commit the generated `migrations/` folders afterwards.
If something fails on first run, see [Troubleshooting](#troubleshooting); fixing small issues is part of the learning.

---

## 1. Project overview

Colleges usually run symposiums with spreadsheets, WhatsApp groups and paper attendance sheets. That causes duplicate
registrations, no seat limits, queues at the gate and untracked spending. ACE Events replaces this with one system:

* **Admin** creates events, assigns volunteers, tracks budgets and sees dashboard statistics.
* **Student** registers online and receives a unique registration ID + QR code (and an email).
* **Volunteer** scans the QR at the entrance; attendance is recorded once per student.

## 2. Features

* JWT login/register, refresh tokens, role-based permissions enforced **on the server** (admin / student / volunteer)
* Event CRUD with search + filters (title, type, status, date)
* Student registration with: duplicate prevention, deadline check, capacity check, status check, unique ID `ACE-2026-00001`
* QR generation (PNG) per registration, viewable/downloadable by the student
* QR check-in (camera scanner or manual ID), duplicate check-in blocked, records `check_in_time` and `checked_in_by`
* Volunteer management and event assignment
* Budgets and expenses with `Decimal` money; auto total / remaining / utilization %; spending cannot exceed budget
* Three role-specific dashboards (cards + simple bar charts)
* Confirmation email (console backend in dev, SMTP in production via env variables)
* Swagger/OpenAPI docs at `/api/docs/`, demo data command, tests for the core rules

**Not implemented / optional future work** (deliberately left out, nothing is faked): refresh-token blacklisting on
logout, student self-cancellation, payment gateway for fees (fee is stored/displayed only), pagination UI in React
(API supports `page`/`page_size`; the UI loads up to 200 rows), frontend end-to-end tests.

## 3. Technology stack — why each piece

| Tech | Why |
|---|---|
| React + Vite | Component-based UI, fast dev server and build; React Router for pages |
| Axios | Interceptors attach the JWT and silently refresh it on 401 |
| Django | Batteries included: ORM, auth, admin, migrations, security defaults |
| Django REST Framework | Serializers (validation), viewsets/routers, permissions, browsable API |
| SimpleJWT | Stateless token authentication that works well with a separate React app |
| MySQL + Django ORM | Relational data with foreign keys and constraints; ORM avoids hand-written SQL |
| `qrcode` + Pillow | Generates PNG QR codes in Python |
| `html5-qrcode` | Stable browser camera QR scanner |
| drf-spectacular | Auto-generated OpenAPI/Swagger docs |
| WhiteNoise + Gunicorn | Static files + production WSGI server |

## 4. Architecture

```text
React Frontend (Vite, :5173)
       |
       | HTTP / REST (JSON) + "Authorization: Bearer <access>"
       v
Django REST Framework  (authentication + permissions)
       |
       v
Views / Serializers    (business rules + validation)
       |
       v
Django ORM             (models -> SQL)
       |
       v
MySQL Database
```

Example — a student clicks **Register**:

```text
React button -> eventService.register(id)
  -> POST /api/events/{id}/register/  (Bearer token added by Axios)
  -> JWTAuthentication identifies the user
  -> IsStudentRole permission
  -> transaction + row lock on the Event
  -> checks: status open? deadline? duplicate? capacity?
  -> Registration.objects.create(...)  -> INSERT in MySQL
  -> QR PNG generated + email sent after commit
  -> 201 JSON {"message": "Registration successful", "registration_id": "ACE-2026-00001"}
  -> React shows the message / updates the UI
```

## 5. Folder structure

```text
ACE-Event-Management/
├── backend/
│   ├── manage.py
│   ├── config/            settings, urls, wsgi/asgi, error handler, pagination, test helpers
│   ├── accounts/          custom User (role), Student/Volunteer profiles, auth endpoints, permissions, seed_data
│   ├── events/            Event, EventVolunteer, event CRUD + volunteer assignment
│   ├── registrations/     Registration model, register endpoint, QR + email utils
│   ├── attendance/        QR check-in + attendance summary
│   ├── budgets/           EventBudget, Expense, calculations
│   ├── dashboard/         role-based statistics
│   ├── requirements.txt  .env.example  README.md
├── frontend/
│   └── src/
│       ├── components/    reusable UI (Modal, StatCard, QRScanner, ...)
│       ├── pages/         one file per screen
│       ├── layouts/       sidebar dashboard layout
│       ├── services/      Axios instance + API functions
│       ├── context/       AuthContext (login state)
│       ├── hooks/         useFetch
│       ├── routes/        ProtectedRoute, AppRoutes
│       ├── utils/         formatting, token storage
│       └── test/          Vitest tests
├── docs/                  API.md, DATABASE.md, INTERVIEW_GUIDE.md
└── README.md  .gitignore  LICENSE
```

## 6. Database design

See [docs/DATABASE.md](docs/DATABASE.md) for the full diagram and the reason behind every relationship.

## 7. Authentication flow (JWT)

1. `POST /api/auth/login/` with email + password → server returns `access` (30 min), `refresh` (7 days) and the user.
2. React stores them (localStorage) and Axios adds `Authorization: Bearer <access>` to every call.
3. When the access token expires the API answers `401`; the Axios interceptor calls `/api/auth/refresh/`, saves the new
   tokens and retries the original request. If refresh fails, the user is logged out.
4. Logout = delete tokens on the client (JWT is stateless).
5. Every protected view checks the role from the database user (`request.user.role`), not from anything React sends.

## 8. API documentation

Short list below; complete request/response examples are in [docs/API.md](docs/API.md). Interactive docs: `/api/docs/`.

| Method | URL | Who |
|---|---|---|
| POST | `/api/auth/register/` | public (creates a student) |
| POST | `/api/auth/login/`, `/api/auth/refresh/` | public |
| GET | `/api/auth/me/` | any logged-in user |
| GET | `/api/events/` · `/api/events/<id>/` | any logged-in user |
| POST/PATCH/DELETE | `/api/events/`, `/api/events/<id>/` | admin |
| GET | `/api/events/assigned/` | volunteer |
| GET/POST | `/api/events/<id>/volunteers/` · DELETE `.../<volunteer_id>/` | admin |
| POST | `/api/events/<id>/register/` | student |
| GET | `/api/registrations/` · `/<id>/` · `/<id>/qr/` | scoped by role |
| PATCH/DELETE | `/api/registrations/<id>/` | admin |
| POST | `/api/attendance/check-in/` | volunteer (assigned) / admin |
| GET | `/api/attendance/summary/` | volunteer / admin |
| GET | `/api/users/` · GET/POST `/api/volunteers/` | admin |
| CRUD | `/api/budgets/` · `/api/expenses/` | admin |
| GET | `/api/dashboard/` | any role (role-specific data) |

## 9. Local setup

Prerequisites: Python 3.10+, Node 18+, MySQL 8 (or use SQLite for a quick try), Git.

### Backend

```bash
git clone <repository-url>
cd ACE-Event-Management/backend

python -m venv venv
# Windows
venv\Scripts\activate
# macOS / Linux
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env            # Windows: copy .env.example .env   -> then edit .env

# MySQL: create the database first
#   mysql -u root -p -e "CREATE DATABASE ace_events CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

python manage.py makemigrations accounts events registrations budgets
python manage.py migrate
python manage.py seed_data
python manage.py runserver
```

No MySQL yet? Set `DB_ENGINE=sqlite` in `.env` to try the app with a local `db.sqlite3` file. Use MySQL for the real project.

`mysqlclient` installation: on Windows it normally installs from a prebuilt wheel. On Ubuntu run
`sudo apt install default-libmysqlclient-dev build-essential pkg-config` first; on macOS `brew install mysql pkg-config`.

### Frontend

```bash
cd ACE-Event-Management/frontend
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173. Demo logins (**local development only**, created by `seed_data`):

| Role | Email | Password |
|---|---|---|
| Admin | `admin@ace.local` | `Demo@12345` |
| Volunteer | `volunteer1@ace.local` | `Demo@12345` |
| Student | `student1@ace.local` | `Demo@12345` |

Django admin site: http://localhost:8000/admin/ (log in with the admin account above).

## 10. Environment variables

**backend/.env** (never commit; see `.env.example`)

| Variable | Meaning |
|---|---|
| `DJANGO_SECRET_KEY` | Long random string. Required when `DJANGO_DEBUG=False` |
| `DJANGO_DEBUG` | `True` locally, **`False` in production** |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated hostnames, e.g. `my-api.onrender.com` |
| `DB_ENGINE` | `mysql` (default) or `sqlite` |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | MySQL connection |
| `CORS_ALLOWED_ORIGINS` | Frontend URL(s), e.g. `https://ace-events.vercel.app` |
| `CSRF_TRUSTED_ORIGINS` | Same frontend URL(s) (needed for the Django admin over HTTPS) |
| `EMAIL_BACKEND` | Console backend in dev; `django.core.mail.backends.smtp.EmailBackend` in production |
| `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USE_TLS`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL` | SMTP settings |

Generate a secret key: `python -c "import secrets; print(secrets.token_urlsafe(50))"`

**frontend/.env**: `VITE_API_URL` — the backend API base, e.g. `https://my-api.onrender.com/api`.
Vite bakes this value in at **build time**, so rebuild/redeploy after changing it.

## 11. Testing

```bash
cd backend
python manage.py test                 # all apps
python manage.py test registrations   # one app
```

Django creates a temporary test database. With MySQL the DB user needs permission to create databases
(`GRANT ALL ON test_ace_events.* ...` or use `DB_ENGINE=sqlite` for quick runs).

| Test file | What it checks |
|---|---|
| `accounts/tests.py` | register, role can't be self-chosen, duplicate email, login tokens, wrong password, refresh, 401/403 permissions, admin creates volunteer |
| `events/tests.py` | admin creates event, student can't, past date rejected, deadline-after-date rejected, retrieve/filter/search, update/delete |
| `registrations/tests.py` | register + QR image, confirmation email, duplicate (409), capacity full (409), after deadline (400), closed status (400), admin can't register, students see only their own |
| `attendance/tests.py` | volunteer check-in sets time/user, duplicate check-in (409), unknown ID (404), unassigned volunteer (403), student (403) |
| `budgets/tests.py` | total/remaining/utilization math, API returns calculated fields, expense over budget rejected, negative values rejected, students blocked |

```bash
cd frontend && npm test
```

Frontend: `format.test.js` (money/time/error-message helpers) and `ProtectedRoute.test.jsx` (redirects anonymous users, allows the right role, sends wrong roles back).

## 12. Deployment

Request path in production:

```text
Frontend URL (Vercel/Netlify)  ->  Backend API URL (Render)  ->  Hosted MySQL
https://ace-events.vercel.app      https://ace-api.onrender.com   (managed MySQL host)
```

**1. Database.** Create a managed MySQL database with any provider that offers MySQL (e.g. Aiven, Railway, TiDB Cloud,
a cloud-provider MySQL). Free tiers change often — check current offers. Copy host, port, user, password, db name.

**2. Backend on Render (Web Service).**
* Root directory: `backend` · Runtime: Python
* Build command: `pip install -r requirements.txt && python manage.py collectstatic --noinput && python manage.py migrate`
* Start command: `gunicorn config.wsgi:application`
* Environment variables: everything in section 10 (`DJANGO_DEBUG=False`, real `DJANGO_SECRET_KEY`, `DJANGO_ALLOWED_HOSTS`,
  DB values, `CORS_ALLOWED_ORIGINS=<your frontend URL>`).
* Create the first admin: Render shell → `python manage.py createsuperuser` (or run `seed_data` only on a demo deployment).
* If `mysqlclient` fails to build on the host, see Troubleshooting (PyMySQL fallback).

**3. Frontend on Vercel (or Netlify).**
* Root directory: `frontend` · Framework: Vite · Build: `npm run build` · Output: `dist`
* Environment variable: `VITE_API_URL=https://<your-backend>/api`
* `vercel.json` / `public/_redirects` are included so page refreshes on routes like `/events/3` work.

**4. Connect them.** After the frontend URL exists, put it into the backend's `CORS_ALLOWED_ORIGINS` and
`CSRF_TRUSTED_ORIGINS` and redeploy the backend.

Notes: Render's free web services sleep when idle (first request is slow). QR images are regenerated on demand from the
registration ID, so losing the server's `media/` folder on redeploy does not break QR codes.

## 13. Git workflow

```bash
git init
git add .
git commit -m "feat: add JWT authentication"
```

Example commit messages: `feat: add event management APIs` · `feat: implement student registration` ·
`feat: implement QR attendance` · `feat: add budget management` · `fix: prevent duplicate event registration` ·
`docs: update deployment instructions`.

## 14. Troubleshooting

| Problem | Fix |
|---|---|
| `pip install mysqlclient` fails | Install system libs (see Local setup). Fallback: `pip install pymysql` and add `import pymysql; pymysql.install_as_MySQLdb()` at the top of `config/__init__.py` |
| `Access denied for user` / `Unknown database` | Check `DB_*` in `.env`; create the database first |
| `RuntimeError: DJANGO_SECRET_KEY must be set` | Create `.env` from `.env.example` (or set `DJANGO_DEBUG=True` for local work) |
| `no such table` / `relation does not exist` | You skipped `makemigrations` / `migrate` |
| `django.db.migrations.exceptions.InconsistentMigrationHistory` | You ran `migrate` before `makemigrations` created `accounts`' migration (custom user). Drop the dev database, then run `makemigrations` first |
| React shows "Cannot reach the server" | Backend not running, wrong `VITE_API_URL`, or CORS origin missing in backend `.env` |
| Browser console CORS error | Add the exact frontend origin (no trailing slash) to `CORS_ALLOWED_ORIGINS` |
| Login says "Invalid email or password" | Use the seeded emails; run `seed_data` again (safe to repeat) |
| Camera scanner is blank | Allow camera permission; use `localhost` or HTTPS; use "Enter ID manually" as a fallback |
| 400 "Registration is not open" | Event status must be `Registration Open` and the deadline in the future |
| Static files missing in production | Run `collectstatic`; keep WhiteNoise in `MIDDLEWARE` |
| Page refresh gives 404 on hosting | Make sure `vercel.json` or `public/_redirects` is deployed |

## 15. Learning material

Read [docs/INTERVIEW_GUIDE.md](docs/INTERVIEW_GUIDE.md): concepts used, the full data-flow, 40+ interview questions with
answers, plus a 2-minute and a 30-second project pitch.

## License

MIT — see `LICENSE`.
