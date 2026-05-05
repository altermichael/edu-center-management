from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import SubscriptionPlan, StudentSubscription
from .serializers import SubscriptionPlanSerializer, StudentSubscriptionSerializer

class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    queryset = SubscriptionPlan.objects.all()
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [IsAuthenticated]

class StudentSubscriptionViewSet(viewsets.ModelViewSet):
    queryset = StudentSubscription.objects.all()
    serializer_class = StudentSubscriptionSerializer
    permission_classes = [IsAuthenticated]