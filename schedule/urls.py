from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import LessonTemplateViewSet, LessonViewSet, AttendanceViewSet, BranchStatisticsView

router = DefaultRouter()
router.register(r'lessons', LessonViewSet, basename='lesson')
router.register(r'attendances', AttendanceViewSet, basename='attendance')
router.register(r'templates', LessonTemplateViewSet, basename='template')


urlpatterns = [
    path('reports/basic-stats/', BranchStatisticsView.as_view(), name='basic-stats'),
    path('', include(router.urls)),
]