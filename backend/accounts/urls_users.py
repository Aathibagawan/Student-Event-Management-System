from django.urls import path

from .views import UserListView, VolunteerListCreateView

urlpatterns = [
    path("users/", UserListView.as_view(), name="user-list"),
    path("volunteers/", VolunteerListCreateView.as_view(), name="volunteer-list"),
]
