from rest_framework import serializers
from .models import Parent, Student, Group

class ParentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Parent
        fields = ['id', 'name', 'phone', 'email', 'relationship']

class StudentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Student
        fields = [
            'id', 'first_name', 'last_name', 'date_of_birth', 
            'phone', 'email', 'address', 'status', 
            'branch', 'parent'
        ]

class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ['id', 'name', 'branch', 'status', 'students']