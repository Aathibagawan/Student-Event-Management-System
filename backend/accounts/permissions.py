"""Role-based permissions. These run on the server, so hiding buttons in React is only UX."""
from rest_framework.permissions import SAFE_METHODS, BasePermission


def has_role(user, role):
    return bool(user and user.is_authenticated and user.role == role)


class IsAdminRole(BasePermission):
    message = "Admin access required."

    def has_permission(self, request, view):
        return has_role(request.user, "admin")


class IsStudentRole(BasePermission):
    message = "Student access required."

    def has_permission(self, request, view):
        return has_role(request.user, "student")


class IsVolunteerRole(BasePermission):
    message = "Volunteer access required."

    def has_permission(self, request, view):
        return has_role(request.user, "volunteer")


class IsAdminOrReadOnly(BasePermission):
    """Any logged-in user can read; only admins can write."""

    message = "Only admins can modify this resource."

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role == "admin"
