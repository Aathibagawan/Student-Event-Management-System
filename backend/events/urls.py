from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import EventViewSet, EventVolunteerDeleteView, EventVolunteerListCreateView

router = DefaultRouter()
router.register("events", EventViewSet, basename="event")

urlpatterns = [
    path("events/<int:pk>/volunteers/", EventVolunteerListCreateView.as_view()),
    path("events/<int:pk>/volunteers/<int:volunteer_id>/", EventVolunteerDeleteView.as_view()),
    path("", include(router.urls)),
]
