# ACE Event & Symposium Management System

A full-stack web application for managing college events, symposiums, student registrations, volunteers, attendance, budgets, and expenses.

The system is built using **React.js**, **Django REST Framework**, **Python**, and **MySQL**, with JWT-based authentication and role-based access control.

---

## 🚀 Live Demo

### Frontend
https://student-event-management-system-a8jre3s3u-cojective.vercel.app

### Backend API
https://student-event-management-system-1.onrender.com

### API Documentation
https://student-event-management-system-1.onrender.com/api/docs/

### GitHub
https://github.com/Aathibagawan/Student-Event-Management-System

---
## Demo Credentials

### Admin

Email:
admin@ace.local

Password:
Demo@12345

### Volunteer

Email:
volunteer1@ace.local

Password:
Demo@12345

### Student

Email:
student1@ace.local

Password:
Demo@12345

---

# 🏗️ System Architecture

The application follows a client-server architecture.

```text
                         ┌─────────────────────┐
                         │       USERS         │
                         │ Admin / Student /   │
                         │ Volunteer           │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   React Frontend    │
                         │       + Vite        │
                         │      Vercel         │
                         └──────────┬──────────┘
                                    │
                              HTTPS / REST API
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │   Django REST API   │
                         │ Django + DRF        │
                         │ JWT Authentication  │
                         │ Role Permissions    │
                         │ Business Logic      │
                         └──────────┬──────────┘
                                    │
                              Django ORM
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │       MySQL         │
                         │      Database       │
                         └─────────────────────┘
```

---

# 🔄 Application Architecture

```text
React UI
   │
   ▼
React Components
   │
   ▼
React Router
   │
   ▼
Axios API Service
   │
   │ HTTP Request
   ▼
Django REST Framework
   │
   ├── Authentication
   ├── Permissions
   ├── Serializers
   ├── Views / ViewSets
   ├── Business Logic
   └── Validation
   │
   ▼
Django ORM
   │
   ▼
MySQL Database
```

---

# 👥 User Roles

```text
                    ┌───────────────┐
                    │     USER      │
                    └───────┬───────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ▼             ▼             ▼
          ┌───────┐     ┌─────────┐   ┌───────────┐
          │ Admin │     │ Student │   │ Volunteer │
          └───┬───┘     └────┬────┘   └─────┬─────┘
              │              │              │
              ▼              ▼              ▼
        Manage Events    Register       Attendance
        Manage Users     View Events    QR Scanner
        Manage Budget    View QR        Assigned Events
        View Reports
```

---

# 🔐 Authentication Architecture

The project uses JWT authentication.

```text
User
 │
 ▼
Login Page
 │
 ▼
POST /api/auth/login/
 │
 ▼
Django Authentication
 │
 ▼
Access Token + Refresh Token
 │
 ▼
React Application
 │
 ▼
Axios
 │
 │ Authorization: Bearer <access_token>
 ▼
Protected API
```

When the access token expires:

```text
API Request
     │
     ▼
401 Unauthorized
     │
     ▼
Refresh Token
     │
     ▼
POST /api/auth/refresh/
     │
     ▼
New Access Token
     │
     ▼
Retry Original Request
```

---

# 📅 Event Management Flow

```text
Admin
 │
 ▼
Create Event
 │
 ▼
Django REST API
 │
 ▼
Validate Event Data
 │
 ▼
Save Event
 │
 ▼
MySQL
 │
 ▼
Event Available
 │
 ▼
Students View Event
```

---

# 📝 Student Registration Flow

```text
Student
   │
   ▼
View Events
   │
   ▼
Select Event
   │
   ▼
Register
   │
   ▼
POST /api/events/<id>/register/
   │
   ▼
Backend Validation
   │
   ├── Authentication
   ├── Student Role
   ├── Registration Deadline
   ├── Event Capacity
   └── Duplicate Registration
   │
   ▼
Create Registration
   │
   ▼
Generate Registration ID
   │
   ▼
Generate QR Code
   │
   ▼
Return Response
```

---

# 📱 QR Code & Attendance Flow

```text
Student Registration
        │
        ▼
Generate QR Code
        │
        ▼
Student receives QR
        │
        ▼
Event Day
        │
        ▼
Volunteer scans QR
        │
        ▼
Validate Registration
        │
        ▼
Check Duplicate Attendance
        │
        ▼
Record Check-in
        │
        ▼
Attendance Saved
```

---

# 💰 Budget Management Flow

```text
Event
 │
 ▼
Create Event Budget
 │
 ▼
Add Expenses
 │
 ▼
Validate Expense
 │
 ├── Available Budget?
 └── Valid Amount?
 │
 ▼
Save Expense
 │
 ▼
Calculate
 │
 ├── Total Budget
 ├── Total Expenses
 └── Remaining Budget
```

---

# 🧩 Backend Architecture

```text
backend/
│
├── config/
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   ├── asgi.py
│   ├── pagination.py
│   └── exceptions.py
│
├── accounts/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   └── tests.py
│
├── events/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   └── tests.py
│
├── registrations/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   ├── urls.py
│   ├── utils.py
│   └── tests.py
│
├── attendance/
│   ├── models.py
│   ├── views.py
│   └── tests.py
│
├── budgets/
│   ├── models.py
│   ├── serializers.py
│   ├── views.py
│   └── tests.py
│
├── dashboard/
├── manage.py
└── requirements.txt
```

---

# ⚛️ Frontend Architecture

```text
frontend/
│
├── src/
│   ├── components/
│   ├── pages/
│   ├── layouts/
│   ├── services/
│   ├── context/
│   ├── hooks/
│   ├── routes/
│   ├── utils/
│   └── test/
│
├── package.json
├── package-lock.json
└── vite.config.js
```

---

# 🗄️ Database Architecture

The application uses MySQL through Django ORM.

```text
                    USER
                     │
                     ▼
                   EVENT
                     │
             ┌───────┴────────┐
             │                │
             ▼                ▼
       REGISTRATION        VOLUNTEER
             │
             ▼
        ATTENDANCE

                   EVENT
                     │
                     ▼
                  BUDGET
                     │
                     ▼
                  EXPENSE
```

---

# 🌐 REST API Architecture

```text
React
  │
  │ Axios
  ▼
Django REST Framework
  │
  ├── /api/auth/
  ├── /api/events/
  ├── /api/registrations/
  ├── /api/attendance/
  ├── /api/budgets/
  └── /api/dashboard/
```

## API Examples

### Authentication
```text
POST /api/auth/login/
POST /api/auth/register/
POST /api/auth/refresh/
GET  /api/auth/me/
```

### Events
```text
GET    /api/events/
GET    /api/events/<id>/
POST   /api/events/
PATCH  /api/events/<id>/
DELETE /api/events/<id>/
```

### Registration
```text
POST /api/events/<id>/register/
GET  /api/registrations/
GET  /api/registrations/<id>/
GET  /api/registrations/<id>/qr/
```

### Attendance
```text
POST /api/attendance/check-in/
GET  /api/attendance/summary/
```

---

# 🛠️ Technology Stack

## Frontend
- React.js
- Vite
- JavaScript
- React Router
- Axios
- HTML5
- CSS
- html5-qrcode

## Backend
- Python
- Django
- Django REST Framework
- Django Filters
- Simple JWT
- drf-spectacular
- Gunicorn
- WhiteNoise

## Database
- MySQL
- Django ORM

## Development & Deployment
- Git
- GitHub
- Vercel
- Render

---

# 📁 Complete Project Structure

```text
Student-Event-Management-System/
│
├── backend/
│   ├── config/
│   ├── accounts/
│   ├── events/
│   ├── registrations/
│   ├── attendance/
│   ├── budgets/
│   ├── dashboard/
│   ├── manage.py
│   ├── requirements.txt
│   └── .env.example
│
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── package-lock.json
│   └── vite.config.js
│
├── docs/
├── README.md
├── .gitignore
└── LICENSE
```

---

# 💻 Local Setup

## Clone Repository

```bash
git clone https://github.com/Aathibagawan/Student-Event-Management-System.git
cd Student-Event-Management-System
```

## Backend

```bash
cd backend
python -m venv venv
```

Windows:

```powershell
.env\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run migrations:

```bash
python manage.py makemigrations
python manage.py migrate
```

Start Django:

```bash
python manage.py runserver
```

Backend:

```text
http://127.0.0.1:8000/
```

## Frontend

Open another terminal:

```bash
cd frontend
npm install
```

Create `.env`:

```env
VITE_API_URL=http://localhost:8000/api
```

Start React:

```bash
npm run dev
```

Frontend:

```text
http://localhost:5173/
```

---

# ☁️ Deployment Architecture

```text
                         INTERNET
                            │
                            ▼
              ┌─────────────────────────┐
              │        VERCEL           │
              │    React + Vite         │
              │      Frontend           │
              └────────────┬────────────┘
                           │
                           │ HTTPS / REST API
                           ▼
              ┌─────────────────────────┐
              │        RENDER           │
              │ Django REST Framework   │
              │ Gunicorn Backend API    │
              └────────────┬────────────┘
                           │
                           │ Django ORM
                           ▼
              ┌─────────────────────────┐
              │         MySQL           │
              │        Database         │
              └─────────────────────────┘
```

---

# 🧪 Testing

## Backend

```bash
cd backend
python manage.py test
```

## Frontend

```bash
cd frontend
npm test
```

Testing covers important functionality such as:

- Authentication
- Permissions
- Event management
- Registration
- Attendance
- Budget validation

---

# 🔒 Security

The application implements:

- JWT authentication
- Role-based authorization
- Protected API endpoints
- Django password hashing
- Environment variables
- CORS configuration
- CSRF trusted origins
- Backend-side validation
- Database constraints

Sensitive information such as database passwords and Django secret keys are stored in environment variables and are not committed to GitHub.

---

# 📚 Concepts Demonstrated

### Frontend
- React components
- Props
- State
- Context API
- React Router
- Forms
- API integration
- Axios
- Protected routes
- Conditional rendering

### Backend
- Python
- Django
- Django REST Framework
- Models
- Serializers
- Views
- URL routing
- JWT authentication
- Permissions
- Django ORM
- Database migrations
- Business logic
- API validation

### Database
- MySQL
- Relational database design
- Primary keys
- Foreign keys
- Database relationships
- ORM queries

### Deployment
- Git
- GitHub
- Vercel
- Render
- Production environment variables
- REST API deployment
- CORS configuration

---

# 🎯 Project Objective

The project demonstrates an end-to-end full-stack development lifecycle:

```text
Requirement
     ↓
Database Design
     ↓
Backend Development
     ↓
REST API Development
     ↓
Authentication & Authorization
     ↓
React Frontend
     ↓
Frontend-Backend Integration
     ↓
Testing
     ↓
Git & GitHub
     ↓
Deployment
     ↓
Live Application
```

---

# 👨‍💻 Developer

**Aathibagawan M**

B.E. Computer Science and Engineering

GitHub:
https://github.com/Aathibagawan

Project:
https://github.com/Aathibagawan/Student-Event-Management-System

---

# 📄 License

This project is licensed under the MIT License.
