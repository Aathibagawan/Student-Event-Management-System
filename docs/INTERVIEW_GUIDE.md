# ACE Events — Interview Learning Guide

How to use this: **run the project first**, click through all three roles, then read this guide with the code open
next to it. In an interview you will be asked "where is that in your code?" — know the file name for each answer.
Every answer below points to the real file in this project.

> Be honest in interviews. If you didn't write a part yourself, say "I used this structure and studied it by
> modifying it", then be ready to explain it. Change something small (add a field, add a filter) before the interview —
> it makes the explanations yours.

---

# Part 1 — Concepts used in this project

## 1. Python concepts (with where you see them)

| Concept | Plain explanation | Example in this project |
|---|---|---|
| Functions | Reusable block of code | `make_qr_png(registration_id)` in `registrations/utils.py` |
| Classes / OOP | A class bundles data + behaviour; objects are instances | `class Event(models.Model)`, `class CheckInView(APIView)` |
| Inheritance | A class reuses another class's features | `User(AbstractUser)` gets username/password handling for free; `IsAdminRole(BasePermission)` |
| Properties | A method used like an attribute | `EventBudget.remaining_budget` is calculated each time it is read |
| Exceptions | `try/except` handles errors without crashing | `send_registration_email` catches email failures so a registration never fails because of SMTP |
| Modules / packages | One `.py` file = module; folder with `__init__.py` = package | `from accounts.permissions import IsAdminRole` |
| Virtual environment | Isolated Python packages per project | `python -m venv venv` — so Django versions don't clash between projects |
| `requirements.txt` | List of packages to install | `pip install -r requirements.txt` |
| Decorators | Function that wraps another function | `@action(detail=True, methods=["get"])` on the QR endpoint; `@transaction.atomic` in `seed_data` |
| Dictionaries / lists | Core data structures | `payload = {...}` in tests; list comprehension in `config/settings.py` (`env_list`) |
| f-strings | Insert values in text | `f"ACE-{year}-{self.pk:05d}"` → `ACE-2026-00125` |
| Environment variables | Config outside the code | `os.environ.get("DJANGO_SECRET_KEY")` |

## 2. Django concepts

* **Project vs app.** The *project* (`config/`) holds settings and the root URLs. An *app* is one feature area with its own
  models/views/urls: `accounts`, `events`, `registrations`, `attendance`, `budgets`, `dashboard`. Splitting apps keeps code organised.
* **URL routing.** `config/urls.py` includes each app's `urls.py` under `/api/`. A URL pattern maps a path to a view.
* **Views.** Code that receives a request and returns a response. We use DRF's `APIView`, `ModelViewSet`, generic views.
* **Models.** Python classes that describe tables. `Event`, `Registration`, `Expense`… Each attribute is a column.
* **Migrations.** Files that record model changes as database changes. `makemigrations` creates them, `migrate` applies them.
* **Django ORM.** Lets you query with Python instead of SQL: `Event.objects.filter(status="Upcoming")`.
* **Admin site.** Free web UI for data at `/admin/`; we register models in each `admin.py`.
* **Authentication.** *Who are you?* Here: JWT. **Authorization (permissions).** *What may you do?* Here: role classes in `accounts/permissions.py`.
* **Middleware.** Code that runs on every request. We use `SecurityMiddleware`, `WhiteNoiseMiddleware` (static files),
  `CorsMiddleware` (lets React call the API), `CsrfViewMiddleware`, auth/session middleware.
* **Settings.** `config/settings.py` — installed apps, database, auth model, REST framework config, CORS, email, security flags.
* **Custom user model.** `AUTH_USER_MODEL = "accounts.User"` adds a `role` field. Must be set before the first migration.
* **Management command.** `python manage.py seed_data` — a custom command in `accounts/management/commands/`.
* **Environment variables.** Read via `os.environ` + `python-dotenv` from `.env`. Secrets never go in git.

## 3. Django REST Framework (DRF)

* **API** = a way for programs to talk. **REST** = an API style using URLs for *resources* (`/events/3/`) and HTTP methods for actions.
* **Serializer** = converts model ↔ JSON **and validates input**. `EventSerializer.validate()` rejects past dates.
* **APIView** = you write `get`/`post` yourself (used for register, check-in). **ViewSet** = standard CRUD in one class
  (`EventViewSet`). **Router** = auto-generates URLs for a ViewSet (`router.register("events", EventViewSet)`).
* **Request / Response** = DRF wrappers; `request.data` is the parsed JSON, `Response(data, status=...)` returns JSON.
* **HTTP methods:** GET read, POST create, PUT replace, PATCH partial update, DELETE remove.
* **Status codes:** 200 OK, 201 Created, 204 No Content, 400 bad input, 401 not logged in, 403 not allowed, 404 not found, 409 conflict.
* **Authentication class:** `JWTAuthentication` reads `Authorization: Bearer <token>`.
* **Permission classes:** `IsAdminRole`, `IsStudentRole`, `IsVolunteerRole`, `IsAdminOrReadOnly`.
* **Filtering/search/pagination:** `DjangoFilterBackend`, `SearchFilter`, `OrderingFilter`, `StandardPagination`.

## 4. React concepts

* **Components** — functions returning JSX (`StatCard`, `Modal`, `EventsPage`).
* **Props** — inputs to a component: `<StatCard label="Total Events" value={5} />`.
* **State / `useState`** — data that changes and re-renders the UI: filters, form values, `editing` modal.
* **`useEffect`** — run code after render (e.g. fetch data). Wrapped in `hooks/useFetch.js` so pages stay small.
* **Forms & events** — controlled inputs (`value` + `onChange`), `onSubmit` with `e.preventDefault()`.
* **Conditional rendering** — `{loading && <Loader />}`, `{isAdmin && <button>…}`.
* **Lists** — `.map()` with a `key` prop.
* **React Router** — `<Routes>`, `<Route>`, `NavLink`, `useParams`, `useNavigate`, nested routes with `<Outlet />`.
* **Protected routes** — `routes/ProtectedRoute.jsx` redirects visitors and wrong roles.
* **Context** — `context/AuthContext.jsx` shares the logged-in user with every component without passing props down.
* **API calls** — Axios instance in `services/api.js` with interceptors (add token, refresh on 401).
* **Custom hook** — `useFetch` (name starts with `use`, reuses state logic).

## 5. SQL / MySQL concepts

* **Table, row, column.** **Primary key** uniquely identifies a row. **Foreign key** points to a row in another table.
* **Relationships:** one-to-one (user ↔ profile), one-to-many (event → registrations), many-to-many via a junction table
  (students ↔ events through `Registration`).
* **CRUD:** INSERT, SELECT, UPDATE, DELETE ↔ `create`, `filter/get`, `update/save`, `delete`.
* **JOIN:** combine tables. `select_related("student", "event")` makes Django do a JOIN.
* **Constraints:** `UNIQUE (student, event)`, `NOT NULL`, foreign keys. **Indexes:** speed up lookups on `date`, `status`, `attendance_status`.
* **Transactions:** a group of operations that all succeed or all fail (`transaction.atomic()`), ACID.
* **Normalization:** store each fact once (3NF). Remaining budget is calculated, not stored.
* **SQL vs ORM:** the ORM generates SQL and protects against SQL injection (parameterised queries); raw SQL is for special cases.

### ORM examples from this project

```python
Event.objects.all()                                   # SELECT * FROM events_event
Event.objects.filter(status="Upcoming")               # WHERE status = 'Upcoming'
Registration.objects.filter(event=event)              # WHERE event_id = ...
Registration.objects.select_related("student", "event")      # JOIN -> avoids N+1 queries (FK / one-to-one)
Event.objects.prefetch_related("registrations")       # 2 queries, joined in Python (reverse FK / many-to-many)
Registration.objects.get(registration_id="ACE-2026-00001")   # exactly one row or error
Expense.objects.aggregate(total=Sum("amount"))        # SELECT SUM(amount)
Event.objects.annotate(registered_count=Count("registrations", filter=...))  # per-event COUNT in one query
Registration.objects.create(student=s, event=e)       # INSERT
Registration.objects.filter(pk=1).update(status="Cancelled")  # UPDATE
registration.delete()                                  # DELETE
```
`select_related` is used in `RegistrationViewSet.get_queryset`; aggregation in `budgets/models.py` and `dashboard/views.py`;
`annotate(Count)` in `events/views.py`. (`prefetch_related("registrations")` is the tool you'd use if you listed events with all their
registrations; here counts are cheaper with `annotate`.)

**How the ORM talks to MySQL:** your Python model → the ORM builds a query → the `mysqlclient` driver sends SQL to MySQL →
rows come back → the ORM builds model objects. `DATABASES` in `settings.py` tells Django which database to use.

## 6. Full-stack communication (say it simply)

```text
React  -> HTTP request (POST /api/events/1/register/ + token)
Django REST API -> checks the token and the role
Serializer -> checks the data is valid
Model -> represents the table row
Django ORM -> turns Python into SQL
MySQL -> stores/returns the data
Django -> JSON response (201 + registration_id)
React -> reads the JSON and updates the screen
```
"React never touches the database. It only calls my API. Django checks who the user is, validates the data, uses the ORM to
read or write MySQL, and returns JSON, which React shows."

## 7. Code map (know these files)

| Topic | File |
|---|---|
| Settings, JWT lifetime, CORS, DB | `backend/config/settings.py` |
| Roles & permission classes | `backend/accounts/permissions.py` |
| Register / login / refresh | `backend/accounts/views.py`, `serializers.py` |
| Event validation rules | `backend/events/serializers.py` |
| Registration rules (duplicate, deadline, capacity) | `backend/registrations/views.py` → `EventRegisterView` |
| Registration ID + unique constraint | `backend/registrations/models.py` |
| QR generation + email | `backend/registrations/utils.py` |
| Check-in logic | `backend/attendance/views.py` |
| Budget math + business rules | `backend/budgets/models.py`, `serializers.py` |
| Dashboard numbers | `backend/dashboard/views.py` |
| Token attach + refresh | `frontend/src/services/api.js` |
| Login state | `frontend/src/context/AuthContext.jsx` |
| Route protection | `frontend/src/routes/ProtectedRoute.jsx` |
| QR scanner | `frontend/src/components/QRScanner.jsx` |

---

# Part 2 — Interview questions and answers (45)

Answers are written to be spoken. Shorten them in your own words.

## Technology choices

**1. Why did you choose Django?**
Django comes with the things a project like this needs already built in — ORM, authentication, admin panel, migrations and security defaults like password hashing and CSRF protection. That let me spend my time on the real logic, like registration rules and check-in, instead of wiring basic parts together.

**2. Why React?**
The app has many screens that update often — filters, dashboards, modals, a scanner. React's components and state make that manageable, and I can reuse parts like `StatCard` and `Modal` across pages. It also keeps the frontend completely separate from the backend, so each can be deployed on its own.

**3. Why MySQL?**
The data is clearly relational: students, events, registrations, budgets, expenses, all linked. MySQL gives me foreign keys, unique constraints and transactions, which I use to prevent duplicate registrations. It's also widely used and easy to host.

**4. Why Django REST Framework?**
Plain Django renders HTML pages. DRF is built for JSON APIs: serializers for validation, viewsets and routers for CRUD, permission classes, filtering and pagination. It also plugs into JWT and Swagger docs.

**5. What is Django ORM?**
ORM means Object-Relational Mapper. I write Python like `Event.objects.filter(status="Upcoming")` and Django converts it to SQL, runs it on MySQL, and gives me Python objects back. It's faster to write, easier to read, and it protects against SQL injection because queries are parameterised.

**6. What is a Django model?**
A Python class that describes a database table. Each field is a column. For example my `Registration` model has `student`, `event`, `status`, `attendance_status`, and so on. Django creates the table from it through migrations.

**7. What is a serializer?**
It converts model objects to JSON for the response, and it also takes incoming JSON, validates it, and creates or updates the object. My `EventSerializer` is where I check that the date isn't in the past and the deadline isn't after the event date.

**8. What is a REST API?**
A way for the frontend and backend to communicate over HTTP using URLs for resources and methods for actions. `GET /api/events/` lists events, `POST /api/events/` creates one, `DELETE /api/events/3/` deletes one. It's stateless — each request carries what the server needs, in my case the JWT.

**9. Difference between GET and POST?**
GET reads data and shouldn't change anything on the server; parameters go in the URL. POST sends data in the body to create something or trigger an action, like registering for an event.

**10. Difference between PUT and PATCH?**
PUT replaces the whole resource, so you send all fields. PATCH updates only the fields you send. My React edit form uses PATCH.

## Authentication and security

**11. How does JWT authentication work?**
On login the server checks the email and password and returns two signed tokens: a short-lived access token (30 minutes) and a longer refresh token (7 days). React sends the access token in the `Authorization: Bearer` header on every request. The server verifies the signature and knows who the user is without storing a session. A JWT has three parts — header, payload, signature — and it's signed, not encrypted, so I never put secrets in it.

**12. Where is authorization implemented?**
On the backend, in DRF permission classes in `accounts/permissions.py` — `IsAdminRole`, `IsStudentRole`, `IsVolunteerRole`. They check `request.user.role`, which comes from the database user. React also hides buttons, but that's only for user experience; if someone calls the API directly with a student token, Django still returns 403.

**13. What is the difference between authentication and authorization?**
Authentication is proving who you are — login and the JWT. Authorization is deciding what you're allowed to do — the role permissions. 401 means not authenticated, 403 means authenticated but not allowed.

**14. How are roles implemented?**
One `User` model with a `role` field: admin, student, volunteer. Students and volunteers also have a small profile table with extra details. Public sign-up always creates a student — the role can't be sent in the request — and admins create volunteers through a protected endpoint.

**15. What happens when a JWT expires?**
The API returns 401. My Axios interceptor in `services/api.js` catches it, calls `/api/auth/refresh/` with the refresh token, saves the new tokens and retries the original request, so the user doesn't notice. If the refresh token has also expired, the user is logged out and sent to the login page.

**16. How did you protect admin APIs?**
Every admin view has `permission_classes = [IsAdminRole]` (or `IsAdminOrReadOnly` for events). Queries are also scoped — a student asking for registrations only ever gets their own, and asking for someone else's returns 404.

**17. How are passwords stored?**
Never as plain text. `user.set_password()` hashes them with Django's default hasher (PBKDF2 with salt). Django's password validators also reject weak passwords.

**18. What is CORS and why did you configure it?**
The React app runs on a different origin (for example `localhost:5173`) than the API (`localhost:8000`), and browsers block cross-origin calls unless the server allows it. `django-cors-headers` with `CORS_ALLOWED_ORIGINS` allows only my frontend's URL.

**19. What about CSRF?**
CSRF attacks rely on browsers automatically sending cookies. My API authenticates with a token in a header, which the browser doesn't attach automatically, so the API isn't exposed to that attack. I kept Django's CSRF middleware for the admin site, which uses sessions.

**20. Where do you store tokens in React, and what's the risk?**
In `localStorage`, through a small `tokenStorage` helper. It's simple, but any script running on the page could read it, so XSS is the risk. React escapes output by default, which helps. A stronger option is httpOnly cookies set by the backend — that's on my improvement list.

**21. How do you keep secrets out of the code?**
Everything sensitive — secret key, DB password, email credentials — comes from environment variables loaded from `.env`, which is in `.gitignore`. The repo only has `.env.example` with placeholders. In production, `DEBUG=False` and the app refuses to start without a `DJANGO_SECRET_KEY`.

## Registration, QR and attendance

**22. How is a student registration stored?**
In the `Registration` table: foreign keys to the student and the event, a unique `registration_id` like `ACE-2026-00125`, status, QR image, attendance status, check-in time and who checked them in. That table is the link between students and events.

**23. How did you prevent duplicate registration?**
Two layers. The view checks first and returns 409 if the student is already registered. And the database has a `UniqueConstraint` on `(student, event)`, so even two simultaneous requests can't create two rows.

**24. How did you prevent registration after the deadline?**
In `EventRegisterView` I compare the current time with `event.registration_deadline`; if it has passed I return 400. I also require the event status to be "Registration Open". The check is on the server, so changing the browser or the button doesn't help.

**25. How do you stop the event from going over capacity?**
Inside a database transaction I lock the event row with `select_for_update()`, count the confirmed registrations, and return 409 if it's full. The lock means two students clicking for the last seat can't both succeed.

**26. Why is the registration ID generated the way it is?**
I want a readable ID with the year and a running number. The number comes from the primary key, which exists only after the first save, so `save()` first stores a temporary unique value and then replaces it with `ACE-<year>-<pk>`.

**27. How does QR check-in work?**
When a student registers, the backend generates a QR PNG containing just the registration ID. At the event, the volunteer's page scans it with the camera using `html5-qrcode` and sends `POST /api/attendance/check-in/` with that ID. The server looks up the registration, checks the volunteer is assigned to that event, and marks it "Checked In" with the time and the volunteer's user.

**28. How did you prevent duplicate attendance?**
The check-in view locks the registration row and checks `attendance_status`. If it's already "Checked In" it returns 409 with the original check-in time. The scanner also ignores the same code for 3 seconds because the camera reads many frames per second.

**29. Why does the QR only contain the registration ID?**
So nothing sensitive is in it. The ID alone means nothing without the server, which does all the verification. One honest limit: someone who gets a copy of the QR image could use it, so volunteers see the student's name after scanning and can compare it with an ID card.

**30. How does the student see the QR if images need authentication?**
An `<img>` tag can't send an Authorization header, so React requests the PNG through Axios as a blob and shows it from an object URL. The endpoint is scoped, so a student can only fetch their own QR. The image is generated from the ID on request, so it still works even if stored files are lost after a redeploy.

**31. What happens if the confirmation email fails?**
Nothing visible to the student. The email is sent after the database transaction commits, inside a try/except that logs the error. A mail server problem should never undo a valid registration.

## Database and ORM

**32. How is the database related to Django models?**
Models define the structure; migrations convert model changes to SQL (`CREATE TABLE`, `ALTER TABLE`); `migrate` runs them on MySQL. The `DATABASES` setting says which database to connect to.

**33. What is a ForeignKey?**
A column that points to the primary key of another table, creating a relationship. `Registration.event` points to an `Event`. `on_delete` decides what happens when the parent is deleted — `CASCADE` deletes the registrations with the event, `SET_NULL` keeps the record but clears the link (used for `created_by`).

**34. What is `select_related`?**
It tells Django to JOIN the related table in the same query. In my registrations list I use `select_related("student", "event")`, so showing the student's name and event title doesn't trigger an extra query for every row. That's solving the N+1 problem. It works for ForeignKey and OneToOne.

**35. What is `prefetch_related`?**
It's for reverse foreign keys and many-to-many. Django runs one extra query for the related rows and joins them in Python. For example `Event.objects.prefetch_related("registrations")` would load all events and all their registrations in 2 queries instead of one query per event.

**36. Why use Decimal for money?**
Floating-point numbers can't represent values like 0.1 exactly, so totals drift. `DecimalField` stores exact values, so ₹9,000.00 plus ₹1,000.00 is always exactly ₹10,000.00.

**37. How did you calculate the remaining budget?**
`EventBudget` has the allocated amount. Total expenses is `Sum("amount")` over that event's expenses, remaining is allocated minus total, and utilization is total divided by allocated times 100. They're calculated each time instead of stored, so they can't get out of date. The expense serializer also rejects any expense that would push the total over the budget.

**38. What is a database transaction and where did you use it?**
A group of operations that all succeed or all fail together. I use `transaction.atomic()` in registration and check-in so the capacity check and the insert happen as one unit, together with row locks.

**39. What indexes did you add and why?**
Indexes on columns I filter by often: event date, type and status, user role, attendance status, and a composite index on `(event, attendance_status)` for the checked-in count per event. Indexes make reads faster but slow writes slightly, so I only added them where there's a real query.

**40. What is a migration?**
A file that records a change to the models as a step that can be applied to the database. It keeps the schema in version control and lets everyone's database match the code.

## Frontend and errors

**41. How does React communicate with Django?**
Through Axios calls in the `services` folder. One Axios instance has the base URL and interceptors that add the token and refresh it. Pages call functions like `eventService.register(id)` and update state with the JSON result.

**42. How did you handle API errors?**
On the backend, a custom exception handler gives errors one consistent JSON shape, and my views return the right status codes (400, 403, 404, 409). On the frontend, `getErrorMessage()` turns that JSON into a readable sentence, and pages show it with an `ErrorMessage` component. Pages also have loading and empty states.

**43. How do protected routes work in React?**
`ProtectedRoute` reads the user from `AuthContext`. No user → redirect to login. Wrong role → redirect to the dashboard. It's nested around routes in `AppRoutes.jsx`. Again, it's for experience — the API enforces the real security.

## Scaling and improvements

**44. How would you scale this application?**
Run several Gunicorn workers behind a load balancer (the API is stateless thanks to JWT), add database indexes and pagination (already there), cache read-heavy endpoints like the event list, move slow work like email to a background queue, store files in object storage, and add a MySQL read replica if reads grow. For a college symposium the current design is enough; I'd measure before adding any of these.

**45. What would you improve if given more time?**
Blacklist refresh tokens on logout, move tokens to httpOnly cookies, add student cancellation and a waitlist, integrate online payments for the fee, add pagination controls and CSV export in the UI, run tests in CI, and add end-to-end tests for the registration and check-in flows.

## Bonus questions

**46. Why separate Django apps?**
Each app owns one area — accounts, events, registrations, attendance, budgets, dashboard — so the code is easier to find, test and change. A single huge app turns into a mess quickly.

**47. Why a custom User model?**
I needed a `role` and a unique email. Django recommends setting a custom user model at the start of a project because changing it after the first migration is painful.

**48. What does "stateless" mean and how does it apply here?**
The server doesn't remember anything between requests. Every request carries its own proof of identity (the JWT), so any server instance can handle any request.

**49. What are QuerySets, and are they lazy?**
A QuerySet describes a query. It doesn't hit the database until you iterate it, slice it, or call something like `count()` or `list()`. That lets me chain `.filter()` calls and only run one SQL query at the end.

**50. How would you test the capacity rule?**
`registrations/tests.py` → `test_capacity_reached`: an event with `max_participants=1`, student A registers (201), student B tries and gets 409, and I assert the database still has one registration.

---

# Part 3 — "Explain my project in 2 minutes"

> Adjust the words to what you personally built. Practise it out loud until it sounds like you.

"At my college, symposiums and workshops were managed with Google Forms, WhatsApp groups and paper attendance sheets. That meant duplicate sign-ups, no real seat limits, long queues at the gate, and nobody knowing how much had actually been spent. I wanted to build one system that fixes that.

So I built ACE Events, an event and symposium management platform. There are three kinds of users. Admins create events, assign volunteers and manage budgets. Students register online and get a unique registration ID and a QR code. Volunteers scan that QR at the entrance to mark attendance.

For the technology, the frontend is React with React Router, and the backend is Django with Django REST Framework, using MySQL through the Django ORM. Login uses JWT, so React sends a token with every request and the API checks who the user is and what role they have.

The flow is simple: React calls the REST API, Django validates the request with serializers, the ORM reads or writes MySQL, and Django sends JSON back, which React shows on screen.

The important parts are on the server. When a student registers, I check that the event is open, the deadline hasn't passed, the student isn't already registered and a seat is free — and I do that inside a transaction with a database lock, plus a unique constraint, so two people can't take the last seat. The QR contains only the registration ID, and check-in is rejected the second time. For money I used Decimal fields, and the budget page calculates total spent, remaining amount and utilization automatically.

I designed the models and the API and built the screens for each role. One thing I had to think about was preventing duplicate and simultaneous actions, which is why I added the constraint and the locks. I also wrote tests for registration, check-in and budgets.

If I had more time, I'd add online payment for the fee, a waitlist, and move tokens to secure cookies. Overall it taught me how a real full-stack project fits together, from the database to the screen."

---

# Part 4 — "Explain my project in 30 seconds"

"I developed ACE Events, a full-stack event and symposium management platform using React, Django REST Framework and MySQL. Admins create events and budgets, students register and receive a unique QR code, and volunteers scan the QR to mark attendance. It uses JWT authentication with role-based access, blocks duplicate registrations and over-capacity bookings on the server, and tracks expenses against each event's budget."

---

# Part 5 — Practice checklist before the interview

* [ ] Project runs on your laptop with MySQL (not only SQLite) and `python manage.py test` passes
* [ ] You can log in as all three roles and show register → QR → scan → attendance → dashboard
* [ ] You can open `EventRegisterView` and explain each `if` line
* [ ] You can explain the JWT refresh interceptor in `services/api.js`
* [ ] You made at least one change of your own (new field, new filter, new dashboard card) and committed it
* [ ] You deployed it, and know your frontend URL → API URL → database chain
* [ ] You can say honestly what is *not* implemented (see README → "Not implemented")
