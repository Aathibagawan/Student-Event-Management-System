<!-- # ACE Events - Backend (Django REST Framework)

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

Swagger UI: http://localhost:8000/api/docs/ -->
# ACE Events — Event & Symposium Management System

A full-stack web application designed to simplify the management of college events, symposiums, workshops, student registrations, volunteer activities, attendance, budgets, and expenses.

The system provides separate role-based experiences for **Administrators, Students, and Volunteers**, with a React frontend communicating with a Django REST Framework backend through REST APIs.

---

## 🚀 Live Demo

### Frontend
👉 https://student-event-management-system-a8jre3s3u-cojective.vercel.app

### Backend API
👉 https://student-event-management-system-1.onrender.com

### API Documentation
👉 https://student-event-management-system-1.onrender.com/api/docs/

### GitHub Repository
👉 https://github.com/Aathibagawan/Student-Event-Management-System

---

## 📌 Project Overview

Managing college symposiums and technical events manually can involve spreadsheets, registration forms, WhatsApp groups, paper attendance sheets, and separate expense records.

This project provides a centralized platform where:

- Administrators can create and manage events.
- Students can register for events online.
- Each registration receives a unique registration ID.
- QR codes are generated for registrations.
- Volunteers can verify registrations using QR scanning.
- Attendance can be recorded during event entry.
- Event budgets and expenses can be tracked.
- Role-based dashboards provide relevant information to each user.
- REST APIs connect the React frontend with the Django backend.

The goal is to provide a practical full-stack solution that can be adapted for college symposiums, workshops, technical events, and other institutional programs.

---

# ✨ Key Features

## 🔐 Authentication & Authorization

- User registration and login
- JWT-based authentication
- Access and refresh tokens
- Role-based authorization
- Protected frontend routes
- Server-side permission validation
- Separate Admin, Student, and Volunteer workflows

### Supported Roles

| Role | Responsibilities |
|---|---|
| Admin | Manage events, volunteers, registrations, budgets and dashboards |
| Student | View events and register for events |
| Volunteer | View assigned events and manage QR-based attendance |

---

## 📅 Event Management

Administrators can:

- Create events
- View events
- Update events
- Delete events
- Search events
- Filter events
- Manage event status
- Set registration deadlines
- Set event capacity
- Assign volunteers

Events can contain information such as:

- Event title
- Description
- Event type
- Date
- Venue
- Registration deadline
- Maximum participants
- Registration fee
- Event status

---

## 📝 Student Registration

Students can register for available events.

The backend validates:

- Duplicate registrations
- Registration deadline
- Event capacity
- Event status
- User role
- Registration availability

Each successful registration receives a unique registration ID such as:

```text
ACE-2026-00001