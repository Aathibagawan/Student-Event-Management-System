from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import User
from .permissions import IsAdminRole
from .serializers import (LoginSerializer, StudentRegisterSerializer, UserSerializer,
                          VolunteerCreateSerializer)


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ - public student sign-up."""

    serializer_class = StudentRegisterSerializer
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "register"

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/ - returns access, refresh and user."""

    serializer_class = LoginSerializer
    permission_classes = [AllowAny]
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "login"  # max 20 attempts / minute (brute-force protection)


class LogoutView(APIView):
    """POST /api/auth/logout/ {"refresh": "..."} - blacklists the refresh token so it can't be reused.
    No access token needed: holding the refresh token is the proof. Works even if the access token expired."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        token = request.data.get("refresh")
        if not token:
            return Response({"error": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)
        try:
            RefreshToken(token).blacklist()
        except TokenError:
            return Response({"error": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_205_RESET_CONTENT)


class MeView(APIView):
    """GET /api/auth/me/ - who am I? (used by React to restore a session)."""

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class UserListView(generics.ListAPIView):
    """GET /api/users/ - admin only. ?role=student&search=name/email&registration_id=ACE-..."""

    serializer_class = UserSerializer
    permission_classes = [IsAdminRole]
    search_fields = ["first_name", "last_name", "email"]
    filterset_fields = ["role"]

    def get_queryset(self):
        qs = User.objects.select_related("student_profile", "volunteer_profile").order_by("-date_joined")
        reg_id = self.request.query_params.get("registration_id")
        if reg_id:
            qs = qs.filter(registrations__registration_id__icontains=reg_id).distinct()
        return qs


class VolunteerListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/volunteers/ - admin manages volunteer accounts."""

    permission_classes = [IsAdminRole]
    search_fields = ["first_name", "last_name", "email"]

    def get_queryset(self):
        return User.objects.filter(role=User.Role.VOLUNTEER).select_related("volunteer_profile")

    def get_serializer_class(self):
        return VolunteerCreateSerializer if self.request.method == "POST" else UserSerializer

    def create(self, request, *args, **kwargs):
        serializer = VolunteerCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)
