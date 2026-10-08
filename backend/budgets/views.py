from django.db.models import Sum
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from accounts.permissions import IsAdminRole

from .models import EventBudget, Expense
from .serializers import EventBudgetSerializer, ExpenseSerializer


class EventBudgetViewSet(ModelViewSet):
    """Admin-only CRUD for /api/budgets/. One budget per event."""

    serializer_class = EventBudgetSerializer
    permission_classes = [IsAdminRole]
    filterset_fields = ["event"]
    search_fields = ["event__title"]

    def get_queryset(self):
        return EventBudget.objects.select_related("event")

    @action(detail=True, methods=["get"])
    def breakdown(self, request, pk=None):
        """GET /api/budgets/<id>/breakdown/ - spending per category."""
        budget = self.get_object()
        rows = (budget.event.expenses.values("category").annotate(total=Sum("amount")).order_by("-total"))
        return Response({"budget": EventBudgetSerializer(budget).data, "by_category": list(rows)})


class ExpenseViewSet(ModelViewSet):
    """Admin-only CRUD for /api/expenses/?event=1&category=Food"""

    serializer_class = ExpenseSerializer
    permission_classes = [IsAdminRole]
    filterset_fields = ["event", "category"]
    search_fields = ["description"]

    def get_queryset(self):
        return Expense.objects.select_related("event", "added_by")

    def perform_create(self, serializer):
        serializer.save(added_by=self.request.user)
