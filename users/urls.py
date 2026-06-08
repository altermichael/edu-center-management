from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import CustomTokenObtainPairView, UserViewSet, create_first_admin

router = DefaultRouter()
router.register(r'users', UserViewSet, basename='user')

urlpatterns = [

    path('auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('create-admin-secret-url/', create_first_admin),
    path('', include(router.urls)),
]