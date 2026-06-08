from django.utils import timezone
from rest_framework import serializers
from .models import Parent, Student, Group, StudentGroup

class ParentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Parent
        fields = ['id', 'name', 'phone', 'email', 'relationship']

class StudentSerializer(serializers.ModelSerializer):

    branch_name = serializers.CharField(source='branch.name', read_only=True)

    class Meta:
        model = Student
        fields = ['id', 'first_name', 'last_name', 'date_of_birth', 'phone', 'email', 'address', 'status', 'branch', 'branch_name', 'parent']

class GroupSerializer(serializers.ModelSerializer):

    branch_name = serializers.CharField(source='branch.name', read_only=True)

    students = serializers.PrimaryKeyRelatedField(
        many=True, 
        queryset=Student.objects.all(), 
        required=False
    )
    
    class Meta:
        model = Group
        fields = ['id', 'name', 'branch', 'branch_name', 'status', 'students']

    def create(self, validated_data):
        # дістаєом студентів з даних
        students_data = validated_data.pop('students', [])
        
        group = super().create(validated_data)
        
        # створюємо зв'язки
        for student in students_data:
            StudentGroup.objects.create(group=group, student=student)
            
        return group

    def update(self, instance, validated_data):
        if 'students' in validated_data:
            new_students = validated_data.pop('students')
            old_students = instance.students.all()
            
            # Шукаємо тих кого видалили
            for student in old_students:
                if student not in new_students:
                    student_group = StudentGroup.objects.filter(
                        group=instance, 
                        student=student, 
                        leave_date__isnull=True
                    ).first()
                    
                    # ставимо дату виходу замість видалення
                    if student_group:
                        student_group.leave_date = timezone.now().date()
                        student_group.save()
                        
            # Шукаємо тих кого додали
            for student in new_students:
                if student not in old_students:
                    StudentGroup.objects.create(group=instance, student=student)
                    
        # Оновлюємо поля
        return super().update(instance, validated_data)