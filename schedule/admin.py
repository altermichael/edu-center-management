from django.contrib import admin
from .models import LessonTemplate, Lesson, Attendance

admin.site.register(LessonTemplate)
admin.site.register(Lesson)
admin.site.register(Attendance)