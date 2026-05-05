from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from django.db.models import Q
from .models import Parent, Student, Group
from .serializers import ParentSerializer, StudentSerializer, GroupSerializer

class ParentViewSet(viewsets.ModelViewSet):
    queryset = Parent.objects.all()
    serializer_class = ParentSerializer
    permission_classes = [IsAuthenticated]

class StudentViewSet(viewsets.ModelViewSet):
    serializer_class = StudentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        queryset = Student.objects.all()
        
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

class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all()
    serializer_class = GroupSerializer
    permission_classes = [IsAuthenticated]