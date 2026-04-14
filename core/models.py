from django.db import models
from django.conf import settings

class StatusChoices(models.TextChoices):
    ACTIVE = 'ACTIVE', 'Active'
    ARCHIVED = 'ARCHIVED', 'Archived'

class Branch(models.Model):
    name = models.CharField(max_length=255)
    address = models.TextField(blank=True, null=True)
    city = models.CharField(max_length=100, blank=True, null=True)
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.ACTIVE)

    def __str__(self):
        return f"{self.name} ({self.city})"
    
class Subject(models.Model):
    name = models.CharField(max_length=255)
    branch = models.ForeignKey(Branch, on_delete=models.RESTRICT, related_name='subjects')
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.ACTIVE)

    class Meta:
        unique_together = ('name', 'branch')

    def __str__(self):
        return f"{self.name} - {self.branch.name}"
    
class Parent(models.Model):
    name = models.CharField(max_length=255)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True, null=True)
    relationship = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return self.name
    

class Student(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    date_of_birth = models.DateField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.ACTIVE)
    branch = models.ForeignKey(Branch, on_delete=models.RESTRICT, related_name='students')
    parent = models.ForeignKey(Parent, on_delete=models.RESTRICT, related_name='children')

    def __str__(self):
        return f"{self.first_name} {self.last_name}"
    
class Group(models.Model):
    name = models.CharField(max_length=255)
    branch = models.ForeignKey(Branch, on_delete=models.RESTRICT, related_name='groups')
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.ACTIVE)
    students = models.ManyToManyField(Student, through='StudentGroup', related_name='study_groups')

    def __str__(self):
        return self.name

class StudentGroup(models.Model):
    student = models.ForeignKey(Student, on_delete=models.CASCADE)
    group = models.ForeignKey(Group, on_delete=models.CASCADE)
    join_date = models.DateField(auto_now_add=True)
    leave_date = models.DateField(blank=True, null=True)

    class Meta:
        unique_together = ('student', 'group')



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

class LessonTemplate(models.Model):
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='lesson_templates')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, blank=True, null=True)
    group = models.ForeignKey(Group, on_delete=models.CASCADE, blank=True, null=True)
    days_of_week = models.CharField(max_length=100)
    start_time = models.TimeField()
    end_time = models.TimeField()
    start_date = models.DateField()
    end_date = models.DateField()

class Lesson(models.Model):
    STATUS_CHOICES = (
        ('SCHEDULED', 'Scheduled'),
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
    )
    teacher = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='lessons')
    subject = models.ForeignKey(Subject, on_delete=models.CASCADE)
    student = models.ForeignKey(Student, on_delete=models.CASCADE, blank=True, null=True)
    group = models.ForeignKey(Group, on_delete=models.CASCADE, blank=True, null=True)
    template = models.ForeignKey(LessonTemplate, on_delete=models.SET_NULL, blank=True, null=True)
    date = models.DateField()
    start_time = models.TimeField()
    end_time = models.TimeField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='SCHEDULED')


class Attendance(models.Model):
    STATUS_CHOICES = (
        ('PRESENT', 'Present'),
        ('ABSENT', 'Absent'),
    )
    lesson = models.ForeignKey(Lesson, on_delete=models.CASCADE, related_name='attendances')
    student = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='attendances')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES)
    note = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('lesson', 'student')