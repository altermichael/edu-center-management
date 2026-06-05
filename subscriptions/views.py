from core.views import NoDeleteViewSet
from rest_framework.permissions import IsAuthenticated
from .models import SubscriptionPlan, StudentSubscription
from .serializers import SubscriptionPlanSerializer, StudentSubscriptionSerializer
from core.permissions import IsAdminOrReadOnly

class SubscriptionPlanViewSet(NoDeleteViewSet):
    permission_classes = [IsAdminOrReadOnly]
    serializer_class = SubscriptionPlanSerializer

    def get_queryset(self):
        queryset = SubscriptionPlan.objects.all().prefetch_related('pricing_grid', 'subjects')
        branch_id = self.request.query_params.get('branch')
        status = self.request.query_params.get('status')

        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        if status:
            queryset = queryset.filter(status=status)
        return queryset

class StudentSubscriptionViewSet(NoDeleteViewSet):
    permission_classes = [IsAdminOrReadOnly]
    serializer_class = StudentSubscriptionSerializer

    def get_queryset(self):
        queryset = StudentSubscription.objects.all().select_related('plan', 'subject')
        student_id = self.request.query_params.get('student')
        
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        return queryset