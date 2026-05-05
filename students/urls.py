from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ParentViewSet, StudentViewSet, GroupViewSet

router = DefaultRouter()
router.register(r'parents', ParentViewSet)
router.register(r'students', StudentViewSet, basename='student')
router.register(r'groups', GroupViewSet)

urlpatterns = [
    path('', include(router.urls)),
]