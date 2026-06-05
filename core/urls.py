from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BranchViewSet, SubjectViewSet

router = DefaultRouter()

router.register(r'branches', BranchViewSet, basename='branches')
router.register(r'subjects', SubjectViewSet, basename='subject')

urlpatterns = [
    path('', include(router.urls)),
]