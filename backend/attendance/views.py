from django.db import transaction
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import has_role
from events.models import Event
from registrations.models import Registration
from registrations.serializers import RegistrationSerializer


class CheckInView(APIView):
    """
    POST /api/attendance/check-in/   body: {"registration_id": "ACE-2026-00001"}
    Allowed: admin, or a volunteer assigned to that registration's event.
    """

    def post(self, request):
        if not (has_role(request.user, "admin") or has_role(request.user, "volunteer")):
            return Response({"error": "Only volunteers or admins can check students in."},
                            status=status.HTTP_403_FORBIDDEN)

        reg_id = str(request.data.get("registration_id", "")).strip()
        if not reg_id:
            return Response({"error": "registration_id is required."}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            # Lock the row so scanning the same QR twice at once cannot check in twice.
            registration = (Registration.objects.select_for_update()
                            .select_related("student", "event").filter(registration_id=reg_id).first())
            if registration is None:
                return Response({"error": "Invalid QR code: registration not found."},
                                status=status.HTTP_404_NOT_FOUND)

            if request.user.role == "volunteer" and not registration.event.volunteer_assignments.filter(
                    volunteer=request.user).exists():
                return Response({"error": "You are not assigned to this event."},
                                status=status.HTTP_403_FORBIDDEN)
            if registration.status == Registration.Status.CANCELLED:
                return Response({"error": "This registration was cancelled."},
                                status=status.HTTP_400_BAD_REQUEST)
            if registration.attendance_status == Registration.Attendance.CHECKED_IN:
                return Response({"error": "Already checked in.",
                                 "check_in_time": registration.check_in_time},
                                status=status.HTTP_409_CONFLICT)

            registration.attendance_status = Registration.Attendance.CHECKED_IN
            registration.check_in_time = timezone.now()
            registration.checked_in_by = request.user
            registration.save(update_fields=["attendance_status", "check_in_time", "checked_in_by"])

        return Response({"message": "Check-in successful",
                         "registration": RegistrationSerializer(registration, context={"request": request}).data})


class AttendanceSummaryView(APIView):
    """GET /api/attendance/summary/?event=<id> - totals for one event (admin / assigned volunteer)."""

    def get(self, request):
        if not (has_role(request.user, "admin") or has_role(request.user, "volunteer")):
            return Response({"error": "Not allowed."}, status=status.HTTP_403_FORBIDDEN)
        events = Event.objects.all()
        if request.user.role == "volunteer":
            events = events.filter(volunteer_assignments__volunteer=request.user)
        event_id = request.query_params.get("event")
        if event_id:
            events = events.filter(pk=event_id)
        regs = Registration.objects.filter(event__in=events).exclude(status="Cancelled")
        totals = regs.aggregate(
            total=Count("id"),
            checked_in=Count("id", filter=Q(attendance_status="Checked In")))
        return Response({"total_participants": totals["total"],
                         "checked_in": totals["checked_in"],
                         "pending": totals["total"] - totals["checked_in"]})
