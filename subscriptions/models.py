from django.db import models
from core.models import Branch, Subject, StatusChoices
from students.models import Student

class SubscriptionPlan(models.Model):
    TYPE_CHOICES = (
        ('INDIVIDUAL', 'Individual'),
        ('GROUP', 'Group'),
    )
    name = models.CharField(max_length=255)
    branch = models.ForeignKey(Branch, on_delete=models.CASCADE)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.ACTIVE)

    subjects = models.ManyToManyField(Subject, related_name='subscription_plans')

    def __str__(self):
        return self.name

class PlanPricingGrid(models.Model):
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.CASCADE, related_name='pricing_grid')
    lessons_per_month = models.IntegerField()
    price_per_lesson = models.DecimalField(max_digits=10, decimal_places=2)

class StudentSubscription(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='subscriptions')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.RESTRICT)
    start_date = models.DateField()