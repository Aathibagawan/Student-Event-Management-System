from django.urls import path

from .views import AttendanceSummaryView, CheckInView

urlpatterns = [
    path("attendance/check-in/", CheckInView.as_view(), name="check-in"),
    path("attendance/summary/", AttendanceSummaryView.as_view(), name="attendance-summary"),
]
