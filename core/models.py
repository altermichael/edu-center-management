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
    
