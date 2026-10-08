from django.urls import reverse
from rest_framework import serializers

from .models import Registration


class RegistrationSerializer(serializers.ModelSerializer):
    student_name = serializers.SerializerMethodField()
    student_email = serializers.EmailField(source="student.email", read_only=True)
    event_title = serializers.CharField(source="event.title", read_only=True)
    event_date = serializers.DateField(source="event.date", read_only=True)
    event_venue = serializers.CharField(source="event.venue", read_only=True)
    checked_in_by_name = serializers.SerializerMethodField()
    qr_url = serializers.SerializerMethodField()

    class Meta:
        model = Registration
        fields = ["id", "registration_id", "student", "student_name", "student_email", "event",
                  "event_title", "event_date", "event_venue", "registered_at", "status",
                  "attendance_status", "check_in_time", "checked_in_by", "checked_in_by_name",
                  "qr_url"]
        read_only_fields = fields

    def get_student_name(self, obj):
        return obj.student.get_full_name() or obj.student.username

    def get_checked_in_by_name(self, obj):
        return (obj.checked_in_by.get_full_name() or obj.checked_in_by.username) if obj.checked_in_by else None

    def get_qr_url(self, obj):
        request = self.context.get("request")
        path = reverse("registration-qr", args=[obj.pk])
        return request.build_absolute_uri(path) if request else path


class RegistrationStatusSerializer(serializers.ModelSerializer):
    """Admin may only change the status (e.g. cancel a registration)."""

    class Meta:
        model = Registration
        fields = ["status"]
