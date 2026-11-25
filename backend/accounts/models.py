from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """One user table for everyone. The `role` field decides what they may do."""

    class Role(models.TextChoices):
        ADMIN = "admin", "Admin"
        STUDENT = "student", "Student"
        VOLUNTEER = "volunteer", "Volunteer"

    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=Role.choices, default=Role.STUDENT, db_index=True)

    def save(self, *args, **kwargs):
        # Superusers created with `createsuperuser` should behave as admins.
        if self.is_superuser:
            self.role = self.Role.ADMIN
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.role})"


class StudentProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="student_profile")
    roll_number = models.CharField(max_length=30, blank=True)
    department = models.CharField(max_length=100, blank=True)
    year = models.PositiveSmallIntegerField(null=True, blank=True)
    phone = models.CharField(max_length=15, blank=True)

    def __str__(self):
        return f"Student: {self.user.username}"


class VolunteerProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="volunteer_profile")
    department = models.CharField(max_length=100, blank=True)
    phone = models.CharField(max_length=15, blank=True)

    def __str__(self):
        return f"Volunteer: {self.user.username}"
