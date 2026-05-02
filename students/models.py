from django.db import models
from core.models import Branch, StatusChoices

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
    parent = models.ForeignKey(Parent, on_delete=models.RESTRICT, related_name='children', null=True, blank=True)

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