"""Gives every API error the same JSON shape: {"error": ..., "details": ...}."""
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)
    if response is not None:
        detail = response.data
        message = detail.get("detail") if isinstance(detail, dict) and "detail" in detail else "Request failed"
        response.data = {"error": str(message), "details": detail}
    return response
