
# # ============================================================
# # DATABASE CONFIGURATION
# # Local development: SQLite
# # Production (Render): PostgreSQL through DATABASE_URL
# # ============================================================

# """Django settings for ACE Events."""

# import os
# import sys
# # from datetime import timedelta

# from pathlib import Path

# import dj_database_url
# from dotenv import load_dotenv

# BASE_DIR = Path(__file__).resolve().parent.parent
# load_dotenv(BASE_DIR / ".env")

# DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()

# if DATABASE_URL:
#     DATABASES = {
#         "default": dj_database_url.parse(
#             DATABASE_URL,
#             conn_max_age=600,
#             ssl_require=os.environ.get(
#                 "DB_SSL_REQUIRE",
#                 "False"
#             ).lower() == "true",
#         )
#     }

#     # Prevent accidental connection to a local database in production.
#     if DATABASES["default"]["HOST"] in ("127.0.0.1", "localhost"):
#         raise RuntimeError(
#             "Production DATABASE_URL must point to a remote database, "
#             "not localhost."
#         )

# else:
#     if not DEBUG:
#         raise RuntimeError(
#             "DATABASE_URL must be configured for production. "
#             "Create a PostgreSQL database and add its URL in Render."
#         )

#     # Local development only
#     DATABASES = {
#         "default": {
#             "ENGINE": "django.db.backends.sqlite3",
#             "NAME": BASE_DIR / "db.sqlite3",
#         }
#     }

import os
import sys
from datetime import timedelta
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


def env_list(name, default=""):
    return [
        v.strip()
        for v in os.environ.get(name, default).split(",")
        if v.strip()
    ]


# 1. Define DEBUG first
DEBUG = os.environ.get(
    "DJANGO_DEBUG", "False"
).lower() == "true"


# 2. Configure SECRET_KEY
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "")

if not SECRET_KEY:
    if DEBUG:
        SECRET_KEY = "insecure-dev-only-key"
    else:
        raise RuntimeError(
            "DJANGO_SECRET_KEY must be set when DEBUG is False"
        )


# 3. Configure DATABASE after DEBUG
DATABASE_URL = os.environ.get("DATABASE_URL", "").strip()

if DATABASE_URL:
    DATABASES = {
        "default": dj_database_url.parse(
            DATABASE_URL,
            conn_max_age=600,
            ssl_require=os.environ.get(
                "DB_SSL_REQUIRE", "False"
            ).lower() == "true",
        )
    }
else:
    if not DEBUG:
        raise RuntimeError(
            "DATABASE_URL must be configured for production."
        )

    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }


# 4. Allowed hosts
ALLOWED_HOSTS = env_list(
    "DJANGO_ALLOWED_HOSTS",
    "localhost,127.0.0.1"
)
