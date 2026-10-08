from django.utils import timezone
from rest_framework import serializers

from accounts.serializers import UserSerializer

from .models import Event, EventVolunteer


class EventSerializer(serializers.ModelSerializer):
    registered_count = serializers.IntegerField(read_only=True)
    spots_left = serializers.SerializerMethodField()
    is_registered = serializers.SerializerMethodField()
    created_by_name = serializers.CharField(source="created_by.get_full_name", read_only=True)

    class Meta:
        model = Event
        fields = ["id", "title", "description", "event_type", "date", "start_time", "end_time",
                  "venue", "registration_deadline", "max_participants", "registration_fee",
                  "status", "created_by", "created_by_name", "created_at", "updated_at",
                  "registered_count", "spots_left", "is_registered"]
        read_only_fields = ["created_by", "created_at", "updated_at"]

    def get_spots_left(self, obj):
        return max(obj.max_participants - getattr(obj, "registered_count", 0), 0)

    def get_is_registered(self, obj):
        request = self.context.get("request")
        if not request or not request.user.is_authenticated or request.user.role != "student":
            return False
        # `my_regs` is pre-fetched in the view, so this does not cause one query per event.
        return obj.pk in self.context.get("my_event_ids", set())

    # ---- validation (backend is the source of truth) ----
    def validate_registration_fee(self, value):
        if value < 0:
            raise serializers.ValidationError("Fee cannot be negative.")
        return value

    def validate_max_participants(self, value):
        if value < 1:
            raise serializers.ValidationError("Maximum participants must be at least 1.")
        return value

    def validate(self, attrs):
        # Merge with existing values so PATCH requests are validated too.
        get = lambda k: attrs.get(k, getattr(self.instance, k, None))  # noqa: E731
        date, start, end = get("date"), get("start_time"), get("end_time")
        deadline = get("registration_deadline")

        if self.instance is None and date and date < timezone.localdate():
            raise serializers.ValidationError({"date": "Event date cannot be in the past."})
        if start and end and end <= start:
            raise serializers.ValidationError({"end_time": "End time must be after start time."})
        if deadline and date and timezone.localtime(deadline).date() > date:
            raise serializers.ValidationError(
                {"registration_deadline": "Registration deadline cannot be after the event date."})
        # Cannot shrink capacity below the number of people already registered.
        max_p = attrs.get("max_participants")
        if self.instance is not None and max_p is not None:
            current = self.instance.registrations.exclude(status="Cancelled").count()
            if max_p < current:
                raise serializers.ValidationError(
                    {"max_participants": f"{current} students are already registered."})
        return attrs


class EventVolunteerSerializer(serializers.ModelSerializer):
    volunteer = UserSerializer(read_only=True)

    class Meta:
        model = EventVolunteer
        fields = ["id", "volunteer", "assigned_at"]
