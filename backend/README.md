# ACE Events – Backend (Django REST Framework + PostgreSQL)

See the root `README.md` for the full guide. Quick start:

```bash
python -m venv venv
venv\Scripts\activate              # macOS/Linux: source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env               # set DATABASE_URL (empty = SQLite)
python manage.py migrate
python manage.py seed_data
python manage.py runserver
python manage.py test
```

Swagger UI: http://localhost:8000/api/docs/ · Health check: http://localhost:8000/api/health/
