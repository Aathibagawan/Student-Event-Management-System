from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import StudentProfile, User, VolunteerProfile


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (("Role", {"fields": ("role",)}),)
    list_display = ("username", "email", "role", "is_active")
    list_filter = ("role", "is_active")


admin.site.register(StudentProfile)
admin.site.register(VolunteerProfile)
