from decimal import Decimal

from django.db.models import Count, Q, Sum
from django.utils import timezone
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import User
from budgets.models import EventBudget, Expense
from events.models import Event
from registrations.models import Registration

ACTIVE_REGS = Q(registrations__status="Confirmed")  # used inside Event annotations


def admin_stats():
    regs = Registration.objects.exclude(status="Cancelled")
    checked_in = regs.filter(attendance_status="Checked In").count()
    total_regs = regs.count()
    total_budget = EventBudget.objects.aggregate(t=Sum("allocated_amount"))["t"] or Decimal("0")
    total_expenses = Expense.objects.aggregate(t=Sum("amount"))["t"] or Decimal("0")
    per_event = (Event.objects.annotate(count=Count("registrations", filter=ACTIVE_REGS))
                 .order_by("-count")[:6].values("title", "count"))
    by_category = Expense.objects.values("category").annotate(total=Sum("amount")).order_by("-total")
    return {
        "total_events": Event.objects.count(),
        "upcoming_events": Event.objects.filter(
            status__in=["Upcoming", "Registration Open"], date__gte=timezone.localdate()).count(),
        "total_students": User.objects.filter(role="student").count(),
        "total_registrations": total_regs,
        "total_checked_in": checked_in,
        "pending_check_ins": total_regs - checked_in,
        "total_budget": total_budget,
        "total_expenses": total_expenses,
        "remaining_budget": total_budget - total_expenses,
        "registrations_per_event": list(per_event),
        "expenses_by_category": list(by_category),
    }


def student_stats(user):
    today = timezone.localdate()
    regs = Registration.objects.filter(student=user).exclude(status="Cancelled").select_related("event")
    return {
        "registered_events": regs.count(),
        "upcoming_events": regs.filter(event__date__gte=today).exclude(event__status="Completed").count(),
        "completed_events": regs.filter(Q(event__date__lt=today) | Q(event__status="Completed")).count(),
        "attended": regs.filter(attendance_status="Checked In").count(),
        "not_attended": regs.filter(attendance_status="Not Checked In").count(),
    }


def volunteer_stats(user):
    events = Event.objects.filter(volunteer_assignments__volunteer=user)
    regs = Registration.objects.filter(event__in=events).exclude(status="Cancelled")
    checked_in = regs.filter(attendance_status="Checked In").count()
    total = regs.count()
    return {"assigned_events": events.count(), "total_participants": total,
            "checked_in_participants": checked_in, "pending_check_ins": total - checked_in}


class DashboardView(APIView):
    """GET /api/dashboard/ - returns the statistics for the logged-in user's role."""

    def get(self, request):
        role = request.user.role
        if role == "admin":
            data = admin_stats()
        elif role == "student":
            data = student_stats(request.user)
        else:
            data = volunteer_stats(request.user)
        return Response({"role": role, "stats": data})
