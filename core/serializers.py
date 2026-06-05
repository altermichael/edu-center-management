from rest_framework import serializers
from .models import Branch, Subject

class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = ['id', 'name', 'address', 'city', 'status']

class SubjectSerializer(serializers.ModelSerializer):

    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = Subject
        fields = ['id', 'name', 'branch', 'branch_name', 'status'] 
