# ACE Events — Database Design

Django models are the source of truth; `makemigrations`/`migrate` turn them into MySQL tables.

```text
accounts_user (id, username, email UNIQUE, password(hash), first_name, last_name, role, ...)
   |1 ------ 0..1  accounts_studentprofile   (user_id UNIQUE FK)
   |1 ------ 0..1  accounts_volunteerprofile (user_id UNIQUE FK)
   |1 ------ *     events_event.created_by_id            (admin who created it)
   |1 ------ *     registrations_registration.student_id (student)
   |1 ------ *     registrations_registration.checked_in_by_id (volunteer/admin)
   |1 ------ *     events_eventvolunteer.volunteer_id
   |1 ------ *     budgets_expense.added_by_id

events_event (id, title, event_type, date, start_time, end_time, venue, registration_deadline,
              max_participants, registration_fee DECIMAL, status, created_by_id, created_at, updated_at)
   |1 ------ *     registrations_registration.event_id
   |1 ------ *     events_eventvolunteer.event_id
   |1 ------ 0..1  budgets_eventbudget.event_id (UNIQUE)
   |1 ------ *     budgets_expense.event_id

registrations_registration (id, registration_id UNIQUE, student_id, event_id, registered_at, status,
              qr_code, attendance_status, check_in_time, checked_in_by_id)
   UNIQUE (student_id, event_id)   INDEX (event_id, attendance_status)

events_eventvolunteer (id, event_id, volunteer_id, assigned_at)   UNIQUE (event_id, volunteer_id)
budgets_eventbudget   (id, event_id UNIQUE, allocated_amount DECIMAL(10,2), created_at)
budgets_expense       (id, event_id, category, description, amount DECIMAL(10,2), expense_date, added_by_id)
```

## Why each relationship exists

| Relationship | Type | Reason |
|---|---|---|
| User ↔ StudentProfile / VolunteerProfile | One-to-one | Keeps login data in one table, role-specific details in separate small tables. One user has at most one profile. |
| Event → created_by (User) | Many-to-one (`SET_NULL`) | Many events per admin; deleting an admin must not delete the events. |
| Registration → student, event | Many-to-one ×2 | A student registers for many events, an event has many students. Registration is the **junction table** of that many-to-many, and it carries extra data (status, QR, attendance). |
| `UNIQUE(student, event)` | Constraint | The database itself refuses duplicate registrations, even if two requests race. |
| Registration → checked_in_by | Many-to-one (`SET_NULL`) | Audit trail: who scanned this student. Keep the attendance record if the volunteer account is removed. |
| EventVolunteer | Junction (event ↔ volunteer) | Many volunteers per event and many events per volunteer; `UNIQUE(event, volunteer)` prevents assigning twice. |
| EventBudget → event | One-to-one | Exactly one budget per event. |
| Expense → event | Many-to-one | Many expenses per event; totals are computed with `Sum("amount")` instead of being stored (no stale data). |

## Constraints, indexes, money

* **Primary keys:** auto `BigAutoField` on every table.
* **Unique:** `user.email`, `registration.registration_id`, `(student,event)`, `(event,volunteer)`, `budget.event`.
* **Indexes:** `user.role`, `event.date`, `event.event_type`, `event.status`, `registration.attendance_status`, composite
  `(event, attendance_status)` for the "checked-in count per event" queries. Foreign keys are indexed automatically by Django.
* **Money:** `DecimalField` (exact base-10 arithmetic). `float` would give results like `0.1 + 0.2 = 0.30000000000000004`.
* **Normalization (3NF):** nothing is duplicated — event details live only in `event`, student details only in the user/profile tables,
  and derived numbers (remaining budget, seats left) are calculated, not stored.
* **Transactions:** registration and check-in run inside `transaction.atomic()` with `select_for_update()` so the last seat
  cannot be sold twice and a QR cannot be checked in twice at the same moment (row locks; no-op on SQLite).
