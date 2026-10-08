from decimal import Decimal

from django.db.models import Sum
from rest_framework import serializers

from .models import EventBudget, Expense


class EventBudgetSerializer(serializers.ModelSerializer):
    event_title = serializers.CharField(source="event.title", read_only=True)
    total_expenses = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    remaining_budget = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    utilization_percent = serializers.DecimalField(max_digits=7, decimal_places=2, read_only=True)

    class Meta:
        model = EventBudget
        fields = ["id", "event", "event_title", "allocated_amount", "total_expenses",
                  "remaining_budget", "utilization_percent", "created_at"]
        read_only_fields = ["created_at"]

    def validate_allocated_amount(self, value):
        if value < 0:
            raise serializers.ValidationError("Budget cannot be negative.")
        return value

    def validate(self, attrs):
        # When lowering a budget, it cannot drop below what is already spent.
        if self.instance and "allocated_amount" in attrs:
            spent = self.instance.total_expenses
            if attrs["allocated_amount"] < spent:
                raise serializers.ValidationError(
                    {"allocated_amount": f"₹{spent} is already spent on this event."})
        if self.instance and "event" in attrs and attrs["event"] != self.instance.event:
            raise serializers.ValidationError({"event": "A budget cannot be moved to another event."})
        return attrs


class ExpenseSerializer(serializers.ModelSerializer):
    added_by_name = serializers.CharField(source="added_by.get_full_name", read_only=True)
    event_title = serializers.CharField(source="event.title", read_only=True)

    class Meta:
        model = Expense
        fields = ["id", "event", "event_title", "category", "description", "amount",
                  "expense_date", "added_by", "added_by_name"]
        read_only_fields = ["added_by"]

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Expense amount must be greater than zero.")
        return value

    def validate(self, attrs):
        event = attrs.get("event") or (self.instance.event if self.instance else None)
        amount = attrs.get("amount", self.instance.amount if self.instance else None)
        if event is None or amount is None:
            return attrs
        budget = getattr(event, "budget", None)
        if budget is None:
            raise serializers.ValidationError({"event": "Create a budget for this event first."})
        others = event.expenses.exclude(pk=self.instance.pk if self.instance else None)
        spent = others.aggregate(total=Sum("amount"))["total"] or Decimal("0")
        if spent + amount > budget.allocated_amount:
            remaining = budget.allocated_amount - spent
            raise serializers.ValidationError(
                {"amount": f"Exceeds the event budget. Only ₹{remaining} remaining."})
        return attrs
