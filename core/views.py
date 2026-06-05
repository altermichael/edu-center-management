from rest_framework import viewsets, mixins
from rest_framework.permissions import IsAuthenticated
from .models import Branch, Subject
from .serializers import BranchSerializer, SubjectSerializer
from core.permissions import IsAdminOrReadOnly

class NoDeleteViewSet(mixins.CreateModelMixin,
                      mixins.RetrieveModelMixin,
                      mixins.UpdateModelMixin,
                      mixins.ListModelMixin,
                      viewsets.GenericViewSet):
    pass

class BranchViewSet(NoDeleteViewSet):
    permission_classes = [IsAdminOrReadOnly]
    serializer_class = BranchSerializer

    def get_queryset(self):
        queryset = Branch.objects.all()
        status = self.request.query_params.get('status')
        search_query = self.request.query_params.get('search')

        if status:
            queryset = queryset.filter(status=status)
        if search_query:
            queryset = queryset.filter(name__icontains=search_query)
        return queryset

class SubjectViewSet(NoDeleteViewSet):
    permission_classes = [IsAdminOrReadOnly]
    serializer_class = SubjectSerializer

    def get_queryset(self):
        queryset = Subject.objects.select_related('branch').all()
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