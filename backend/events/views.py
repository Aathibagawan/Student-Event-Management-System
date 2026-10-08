from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from accounts.models import User
from accounts.permissions import IsAdminOrReadOnly, IsAdminRole, IsVolunteerRole

from .models import Event, EventVolunteer
from .serializers import EventSerializer, EventVolunteerSerializer

ACTIVE = Q(registrations__status="Confirmed")  # seats taken = confirmed registrations


class EventViewSet(ModelViewSet):
    """
    list/retrieve: any logged-in user.  create/update/delete: admin only.
    GET /api/events/?search=title&event_type=Workshop&status=Upcoming&date=2026-11-01
    """

    serializer_class = EventSerializer
    permission_classes = [IsAdminOrReadOnly]
    search_fields = ["title", "venue"]
    filterset_fields = {"event_type": ["exact"], "status": ["exact"], "date": ["exact", "gte", "lte"]}
    ordering_fields = ["date", "title", "created_at"]

    def get_queryset(self):
        # annotate = one SQL query with COUNT, instead of counting per event in Python
        return Event.objects.select_related("created_by").annotate(
            registered_count=Count("registrations", filter=ACTIVE))

    def get_serializer_context(self):
        context = super().get_serializer_context()
        user = self.request.user
        if user.is_authenticated and user.role == "student":
            context["my_event_ids"] = set(
                user.registrations.exclude(status="Cancelled").values_list("event_id", flat=True))
        return context

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=["get"], permission_classes=[IsVolunteerRole])
    def assigned(self, request):
        """GET /api/events/assigned/ - events assigned to the logged-in volunteer."""
        qs = self.filter_queryset(self.get_queryset()).filter(volunteer_assignments__volunteer=request.user)
        page = self.paginate_queryset(qs)
        serializer = self.get_serializer(page if page is not None else qs, many=True)
        return self.get_paginated_response(serializer.data) if page is not None else Response(serializer.data)


class EventVolunteerListCreateView(APIView):
    """GET/POST /api/events/<id>/volunteers/ - admin assigns volunteers to an event."""

    permission_classes = [IsAdminRole]

    def get(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        qs = event.volunteer_assignments.select_related("volunteer__volunteer_profile")
        return Response(EventVolunteerSerializer(qs, many=True).data)

    def post(self, request, pk):
        event = get_object_or_404(Event, pk=pk)
        volunteer = User.objects.filter(pk=request.data.get("volunteer_id"), role="volunteer").first()
        if volunteer is None:
            return Response({"error": "Volunteer not found."}, status=status.HTTP_400_BAD_REQUEST)
        assignment, created = EventVolunteer.objects.get_or_create(event=event, volunteer=volunteer)
        if not created:
            return Response({"error": "Volunteer already assigned."}, status=status.HTTP_409_CONFLICT)
        return Response(EventVolunteerSerializer(assignment).data, status=status.HTTP_201_CREATED)


class EventVolunteerDeleteView(APIView):
    """DELETE /api/events/<id>/volunteers/<volunteer_id>/"""

    permission_classes = [IsAdminRole]

    def delete(self, request, pk, volunteer_id):
        deleted, _ = EventVolunteer.objects.filter(event_id=pk, volunteer_id=volunteer_id).delete()
        if not deleted:
            return Response({"error": "Assignment not found."}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)
