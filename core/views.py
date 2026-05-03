from rest_framework import viewsets
from .models import Branch, Subject
from .serializers import BranchSerializer, SubjectSerializer
from rest_framework.permissions import IsAuthenticated

class BranchViewSet(viewsets.ModelViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [IsAuthenticated]

class SubjectViewSet(viewsets.ModelViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated]