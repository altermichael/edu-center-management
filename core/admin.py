from django.contrib import admin

from .models import (
    Branch, 
    Subject, 
    Student, 
    Group, 
    SubscriptionPlan, 
    LessonTemplate, 
    Lesson, 
    Attendance
)

admin.site.register(Branch)
admin.site.register(Subject)
admin.site.register(Student)
admin.site.register(Group)
admin.site.register(SubscriptionPlan)
admin.site.register(LessonTemplate)
admin.site.register(Lesson)
admin.site.register(Attendance)