from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models
from django.db.models import Sum


class EventBudget(models.Model):
    event = models.OneToOneField("events.Event", on_delete=models.CASCADE, related_name="budget")
    allocated_amount = models.DecimalField(max_digits=10, decimal_places=2,
                                           validators=[MinValueValidator(Decimal("0"))])
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Budget for {self.event}"

    @property
    def total_expenses(self):
        return self.event.expenses.aggregate(total=Sum("amount"))["total"] or Decimal("0.00")

    @property
    def remaining_budget(self):
        return self.allocated_amount - self.total_expenses

    @property
    def utilization_percent(self):
        if not self.allocated_amount:
            return Decimal("0.00")
        return (self.total_expenses / self.allocated_amount * 100).quantize(Decimal("0.01"))


class Expense(models.Model):
    class Category(models.TextChoices):
        VENUE = "Venue", "Venue"
        FOOD = "Food", "Food"
        PRIZES = "Prizes", "Prizes"
        CERTIFICATES = "Certificates", "Certificates"
        OTHER = "Other", "Other"

    event = models.ForeignKey("events.Event", on_delete=models.CASCADE, related_name="expenses")
    category = models.CharField(max_length=20, choices=Category.choices)
    description = models.CharField(max_length=255, blank=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2,
                                 validators=[MinValueValidator(Decimal("0.01"))])
    expense_date = models.DateField()
    added_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
                                 null=True, related_name="expenses_added")

    class Meta:
        ordering = ["-expense_date", "-id"]
        indexes = [models.Index(fields=["event", "category"])]

    def __str__(self):
        return f"{self.category}: {self.amount}"
