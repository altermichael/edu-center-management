from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LessonTemplateViewSet, LessonViewSet, AttendanceViewSet

router = DefaultRouter()
router.register(r'lessons', LessonViewSet, basename='lesson')
router.register(r'attendances', AttendanceViewSet, basename='attendance')
router.register(r'templates', LessonTemplateViewSet, basename='template')

urlpatterns = [
    path('', include(router.urls)),
]