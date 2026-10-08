from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import EventBudgetViewSet, ExpenseViewSet

router = DefaultRouter()
router.register("budgets", EventBudgetViewSet, basename="budget")
router.register("expenses", ExpenseViewSet, basename="expense")

urlpatterns = [path("", include(router.urls))]
