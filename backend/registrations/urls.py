from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import EventRegisterView, RegistrationViewSet

router = DefaultRouter()
router.register("registrations", RegistrationViewSet, basename="registration")

urlpatterns = [
    path("events/<int:pk>/register/", EventRegisterView.as_view(), name="event-register"),
    path("", include(router.urls)),
]
