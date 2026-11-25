from django.conf import settings
from django.contrib import admin
from django.db import connection
from django.http import JsonResponse
from django.urls import include, path, re_path
from django.views.static import serve
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView


def health(request):
    """GET /api/health/ - used by Render / Docker to check the app and the database are alive."""
    try:
        connection.ensure_connection()
        return JsonResponse({"status": "ok", "database": "up"})
    except Exception:
        return JsonResponse({"status": "error", "database": "down"}, status=503)


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health, name="health"),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("accounts.urls_users")),
    path("api/", include("events.urls")),
    path("api/", include("registrations.urls")),
    path("api/", include("attendance.urls")),
    path("api/", include("budgets.urls")),
    path("api/", include("dashboard.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
]

if settings.SERVE_MEDIA:  # uploaded posters
    urlpatterns += [re_path(r"^media/(?P<path>.*)$", serve, {"document_root": settings.MEDIA_ROOT})]
