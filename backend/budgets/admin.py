from django.contrib import admin

from .models import EventBudget, Expense

admin.site.register(EventBudget)
admin.site.register(Expense)
