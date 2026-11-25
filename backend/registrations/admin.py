from django.contrib import admin

from .models import Registration


@admin.register(Registration)
class RegistrationAdmin(admin.ModelAdmin):
    list_display = ("registration_id", "student", "event", "status", "attendance_status")
    list_filter = ("status", "attendance_status", "event")
    search_fields = ("registration_id", "student__email")
