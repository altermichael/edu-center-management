from rest_framework import viewsets, mixins
from rest_framework.permissions import IsAuthenticated
from .models import Branch, Subject
from .serializers import BranchSerializer, SubjectSerializer

class NoDeleteViewSet(mixins.CreateModelMixin,
                      mixins.RetrieveModelMixin,
                      mixins.UpdateModelMixin,
                      mixins.ListModelMixin,
                      viewsets.GenericViewSet):
    pass

class BranchViewSet(NoDeleteViewSet):
    queryset = Branch.objects.all()
    serializer_class = BranchSerializer
    permission_classes = [IsAuthenticated]

class SubjectViewSet(NoDeleteViewSet):
    queryset = Subject.objects.all()
    serializer_class = SubjectSerializer
    permission_classes = [IsAuthenticated]