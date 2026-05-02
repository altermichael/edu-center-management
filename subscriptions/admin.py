from django.contrib import admin
from .models import SubscriptionPlan, PlanPricingGrid, StudentSubscription

admin.site.register(SubscriptionPlan)
admin.site.register(PlanPricingGrid)
admin.site.register(StudentSubscription)