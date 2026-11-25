from django.urls import path

from .views import DashboardView, EventReportView

urlpatterns = [
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path("dashboard/event-report/", EventReportView.as_view(), name="event-report"),
]
