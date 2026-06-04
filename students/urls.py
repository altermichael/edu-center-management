from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ParentViewSet, StudentViewSet, GroupViewSet

router = DefaultRouter()
router.register(r'parents', ParentViewSet, basename='parent') 
router.register(r'students', StudentViewSet, basename='student')
router.register(r'groups', GroupViewSet, basename='group') 

urlpatterns = [
    path('', include(router.urls)),
]