from rest_framework import serializers
from django.db.models import Q
from .models import LessonTemplate, Lesson, Attendance

class LessonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Lesson
        fields = [
            'id', 'teacher', 'subject', 'student', 'group', 
            'template', 'date', 'start_time', 'end_time', 'status'
        ]

    def validate(self, data):
       
        teacher = data.get('teacher')
        student = data.get('student')
        group = data.get('group')
        date = data.get('date')
        start_time = data.get('start_time')
        end_time = data.get('end_time')

        if student and group:
            raise serializers.ValidationError("Урок має бути АБО індивідуальним, АБО груповим. Не вказуйте обидва поля.")
        if not student and not group:
            raise serializers.ValidationError("Необхідно вказати студента АБО групу для уроку.")

        overlapping_lessons = Lesson.objects.filter(
            date=date
        ).exclude(status='CANCELLED')

        if self.instance:
            overlapping_lessons = overlapping_lessons.exclude(pk=self.instance.pk)

        # start_1 < end_2 AND start_2 < end_1 
        overlapping_lessons = overlapping_lessons.filter(
            start_time__lt=end_time, 
            end_time__gt=start_time 
        )

        # перевірка конфлікту для вчителя
        if overlapping_lessons.filter(teacher=teacher).exists():
            raise serializers.ValidationError({"teacher": "У цього вчителя вже є урок на цей час."})

        # перевірка конфлікту для студента
        if student:
            if overlapping_lessons.filter(Q(student=student) | Q(group__students=student)).exists():
                raise serializers.ValidationError({"student": "У цього студента вже є індивідуальний або груповий урок на цей час."})

        #первірка конфліктів для групи та її учасників
        if group:

            group_students = group.students.all()
            
            conflicting_lessons = overlapping_lessons.filter(
                Q(student__in=group_students) | Q(group__students__in=group_students)
            ).distinct()

            if conflicting_lessons.exists():
                raise serializers.ValidationError({"group": "Один або кілька студентів з цієї групи вже мають інший урок на цей час."})


        return data

class AttendanceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Attendance
        fields = ['id', 'lesson', 'student', 'status', 'note']

    def validate(self, data):
      
        lesson = data.get('lesson')

        if lesson.status == 'CANCELLED':
            raise serializers.ValidationError({"lesson": "Не можна відмічати відвідуваність на скасованому уроці."})
        return data

class LessonTemplateSerializer(serializers.ModelSerializer):
    class Meta:
        model = LessonTemplate
        fields = [
            'id', 'teacher', 'subject', 'student', 'group', 
            'days_of_week', 'start_time', 'end_time', 
            'start_date', 'end_date'
        ]

    def validate(self, data):
        student = data.get('student')
        group = data.get('group')
        start_date = data.get('start_date')
        end_date = data.get('end_date')
        start_time = data.get('start_time')
        end_time = data.get('end_time')

        # або студент, або група
        if student and group:
            raise serializers.ValidationError("Шаблон має бути АБО для індивідуального студента, АБО для групи. Не вказуйте обидва поля.")
        if not student and not group:
            raise serializers.ValidationError("Необхідно вказати студента АБО групу для створення шаблону.")

        # перевірка дат
        if start_date and end_date and start_date > end_date:
            raise serializers.ValidationError({"end_date": "Дата закінчення шаблону не може бути раніше дати початку."})
            
        # перевірка часу
        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError({"end_time": "Час закінчення уроку має бути пізніше часу початку."})

        return data