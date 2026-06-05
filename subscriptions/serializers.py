from rest_framework import serializers
from .models import SubscriptionPlan, PlanPricingGrid, StudentSubscription
from core.models import Subject

class PlanPricingGridSerializer(serializers.ModelSerializer):
    class Meta:
        model = PlanPricingGrid
        fields = ['id', 'lessons_per_month', 'price_per_lesson']

class SubscriptionPlanSerializer(serializers.ModelSerializer):
    pricing_grid = PlanPricingGridSerializer(many=True)
    subjects = serializers.PrimaryKeyRelatedField(many=True, queryset=Subject.objects.all())
    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = SubscriptionPlan
        fields = ['id', 'name', 'branch', 'branch_name', 'type', 'status', 'subjects', 'pricing_grid']

    def create(self, validated_data):
        pricing_data = validated_data.pop('pricing_grid', [])
        subjects_data = validated_data.pop('subjects', [])
        plan = SubscriptionPlan.objects.create(**validated_data)
        plan.subjects.set(subjects_data)
        for price_item in pricing_data:
            PlanPricingGrid.objects.create(plan=plan, **price_item)
        return plan

    def update(self, instance, validated_data):
        pricing_data = validated_data.pop('pricing_grid', None)
        subjects_data = validated_data.pop('subjects', None)

        instance.name = validated_data.get('name', instance.name)
        instance.type = validated_data.get('type', instance.type)
        instance.status = validated_data.get('status', instance.status)
        instance.save()

        if subjects_data is not None:
            instance.subjects.set(subjects_data)

        if pricing_data is not None:
            instance.pricing_grid.all().delete()
            for price_item in pricing_data:
                PlanPricingGrid.objects.create(plan=instance, **price_item)
        return instance

class StudentSubscriptionSerializer(serializers.ModelSerializer):
    plan_name = serializers.CharField(source='plan.name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)

    class Meta:
        model = StudentSubscription
        fields = ['id', 'student', 'subject', 'subject_name', 'plan', 'plan_name', 'start_date']