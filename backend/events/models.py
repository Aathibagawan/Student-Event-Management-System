from django.conf import settings
from django.db import models
from django.utils import timezone


class Event(models.Model):
    class EventType(models.TextChoices):
        SYMPOSIUM = "Symposium", "Symposium"
        WORKSHOP = "Workshop", "Workshop"
        HACKATHON = "Hackathon", "Hackathon"
        TECHNICAL = "Technical Event", "Technical Event"
        NON_TECHNICAL = "Non-Technical Event", "Non-Technical Event"
        SEMINAR = "Seminar", "Seminar"
        CULTURAL = "Cultural Event", "Cultural Event"

    class Status(models.TextChoices):
        UPCOMING = "Upcoming", "Upcoming"
        REGISTRATION_OPEN = "Registration Open", "Registration Open"
        REGISTRATION_CLOSED = "Registration Closed", "Registration Closed"
        COMPLETED = "Completed", "Completed"
        CANCELLED = "Cancelled", "Cancelled"

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    event_type = models.CharField(max_length=30, choices=EventType.choices, db_index=True)
    date = models.DateField(db_index=True)
    start_time = models.TimeField()
    end_time = models.TimeField()
    venue = models.CharField(max_length=200)
    registration_deadline = models.DateTimeField()
    max_participants = models.PositiveIntegerField()
    registration_fee = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    status = models.CharField(max_length=30, choices=Status.choices,
                              default=Status.UPCOMING, db_index=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                   null=True, related_name="created_events")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["date", "start_time"]

    def __str__(self):
        return self.title

    @property
    def is_deadline_passed(self):
        return timezone.now() > self.registration_deadline


class EventVolunteer(models.Model):
    """Assigns a volunteer to an event (many-to-many with extra data)."""

    event = models.ForeignKey(Event, on_delete=models.CASCADE, related_name="volunteer_assignments")
    volunteer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                  related_name="event_assignments")
    assigned_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["event", "volunteer"], name="unique_event_volunteer")]

    def __str__(self):
        return f"{self.volunteer} -> {self.event}"
