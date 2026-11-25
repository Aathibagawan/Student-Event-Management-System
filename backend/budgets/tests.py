from datetime import date
from decimal import Decimal

from rest_framework.test import APITestCase

from budgets.models import EventBudget, Expense
from config.helpers import make_event, make_user


class BudgetTests(APITestCase):
    def setUp(self):
        self.admin = make_user("admin")
        self.event = make_event(self.admin)
        self.budget = EventBudget.objects.create(event=self.event, allocated_amount=Decimal("10000"))

    def add_expense(self, amount, category="Venue"):
        return self.client.post("/api/expenses/", {
            "event": self.event.id, "category": category, "description": "x",
            "amount": amount, "expense_date": str(date.today())}, format="json")

    def test_budget_calculation(self):
        """Total, remaining and utilization are derived from the expenses."""
        for cat, amt in [("Venue", "3000"), ("Food", "2500"), ("Prizes", "2000"),
                         ("Certificates", "500"), ("Other", "1000")]:
            Expense.objects.create(event=self.event, category=cat, amount=Decimal(amt),
                                   expense_date=date.today(), added_by=self.admin)
        self.assertEqual(self.budget.total_expenses, Decimal("9000"))
        self.assertEqual(self.budget.remaining_budget, Decimal("1000"))
        self.assertEqual(self.budget.utilization_percent, Decimal("90.00"))

    def test_budget_api_returns_calculated_fields(self):
        self.client.force_authenticate(self.admin)
        self.add_expense("2500")
        res = self.client.get(f"/api/budgets/{self.budget.id}/")
        self.assertEqual(Decimal(res.data["remaining_budget"]), Decimal("7500.00"))

    def test_expense_cannot_exceed_budget(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.add_expense("9000").status_code, 201)
        self.assertEqual(self.add_expense("1500").status_code, 400)

    def test_negative_expense_rejected(self):
        self.client.force_authenticate(self.admin)
        self.assertEqual(self.add_expense("-5").status_code, 400)

    def test_negative_budget_rejected(self):
        self.client.force_authenticate(self.admin)
        other = make_event(self.admin, title="Other")
        res = self.client.post("/api/budgets/", {"event": other.id, "allocated_amount": "-100"}, format="json")
        self.assertEqual(res.status_code, 400)

    def test_student_cannot_access_budgets(self):
        self.client.force_authenticate(make_user("student"))
        self.assertEqual(self.client.get("/api/budgets/").status_code, 403)
