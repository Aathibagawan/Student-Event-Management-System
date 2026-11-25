# Deployment Guide

Free-tier friendly setup: **PostgreSQL + Django on Render**, **React on Vercel**.

```
Vercel (React)  --HTTPS-->  Render (Django + Gunicorn)  -->  Render PostgreSQL
```

## 1. Backend + database on Render

**Option A - Blueprint (fastest):** Render dashboard → *New* → *Blueprint* → pick this repo. `render.yaml` creates the web service
and the PostgreSQL database and connects them (`DATABASE_URL` is injected automatically).

**Option B - manual:**
1. *New → PostgreSQL* (free). Copy the **Internal Database URL**.
2. *New → Web Service*: Root directory `backend`, Build command `./build.sh`, Start command `gunicorn config.wsgi:application`,
   Health check path `/api/health/`.
3. Add environment variables:

| Variable | Value |
|---|---|
| `DJANGO_SECRET_KEY` | long random string (`python -c "import secrets;print(secrets.token_urlsafe(50))"`) |
| `DJANGO_DEBUG` | `False` |
| `DJANGO_ALLOWED_HOSTS` | `.onrender.com` (or your domain) |
| `DATABASE_URL` | the PostgreSQL URL from step 1 |
| `CORS_ALLOWED_ORIGINS` | your Vercel URL, e.g. `https://my-app.vercel.app` (no trailing slash) |
| `CSRF_TRUSTED_ORIGINS` | same URL |
| `SERVE_MEDIA` | `True` (serves uploaded posters) |
| `SEED_DEMO_DATA` | `True` once for a demo (creates demo users/events); `False` afterwards |

`build.sh` installs packages, collects static files, runs migrations (and the seed if enabled).

## 2. Frontend on Vercel
1. *Add New → Project* → import the repo, **Root Directory = `frontend`** (Vite is auto-detected).
2. Environment variable: `VITE_API_URL=https://<your-render-service>.onrender.com/api`
3. Deploy. `vercel.json` rewrites every path to `index.html` so React Router deep links work.
4. Copy the Vercel URL back into Render's `CORS_ALLOWED_ORIGINS` / `CSRF_TRUSTED_ORIGINS` and redeploy the backend.

## 3. Verify
* `https://<api>/api/health/` → `{"status":"ok","database":"up"}`
* `https://<api>/api/docs/` → Swagger UI
* Open the Vercel URL, log in with a demo account.

## Things to know (good interview answers)
* **Free Render services sleep** after inactivity; the first request can take ~30-60 s.
* **Uploaded posters** are stored on the server disk. Render's free disk is *ephemeral* - files vanish on redeploy. For production,
  switch Django's `STORAGES["default"]` to S3 / Cloudinary (`django-storages`). QR codes are generated on demand, so they are unaffected.
* **Never** commit `.env`. Rotate `DJANGO_SECRET_KEY` if it leaks.
* Set `SEED_DEMO_DATA=False` for anything other than a demo - the seed uses a known password.

## Docker (local, production-like)
```bash
docker compose up --build        # PostgreSQL + Django on http://localhost:8000
cd frontend && npm install && npm run dev
```
