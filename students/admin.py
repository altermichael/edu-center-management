from django.contrib import admin
from .models import Parent, Student, Group, StudentGroup

admin.site.register(Parent)
admin.site.register(Student)
admin.site.register(Group)
admin.site.register(StudentGroup)