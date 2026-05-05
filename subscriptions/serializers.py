from rest_framework import serializers
from .models import SubscriptionPlan, PlanPricingGrid, StudentSubscription

class PlanPricingGridSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanPricingGrid
        fields = ['id', 'plan', 'lessons_per_month', 'price_per_lesson']

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    pricing_grid = PlanPricingGridSerializer(many=True, read_only=True)

    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'branch', 'type', 'status', 'subjects', 'pricing_grid']

class StudentSubscriptionSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentSubscription
        fields = ['id', 'student', 'subject', 'plan', 'start_date']