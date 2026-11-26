
# ============================================================
# DATABASE CONFIGURATION
# Local development: SQLite
# Production (Render): PostgreSQL through DATABASE_URL
# ============================================================

DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()

if DATABASE_URL:
    DATABASES = {
        "default": dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=600,
            ssl_require=os.environ.get(
                "DB_SSL_REQUIRE",
                "False"
            ).lower() == "true",
        )
    }

    # Prevent accidental connection to a local database in production.
    if DATABASES["default"]["HOST"] in ("127.0.0.1", "localhost"):
        raise RuntimeError(
            "Production DATABASE_URL must point to a remote database, "
            "not localhost."
        )

else:
    if not DEBUG:
        raise RuntimeError(
            "DATABASE_URL must be configured for production. "
            "Create a PostgreSQL database and add its URL in Render."
        )

    # Local development only
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }
