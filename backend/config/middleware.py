"""Custom middleware: times every request and adds an X-Response-Time header."""
import logging
import time

logger = logging.getLogger("ace.requests")
SLOW_MS = 500


class RequestTimingMiddleware:
    """Runs on EVERY request: before the view (start timer) and after it (log + header)."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        start = time.perf_counter()
        response = self.get_response(request)
        elapsed_ms = (time.perf_counter() - start) * 1000
        response["X-Response-Time"] = f"{elapsed_ms:.1f}ms"
        level = logging.WARNING if elapsed_ms > SLOW_MS else logging.INFO
        logger.log(level, "%s %s -> %s (%.1f ms)", request.method, request.path,
                   response.status_code, elapsed_ms)
        return response
