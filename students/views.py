from core.views import NoDeleteViewSet
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Parent, Student, Group
from .serializers import ParentSerializer, StudentSerializer, GroupSerializer
from core.permissions import IsAdminOrReadOnly

class ParentViewSet(NoDeleteViewSet):
    permission_classes = [IsAdminOrReadOnly]
    queryset = Parent.objects.all()
    serializer_class = ParentSerializer

class StudentViewSet(NoDeleteViewSet):
    permission_classes = [IsAdminOrReadOnly]
    serializer_class = StudentSerializer

    def get_queryset(self):

        queryset = Student.objects.select_related('branch', 'parent').all()
        
        branch_id = self.request.query_params.get('branch')
        status = self.request.query_params.get('status')
        group_id = self.request.query_params.get('group')
        search_query = self.request.query_params.get('search')

        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        if status:
            queryset = queryset.filter(status=status)
        if group_id:
            queryset = queryset.filter(study_groups__id=group_id)

        if search_query:
            queryset = queryset.filter(
                Q(first_name__icontains=search_query) | 
                Q(last_name__icontains=search_query)
            )

        return queryset

class GroupViewSet(NoDeleteViewSet):
    permission_classes = [IsAdminOrReadOnly]
    serializer_class = GroupSerializer

    def get_queryset(self):

        queryset = Group.objects.select_related('branch').prefetch_related('students').all()
        
        branch_id = self.request.query_params.get('branch')
        status = self.request.query_params.get('status')
        search_query = self.request.query_params.get('search')

        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
            
        if status:
            queryset = queryset.filter(status=status)
            
        if search_query:
            queryset = queryset.filter(name__icontains=search_query)

        return queryset