from django.contrib import admin

from .models import Event, EventVolunteer


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ("title", "event_type", "date", "status", "max_participants")
    list_filter = ("event_type", "status")
    search_fields = ("title", "venue")


admin.site.register(EventVolunteer)
