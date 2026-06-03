from core.views import NoDeleteViewSet
from rest_framework.permissions import IsAuthenticated
from .models import SubscriptionPlan, StudentSubscription
from .serializers import SubscriptionPlanSerializer, StudentSubscriptionSerializer

class SubscriptionPlanViewSet(NoDeleteViewSet):
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [IsAuthenticated]

class StudentSubscriptionViewSet(NoDeleteViewSet):
    queryset = StudentSubscription.objects.all()
    serializer_class = StudentSubscriptionSerializer
    permission_classes = [IsAuthenticated]