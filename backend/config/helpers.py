"""Small factory helpers shared by the test files."""
from datetime import timedelta
from decimal import Decimal

from django.utils import timezone

from accounts.models import StudentProfile, User, VolunteerProfile
from events.models import Event, EventVolunteer


def make_user(role="student", email=None, password="StrongPass123!"):
    email = email or f"{role}{User.objects.count()}@test.local"
    user = User.objects.create_user(username=email, email=email, password=password,
                                    first_name=role.title(), role=role)
    if role == "student":
        StudentProfile.objects.create(user=user)
    elif role == "volunteer":
        VolunteerProfile.objects.create(user=user)
    return user


def make_event(admin, **overrides):
    data = dict(title="Test Event", event_type="Workshop", date=timezone.localdate() + timedelta(days=5),
                start_time="10:00", end_time="12:00", venue="Hall A",
                registration_deadline=timezone.now() + timedelta(days=3), max_participants=10,
                registration_fee=Decimal("0"), status="Registration Open", created_by=admin)
    data.update(overrides)
    return Event.objects.create(**data)


def assign(event, volunteer):
    return EventVolunteer.objects.create(event=event, volunteer=volunteer)
