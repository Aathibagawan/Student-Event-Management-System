# 🎓 ACE Event & Symposium Management System

A full-stack web app for managing college events, symposiums, student registrations, volunteers, QR-code attendance, budgets and expenses.

**React + Tailwind CSS** · **Django REST Framework** · **PostgreSQL** · JWT auth with role-based access (Admin / Student / Volunteer)

![CI](https://github.com/Aathibagawan/Student-Event-Management-System/actions/workflows/ci.yml/badge.svg)

| Dashboard | Events | Mobile |
|---|---|---|
| ![Dashboard](docs/screenshots/dashboard.png) | ![Events](docs/screenshots/events.png) | ![Mobile](docs/screenshots/mobile.png) |

---

## 🚀 Live Demo

| | |
|---|---|
| Frontend | https://student-event-management-system-two.vercel.app |
| Backend API | https://student-event-management-system-1.onrender.com |
| API docs (Swagger) | https://student-event-management-system-1.onrender.com/api/docs/ |

> The free Render backend sleeps when idle - the first request can take up to a minute.

**Demo accounts** (password for all: `Demo@12345`)

| Role | Email |
|---|---|
| Admin | `admin@ace.local` |
| Volunteer | `volunteer1@ace.local` |
| Student | `student1@ace.local` |

---

## ✨ Features

**Admin** – create/edit/delete events with poster upload · manage volunteers and assign them to events · view all registrations and students · event budgets and expenses (blocks overspending) · dashboard with charts and an SQL-join event report.

**Student** – sign up · browse, search, filter and sort events · register (blocked when full, closed or duplicate) · get a unique registration ID and **QR code**.

**Volunteer** – see assigned events and participants · **scan the QR code** (camera) or type the ID to mark attendance · duplicate check-ins are rejected.

---

## 🧰 Tech Stack & Skills Demonstrated

| Area | What is used (and where) |
|---|---|
| **React** | Reusable components & props (`components/`), `useState`, `useEffect`, `useMemo`, `useCallback`, custom hooks (`useFetch`, `useDebounce`) |
| **State management** | Context API – `AuthContext` (user/session) and `ToastContext` (notifications) |
| **Routing** | React Router v7: dynamic routes (`/events/:id`), nested layouts, **protected + role-based routes**, **lazy loading** (`React.lazy` + `Suspense`) |
| **Forms** | Controlled forms, reusable `FormField`, client validation (`utils/validators.js`) + server error mapping |
| **API integration** | Axios instance with interceptors (auto token attach, **silent refresh on 401**), `async/await`, loading/error/empty states |
| **UX features** | **Debounced search**, filtering, sorting, **server-side pagination**, image upload with preview, toasts, `ErrorBoundary` |
| **Styling** | **Tailwind CSS v4**, fully responsive (mobile drawer sidebar, scrollable tables) |
| **Django / DRF** | REST APIs, ViewSets & routers, CRUD, serializers with validation, custom exception handler, **pagination**, filtering/search/ordering (`django-filter`), Swagger docs (`drf-spectacular`) |
| **Auth & security** | **JWT** (SimpleJWT) with refresh rotation + **token blacklist on logout**, **RBAC permission classes**, **rate limiting**, password hashing & validators, CORS/CSRF from env, HTTPS/HSTS in production, secrets in env vars, upload validation |
| **Middleware** | Django security/CORS/WhiteNoise + custom `RequestTimingMiddleware` (`X-Response-Time`) |
| **Database** | **PostgreSQL**, PKs/FKs, one-to-one, **one-to-many**, **many-to-many** (`Event.volunteers` through `EventVolunteer`), unique & composite constraints, indexes, transactions + row locks (`select_for_update`) |
| **SQL & ORM** | `select_related`, `annotate/aggregate`, `Q`, plus a **raw SQL JOIN report** – see [docs/SQL_QUERIES.md](docs/SQL_QUERIES.md) |
| **File handling** | Event poster upload (`ImageField` + Pillow, type/size validation) · dynamically generated QR codes |
| **Testing** | 45 Django tests (APITestCase) · 17 Vitest/React Testing Library tests |
| **DevOps** | Git/GitHub · **GitHub Actions CI** (tests on PostgreSQL + frontend build) · Docker & docker-compose · Render + Vercel deployment · `.env` configuration · health-check endpoint |

---

## 🏗️ Architecture

```
React (Vite + Tailwind)  ──Axios / JWT──►  Django REST API  ──ORM──►  PostgreSQL
      Vercel                                  Render (Gunicorn)          Render / Neon
```

```
backend/                          frontend/src/
├── config/  settings, urls,      ├── components/  reusable UI (Modal, FormField, Pagination, ...)
│            middleware, pagination,├── context/     AuthContext, ToastContext
│            exceptions            ├── hooks/       useFetch, useDebounce
├── accounts/  users, JWT, RBAC   ├── layouts/     DashboardLayout
├── events/    events, posters    ├── pages/       one file per screen (lazy-loaded)
├── registrations/  QR, e-mail    ├── routes/      AppRoutes, ProtectedRoute
├── attendance/  check-in         ├── services/    api.js (Axios), endpoints.js
├── budgets/   budgets, expenses  ├── utils/       format, validators, tokenStorage
└── dashboard/ stats + SQL report └── test/        Vitest tests
```

More detail: [API reference](docs/API.md) · [Database design](docs/DATABASE.md) · [SQL queries](docs/SQL_QUERIES.md) · [Deployment](docs/DEPLOYMENT.md) · [Interview guide](docs/INTERVIEW_GUIDE.md)

---

## 💻 Run Locally

**Prerequisites:** Python 3.12+, Node 20+ and PostgreSQL (or Docker).

### Option 1 – Docker (PostgreSQL + API in one command)
```bash
docker compose up --build            # API + docs on http://localhost:8000/api/docs/
cd frontend && npm install && npm run dev
```

### Option 2 – Manual
```bash
git clone https://github.com/Aathibagawan/Student-Event-Management-System.git
cd Student-Event-Management-System

# ---- Backend ----
cd backend
python -m venv venv
venv\Scripts\activate                # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env                 # Windows: copy .env.example .env   (then edit DATABASE_URL)
createdb ace_events                  # or create the database in pgAdmin
python manage.py migrate
python manage.py seed_data           # demo users + events (local only)
python manage.py runserver           # http://localhost:8000

# ---- Frontend (new terminal) ----
cd frontend
npm install
cp .env.example .env                 # VITE_API_URL=http://localhost:8000/api
npm run dev                          # http://localhost:5173
```
> No PostgreSQL yet? Leave `DATABASE_URL` empty in `.env` and Django uses a local SQLite file so you can try the app immediately.

### Environment variables (`backend/.env`)
| Variable | Purpose |
|---|---|
| `DJANGO_SECRET_KEY` | Signing key (required when `DJANGO_DEBUG=False`) |
| `DJANGO_DEBUG` | `True` locally, `False` in production |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated hostnames |
| `DATABASE_URL` | `postgresql://user:pass@host:5432/dbname` |
| `CORS_ALLOWED_ORIGINS` / `CSRF_TRUSTED_ORIGINS` | URL(s) of the React app |
| `SERVE_MEDIA` | Serve uploaded posters from Django (demo) |
| `EMAIL_*` | SMTP settings (console backend by default) |

---

## 🌐 API at a glance

```
POST /api/auth/register/ | login/ | refresh/ | logout/      GET /api/auth/me/
GET/POST /api/events/    GET/PATCH/DELETE /api/events/{id}/   GET /api/events/assigned/
     ?search=&event_type=&status=&date=&ordering=&page=&page_size=
POST /api/events/{id}/register/                               GET /api/registrations/ , /{id}/qr/
POST /api/attendance/check-in/                                GET /api/attendance/summary/
GET/POST /api/budgets/ , /api/expenses/                       GET/POST /api/volunteers/ , GET /api/users/
GET  /api/dashboard/ , /api/dashboard/event-report/           GET /api/health/
```
Full reference with request/response examples: [docs/API.md](docs/API.md) or Swagger at `/api/docs/`.

---

## 🧪 Testing

```bash
cd backend  && python manage.py test        # 45 tests
cd frontend && npm test                     # 17 tests
```
CI runs both on every push (`.github/workflows/ci.yml`).

---

## 🔒 Security Practices
* JWT access tokens (30 min) + rotating refresh tokens; refresh tokens are **blacklisted on logout**
* Role checks enforced **on the server** (React hiding a button is only UX)
* Public sign-up can only create students - a role cannot be chosen
* Passwords hashed with Django's PBKDF2 + password validators
* Rate limiting: login 20/min, register 10/hour (HTTP 429)
* Parameterised SQL / ORM (no SQL injection); upload type & size validation
* Secrets only in environment variables; `.env` is git-ignored
* HTTPS redirect, HSTS, secure cookies, `X-Frame-Options`, `nosniff` when `DEBUG=False`
* Known trade-off: tokens are kept in `localStorage` (simple, but readable by XSS). Production hardening option: httpOnly cookies.

---

## ☁️ Deployment
Render (API + PostgreSQL via `render.yaml`) and Vercel (React). Step-by-step: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

---

## 👨‍💻 Developer
**Aathibagawan M** – B.E. Computer Science and Engineering
GitHub: [@Aathibagawan](https://github.com/Aathibagawan)

## 📄 License
MIT – see [LICENSE](LICENSE).
