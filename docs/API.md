# ACE Events — API Reference

Base URL (local): `http://localhost:8000/api` · Interactive Swagger UI: `/api/docs/` · Schema: `/api/schema/`

* All bodies are JSON. Authenticated calls need the header `Authorization: Bearer <access_token>`.
* Lists are paginated: `{"count": 42, "next": "...", "previous": null, "results": [...]}`. Use `?page=2&page_size=50` (max 200).
* **Error shape** (from `config/exceptions.py`):
  * Validation error → `400` `{"error": "Request failed", "details": {"field": ["message"]}}`
  * Auth/permission → `401` / `403` `{"error": "...", "details": {"detail": "..."}}`
  * Business-rule errors raised by our views → `{"error": "message"}` with `400`, `403`, `404` or `409`.

| Status | Meaning in this project |
|---|---|
| 200 / 201 / 204 | OK / created / deleted |
| 400 | Validation or business rule failed (e.g. deadline passed) |
| 401 | Missing, invalid or expired token |
| 403 | Logged in but wrong role |
| 404 | Not found (also: a student asking for someone else's registration) |
| 409 | Conflict (duplicate registration, full event, duplicate check-in, duplicate volunteer assignment) |

---

## Authentication

### POST `/auth/register/`
Public student sign-up. A role cannot be chosen — always `student`.
```json
{ "first_name": "Asha", "last_name": "R", "email": "asha@example.com", "password": "StrongPass123!",
  "roll_number": "21CS101", "department": "CSE", "year": 3, "phone": "9999999999" }
```
Required: `first_name`, `email`, `password` (min 8, Django password validators apply).
**201** → user object (`id, username, email, full_name, role, roll_number, department, ...`). **400** email exists / weak password.

### POST `/auth/login/`
```json
{ "username": "asha@example.com", "password": "StrongPass123!" }
```
(`username` field accepts the email.) **200** →
```json
{ "access": "<jwt>", "refresh": "<jwt>", "user": { "id": 3, "full_name": "Asha R", "role": "student" } }
```
**401** wrong credentials.

### POST `/auth/refresh/`
`{ "refresh": "<jwt>" }` → **200** `{ "access": "...", "refresh": "..." }` (refresh tokens rotate). **401** invalid/expired.

### GET `/auth/me/` — any logged-in user → current user object.

---

## Events

Fields: `id, title, description, event_type, date, start_time, end_time, venue, registration_deadline, max_participants,
registration_fee, status, created_by, created_at, updated_at` + read-only `registered_count, spots_left, is_registered, created_by_name`.

### GET `/events/`
Auth: any role. Query: `search` (title/venue), `event_type`, `status`, `date`, `date__gte`, `date__lte`, `ordering` (`date`, `-date`, `title`).

### GET `/events/<id>/` — any role. **404** if missing.

### POST `/events/` — **admin only**
```json
{ "title": "ACE Symposium", "description": "...", "event_type": "Symposium", "date": "2026-11-20",
  "start_time": "10:00:00", "end_time": "16:00:00", "venue": "Main Auditorium",
  "registration_deadline": "2026-11-18T18:00:00+05:30", "max_participants": 100,
  "registration_fee": "150.00", "status": "Registration Open" }
```
**201** event. **400**: date in the past; end ≤ start; deadline after event date; fee < 0; max < 1. **403** non-admin.

### PATCH `/events/<id>/` / PUT — **admin only**. **400** also if `max_participants` < current registrations.
### DELETE `/events/<id>/` — **admin only** → **204** (registrations, budget and expenses are deleted with it).

### GET `/events/assigned/` — **volunteer**: events assigned to me.

### GET `/events/<id>/volunteers/` — **admin**: assigned volunteers.
### POST `/events/<id>/volunteers/` — **admin** `{ "volunteer_id": 7 }` → **201**; **409** already assigned; **400** not a volunteer.
### DELETE `/events/<id>/volunteers/<volunteer_id>/` — **admin** → **204** / **404**.

---

## Registration

### POST `/events/<id>/register/` — **student only**
Headers: `Authorization: Bearer <access_token>` · Body: none.

**201**
```json
{ "message": "Registration successful", "registration_id": "ACE-2026-00125",
  "registration": { "id": 125, "registration_id": "ACE-2026-00125", "event_title": "...",
                    "status": "Confirmed", "attendance_status": "Not Checked In",
                    "qr_url": "http://localhost:8000/api/registrations/125/qr/" } }
```
Errors: **400** event status is not "Registration Open" / deadline passed · **409** already registered / event full ·
**403** not a student · **404** event not found.

### GET `/registrations/`
Scope: student → own; volunteer → registrations of assigned events; admin → all.
Query: `event`, `attendance_status` (`Checked In` / `Not Checked In`), `status`, `search` (registration ID, student name or email).

### GET `/registrations/<id>/` — same scoping; **404** if outside scope.
### GET `/registrations/<id>/qr/` — returns `image/png`; add `?download=1` to force a download. Needs the Bearer header
(React fetches it as a blob).
### PATCH `/registrations/<id>/` — **admin** `{ "status": "Cancelled" }` (cancelled registrations free a seat).
### DELETE `/registrations/<id>/` — **admin** → **204**.

---

## Attendance

### POST `/attendance/check-in/` — **volunteer assigned to the event, or admin**
```json
{ "registration_id": "ACE-2026-00125" }
```
**200** `{ "message": "Check-in successful", "registration": { ..., "attendance_status": "Checked In", "check_in_time": "...", "checked_in_by_name": "Karthik Volunteer" } }`
Errors: **400** missing ID or registration cancelled · **403** student, or volunteer not assigned · **404** unknown ID ·
**409** `{ "error": "Already checked in.", "check_in_time": "..." }`.

### GET `/attendance/summary/?event=<id>` — volunteer/admin → `{ "total_participants": 20, "checked_in": 12, "pending": 8 }`

---

## Users (admin only)

### GET `/users/` — query `role` (`student|volunteer|admin`), `search` (name/email), `registration_id` (partial match).
### GET `/volunteers/` — list volunteers. ### POST `/volunteers/`
```json
{ "first_name": "Priya", "email": "priya@example.com", "password": "StrongPass123!", "department": "CSE", "phone": "" }
```
**201** user. **400** duplicate email / weak password.

---

## Budgets & Expenses (admin only)

### POST `/budgets/` `{ "event": 1, "allocated_amount": "10000.00" }` → **201**
Response includes calculated fields:
```json
{ "id": 1, "event": 1, "event_title": "ACE Symposium", "allocated_amount": "10000.00",
  "total_expenses": "9000.00", "remaining_budget": "1000.00", "utilization_percent": "90.00" }
```
**400**: negative amount; second budget for the same event; lowering below money already spent.
Also `GET /budgets/`, `GET/PATCH/DELETE /budgets/<id>/`, `GET /budgets/<id>/breakdown/` (spend per category).

### POST `/expenses/`
```json
{ "event": 1, "category": "Venue", "description": "Auditorium", "amount": "3000.00", "expense_date": "2026-11-01" }
```
Categories: `Venue, Food, Prizes, Certificates, Other`. **400**: amount ≤ 0; event has no budget; total would exceed the allocated budget
(`"Exceeds the event budget. Only ₹1000.00 remaining."`).
Also `GET /expenses/?event=1&category=Food&search=...`, `PATCH`, `DELETE /expenses/<id>/`.

---

## Dashboard

### GET `/dashboard/` — any role; the payload depends on the role.
```json
{ "role": "admin", "stats": { "total_events": 5, "upcoming_events": 3, "total_students": 8, "total_registrations": 16,
  "total_checked_in": 6, "pending_check_ins": 10, "total_budget": "14000.00", "total_expenses": "8800.00",
  "remaining_budget": "5200.00", "registrations_per_event": [{"title": "...", "count": 4}],
  "expenses_by_category": [{"category": "Venue", "total": "3000.00"}] } }
```
Student: `registered_events, upcoming_events, completed_events, attended, not_attended`.
Volunteer: `assigned_events, total_participants, checked_in_participants, pending_check_ins`.
