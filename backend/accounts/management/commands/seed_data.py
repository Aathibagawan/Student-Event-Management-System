"""python manage.py seed_data  - creates demo data for LOCAL DEVELOPMENT ONLY."""
import random
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils import timezone

from accounts.models import StudentProfile, User, VolunteerProfile
from budgets.models import EventBudget, Expense
from events.models import Event, EventVolunteer
from registrations.models import Registration
from registrations.utils import attach_qr_code

DEMO_PASSWORD = "Demo@12345"  # local demo only - never reuse for real accounts


class Command(BaseCommand):
    help = "Create demo admin, students, volunteers, events, registrations and expenses."

    @transaction.atomic
    def handle(self, *args, **options):
        random.seed(7)
        admin, _ = User.objects.get_or_create(
            username="admin@ace.local",
            defaults={"email": "admin@ace.local", "first_name": "ACE", "last_name": "Admin",
                      "role": "admin", "is_staff": True, "is_superuser": True})
        admin.set_password(DEMO_PASSWORD)
        admin.save()

        volunteers = []
        for i, name in enumerate(["Karthik", "Priya"], start=1):
            user, _ = User.objects.get_or_create(
                username=f"volunteer{i}@ace.local",
                defaults={"email": f"volunteer{i}@ace.local", "first_name": name,
                          "last_name": "Volunteer", "role": "volunteer"})
            user.set_password(DEMO_PASSWORD)
            user.save()
            VolunteerProfile.objects.get_or_create(user=user, defaults={"department": "CSE"})
            volunteers.append(user)

        students = []
        names = ["Arun", "Divya", "Hari", "Meena", "Nithya", "Rahul", "Sneha", "Vikram"]
        for i, name in enumerate(names, start=1):
            user, _ = User.objects.get_or_create(
                username=f"student{i}@ace.local",
                defaults={"email": f"student{i}@ace.local", "first_name": name,
                          "last_name": "Kumar", "role": "student"})
            user.set_password(DEMO_PASSWORD)
            user.save()
            StudentProfile.objects.get_or_create(
                user=user, defaults={"roll_number": f"21CS{100 + i}", "department": "CSE", "year": 3})
            students.append(user)

        now = timezone.now()
        today = timezone.localdate()
        specs = [
            ("ACE Tech Symposium 2026", "Symposium", 14, "Registration Open", 100, "150.00"),
            ("Django Workshop", "Workshop", 7, "Registration Open", 30, "0.00"),
            ("Code Sprint Hackathon", "Hackathon", 21, "Upcoming", 60, "100.00"),
            ("AI Seminar", "Seminar", 10, "Registration Open", 2, "0.00"),
            ("Cultural Night", "Cultural Event", -10, "Completed", 200, "50.00"),
        ]
        events = []
        for title, etype, offset, status, cap, fee in specs:
            event_date = today + timedelta(days=offset)
            deadline = now + timedelta(days=max(offset - 1, 0)) if offset > 0 else now - timedelta(days=12)
            event, _ = Event.objects.get_or_create(
                title=title,
                defaults=dict(description=f"{title} organised by the ACE association.",
                              event_type=etype, date=event_date, start_time="10:00", end_time="16:00",
                              venue="Main Auditorium", registration_deadline=deadline,
                              max_participants=cap, registration_fee=Decimal(fee),
                              status=status, created_by=admin))
            events.append(event)
            for v in volunteers:
                EventVolunteer.objects.get_or_create(event=event, volunteer=v)

        for event in events[:2] + events[3:]:
            for student in random.sample(students, 4):
                if event.registrations.count() >= event.max_participants:
                    break
                reg, created = Registration.objects.get_or_create(student=student, event=event)
                if created:
                    attach_qr_code(reg)
                    if event.status == "Completed" or random.random() < 0.3:
                        reg.attendance_status = "Checked In"
                        reg.check_in_time = now
                        reg.checked_in_by = volunteers[0]
                        reg.save()

        for event, allocated in [(events[0], "10000"), (events[1], "4000")]:
            EventBudget.objects.get_or_create(event=event, defaults={"allocated_amount": Decimal(allocated)})
        if not Expense.objects.exists():
            for event, cat, desc, amt in [
                (events[0], "Venue", "Auditorium booking", "3000"),
                (events[0], "Food", "Lunch for participants", "2500"),
                (events[0], "Prizes", "Winner trophies", "2000"),
                (events[0], "Certificates", "Printing", "500"),
                (events[1], "Other", "Stationery", "800"),
            ]:
                Expense.objects.create(event=event, category=cat, description=desc,
                                       amount=Decimal(amt), expense_date=today, added_by=admin)

        self.stdout.write(self.style.SUCCESS(
            f"Seed complete. Demo logins use password '{DEMO_PASSWORD}': "
            "admin@ace.local, volunteer1@ace.local, student1@ace.local"))
