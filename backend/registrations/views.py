from django.db import transaction
from django.http import HttpResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import mixins, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import GenericViewSet

from accounts.permissions import IsAdminRole, IsStudentRole
from events.models import Event

from .models import Registration
from .serializers import RegistrationSerializer, RegistrationStatusSerializer
from .utils import attach_qr_code, make_qr_png, send_registration_email


class EventRegisterView(APIView):
    """POST /api/events/<id>/register/ - a student registers for an event."""

    permission_classes = [IsStudentRole]

    def post(self, request, pk):
        with transaction.atomic():
            # select_for_update locks the event row, so two students cannot grab the last seat together.
            event = get_object_or_404(Event.objects.select_for_update(), pk=pk)

            if event.status != Event.Status.REGISTRATION_OPEN:
                return Response({"error": f"Registration is not open (event is '{event.status}')."},
                                status=status.HTTP_400_BAD_REQUEST)
            if timezone.now() > event.registration_deadline:
                return Response({"error": "The registration deadline has passed."},
                                status=status.HTTP_400_BAD_REQUEST)

            existing = Registration.objects.filter(student=request.user, event=event).first()
            if existing and existing.status == Registration.Status.CONFIRMED:
                return Response({"error": "You are already registered for this event."},
                                status=status.HTTP_409_CONFLICT)

            taken = event.registrations.exclude(status=Registration.Status.CANCELLED).count()
            if taken >= event.max_participants:
                return Response({"error": "This event is full."}, status=status.HTTP_409_CONFLICT)

            if existing:  # previously cancelled -> re-activate
                existing.status = Registration.Status.CONFIRMED
                existing.save(update_fields=["status"])
                registration = existing
            else:
                registration = Registration.objects.create(student=request.user, event=event)
            attach_qr_code(registration)
            transaction.on_commit(lambda: send_registration_email(registration))

        data = RegistrationSerializer(registration, context={"request": request}).data
        return Response({"message": "Registration successful",
                         "registration_id": registration.registration_id,
                         "registration": data}, status=status.HTTP_201_CREATED)


class RegistrationViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin,
                          mixins.UpdateModelMixin, mixins.DestroyModelMixin, GenericViewSet):
    """
    GET /api/registrations/  (students: own, volunteers: assigned events, admin: all)
    Filters: ?event=1&attendance_status=Checked In&status=Confirmed&search=ACE-2026 or name/email
    PATCH / DELETE: admin only.
    """

    http_method_names = ["get", "patch", "delete", "head", "options"]
    search_fields = ["registration_id", "student__first_name", "student__last_name", "student__email"]
    filterset_fields = ["event", "attendance_status", "status"]
    ordering_fields = ["registered_at"]

    def get_permissions(self):
        if self.action in ("partial_update", "update", "destroy"):
            return [IsAdminRole()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action in ("partial_update", "update"):
            return RegistrationStatusSerializer
        return RegistrationSerializer

    def get_queryset(self):
        qs = Registration.objects.select_related("student", "event", "checked_in_by")
        if getattr(self, "swagger_fake_view", False):  # API-docs generator has no real user
            return qs.none()
        user = self.request.user
        if user.role == "student":
            return qs.filter(student=user)
        if user.role == "volunteer":
            return qs.filter(event__volunteer_assignments__volunteer=user)
        return qs

    @action(detail=True, methods=["get"], url_path="qr", url_name="qr")
    def qr(self, request, pk=None):
        """GET /api/registrations/<id>/qr/?download=1 - PNG image of the QR code."""
        registration = self.get_object()  # get_queryset() already limits who can see it
        response = HttpResponse(make_qr_png(registration.registration_id), content_type="image/png")
        if request.query_params.get("download"):
            response["Content-Disposition"] = f'attachment; filename="{registration.registration_id}.png"'
        return response
