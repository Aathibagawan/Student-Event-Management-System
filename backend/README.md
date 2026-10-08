# ACE Events - Backend (Django REST Framework)

See the root `README.md` for full setup. Quick start:

```bash
python -m venv venv
venv\Scripts\activate          # Windows   (macOS/Linux: source venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env         # macOS/Linux: cp .env.example .env   then edit values
python manage.py makemigrations accounts events registrations budgets
python manage.py migrate
python manage.py seed_data
python manage.py runserver
```

Swagger UI: http://localhost:8000/api/docs/
