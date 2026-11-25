# SQL Queries & Joins used in ACE Events

Django's ORM writes most queries for me, but I also know the SQL underneath. These run on PostgreSQL
(table names are Django's `app_model` convention).

## 1. The JOIN report (used by `GET /api/dashboard/event-report/`)

```sql
SELECT e.id, e.title, e.date, e.max_participants,
       COALESCE(SUM(CASE WHEN r.status = 'Confirmed' THEN 1 ELSE 0 END), 0) AS registered,
       COALESCE(SUM(CASE WHEN r.status = 'Confirmed' AND r.attendance_status = 'Checked In' THEN 1 ELSE 0 END), 0) AS attended,
       COALESCE(b.allocated_amount, 0) AS budget,
       COALESCE((SELECT SUM(x.amount) FROM budgets_expense x WHERE x.event_id = e.id), 0) AS spent
FROM events_event e
LEFT JOIN registrations_registration r ON r.event_id = e.id
LEFT JOIN budgets_eventbudget b ON b.event_id = e.id
GROUP BY e.id, e.title, e.date, e.max_participants, b.allocated_amount
ORDER BY e.date DESC
LIMIT 20;
```

* **LEFT JOIN** keeps events that have *no* registrations (an INNER JOIN would hide them).
* **GROUP BY** collapses the many registration rows of one event into one result row.
* **CASE WHEN** inside `SUM` = "count only the rows that match".
* The subquery adds up expenses separately - joining expenses in the same query would multiply the registration rows.
* In Python the query is **parameterised** (`%s` placeholders), so user input can never become SQL (SQL-injection safe).

## 2. Common joins

```sql
-- Which students registered for which event (INNER JOIN x2)
SELECT u.first_name, u.email, e.title, r.registration_id
FROM registrations_registration r
JOIN accounts_user u ON u.id = r.student_id
JOIN events_event  e ON e.id = r.event_id
WHERE r.status = 'Confirmed';

-- Events with ZERO registrations (LEFT JOIN + IS NULL)
SELECT e.title
FROM events_event e
LEFT JOIN registrations_registration r ON r.event_id = e.id
WHERE r.id IS NULL;

-- Many-to-many: volunteers assigned to each event (through table)
SELECT e.title, u.first_name AS volunteer
FROM events_eventvolunteer ev
JOIN events_event  e ON e.id = ev.event_id
JOIN accounts_user u ON u.id = ev.volunteer_id;

-- Events with more than 3 registrations (HAVING filters AFTER grouping)
SELECT e.title, COUNT(r.id) AS total
FROM events_event e JOIN registrations_registration r ON r.event_id = e.id
GROUP BY e.title
HAVING COUNT(r.id) > 3;

-- Budget left per event
SELECT e.title, b.allocated_amount - COALESCE(SUM(x.amount), 0) AS remaining
FROM budgets_eventbudget b
JOIN events_event e ON e.id = b.event_id
LEFT JOIN budgets_expense x ON x.event_id = e.id
GROUP BY e.title, b.allocated_amount;
```

## 3. The same thing with the Django ORM

```python
# registrations per event (one SQL query with COUNT + GROUP BY)
Event.objects.annotate(count=Count("registrations", filter=Q(registrations__status="Confirmed")))

# select_related = SQL JOIN (avoids one query per row);  prefetch_related = a second query for many-to-many
Registration.objects.select_related("student", "event")

# events a volunteer is assigned to (many-to-many)
Event.objects.filter(volunteers=request.user)
```

Run `EXPLAIN ANALYZE <query>;` in `psql` to see how PostgreSQL executes a query, and check that indexes are used.
