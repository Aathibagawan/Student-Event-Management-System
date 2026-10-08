from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import StudentProfile, User, VolunteerProfile


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    roll_number = serializers.CharField(source="student_profile.roll_number", read_only=True, default=None)
    department = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "full_name",
                  "role", "roll_number", "department", "date_joined"]
        read_only_fields = fields

    def get_full_name(self, obj):
        return obj.get_full_name() or obj.username

    def get_department(self, obj):
        if obj.role == "student" and hasattr(obj, "student_profile"):
            return obj.student_profile.department
        if obj.role == "volunteer" and hasattr(obj, "volunteer_profile"):
            return obj.volunteer_profile.department
        return ""


class StudentRegisterSerializer(serializers.Serializer):
    """Public sign-up. Always creates a STUDENT - a visitor can never choose a role."""

    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    roll_number = serializers.CharField(max_length=30, required=False, allow_blank=True)
    department = serializers.CharField(max_length=100, required=False, allow_blank=True)
    year = serializers.IntegerField(required=False, min_value=1, max_value=6, allow_null=True)
    phone = serializers.CharField(max_length=15, required=False, allow_blank=True)

    def validate_email(self, value):
        value = value.lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        profile_data = {k: validated_data.pop(k) for k in ("roll_number", "department", "year", "phone")
                        if k in validated_data}
        password = validated_data.pop("password")
        user = User(username=validated_data["email"], role=User.Role.STUDENT, **validated_data)
        user.set_password(password)  # hashes the password
        user.save()
        StudentProfile.objects.create(user=user, **profile_data)
        return user


class VolunteerCreateSerializer(serializers.Serializer):
    """Used by admins to create volunteer accounts."""

    first_name = serializers.CharField(max_length=150)
    last_name = serializers.CharField(max_length=150, required=False, allow_blank=True)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    department = serializers.CharField(max_length=100, required=False, allow_blank=True)
    phone = serializers.CharField(max_length=15, required=False, allow_blank=True)

    def validate_email(self, value):
        value = value.lower()
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def create(self, validated_data):
        department = validated_data.pop("department", "")
        phone = validated_data.pop("phone", "")
        password = validated_data.pop("password")
        user = User(username=validated_data["email"], role=User.Role.VOLUNTEER, **validated_data)
        user.set_password(password)
        user.save()
        VolunteerProfile.objects.create(user=user, department=department, phone=phone)
        return user


class LoginSerializer(TokenObtainPairSerializer):
    """Returns access + refresh tokens plus basic user info so React knows the role."""

    def validate(self, attrs):
        # Allow logging in with email in the "username" field (we store username == email).
        username = attrs.get("username", "")
        if "@" in username:
            match = User.objects.filter(email__iexact=username).first()
            if match:
                attrs["username"] = match.username
        data = super().validate(attrs)
        data["user"] = UserSerializer(self.user).data
        return data

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        return token
