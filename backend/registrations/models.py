import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone


class Registration(models.Model):
    class Status(models.TextChoices):
        CONFIRMED = "Confirmed", "Confirmed"
        CANCELLED = "Cancelled", "Cancelled"

    class Attendance(models.TextChoices):
        NOT_CHECKED_IN = "Not Checked In", "Not Checked In"
        CHECKED_IN = "Checked In", "Checked In"

    registration_id = models.CharField(max_length=40, unique=True, editable=False)
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                                related_name="registrations")
    event = models.ForeignKey("events.Event", on_delete=models.CASCADE, related_name="registrations")
    registered_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=15, choices=Status.choices, default=Status.CONFIRMED)
    qr_code = models.ImageField(upload_to="qr_codes/", blank=True)
    attendance_status = models.CharField(max_length=20, choices=Attendance.choices,
                                         default=Attendance.NOT_CHECKED_IN, db_index=True)
    check_in_time = models.DateTimeField(null=True, blank=True)
    checked_in_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                      null=True, blank=True, related_name="check_ins_done")

    class Meta:
        ordering = ["-registered_at"]
        constraints = [
            # The database itself refuses a duplicate (student, event) pair.
            models.UniqueConstraint(fields=["student", "event"], name="unique_student_event"),
        ]
        indexes = [models.Index(fields=["event", "attendance_status"])]

    def __str__(self):
        return self.registration_id

    def save(self, *args, **kwargs):
        # The readable ID (ACE-2026-00125) needs the primary key, so: save once with a
        # temporary unique value, then replace it with the final ID.
        if not self.registration_id:
            self.registration_id = f"TMP-{uuid.uuid4().hex}"
        super().save(*args, **kwargs)
        if self.registration_id.startswith("TMP-"):
            self.registration_id = f"ACE-{timezone.now().year}-{self.pk:05d}"
            super().save(update_fields=["registration_id"])
