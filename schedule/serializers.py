from rest_framework import serializers
from django.db.models import Q
from .models import LessonTemplate, Lesson, Attendance
from datetime import timedelta

class LessonSerializer(serializers.ModelSerializer):

    teacher_name = serializers.CharField(source='teacher.get_full_name', read_only=True)
    subject_name = serializers.CharField(source='subject.name', read_only=True)
    group_name = serializers.CharField(source='group.name', read_only=True)
    student_name = serializers.SerializerMethodField()

    class Meta:
        model = Lesson
        fields = [
            'id', 'teacher', 'teacher_name', 'subject', 'subject_name', 
            'student', 'student_name', 'group', 'group_name', 
            'template', 'date', 'start_time', 'end_time', 'status'
        ]

    def get_student_name(self, obj):
        if obj.student:
            return f"{obj.student.first_name} {obj.student.last_name}"
        return None

    def validate(self, data):
       
        teacher = data.get('teacher')
        student = data.get('student')
        group = data.get('group')
        date = data.get('date')
        start_time = data.get('start_time')
        end_time = data.get('end_time')

        if start_time and end_time and start_time >= end_time:
            raise serializers.ValidationError({
                "end_time": "Час закінчення уроку має бути пізніше часу початку."
            })

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

        user = self.context['request'].user
        if getattr(user, 'role', '') == 'teacher' and lesson.teacher != user:
            raise serializers.ValidationError({"lesson": "Ви можете відмічати відвідуваність тільки на своїх уроках."})
    
        return data

    def create(self, validated_data):
        
        attendance = super().create(validated_data)
        
        lesson = attendance.lesson
        
        if lesson.status == 'SCHEDULED':
            lesson.status = 'COMPLETED'
            lesson.save()
            
        return attendance

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

    def create(self, validated_data):
        template = super().create(validated_data)
        
        try:
            valid_days = [int(d.strip()) for d in template.days_of_week.split(',')]
        except ValueError:
            valid_days = []
            
        current_date = template.start_date
        lessons_to_create = []
        
        while current_date <= template.end_date:
            if current_date.weekday() in valid_days:
                overlapping = Lesson.objects.filter(
                    date=current_date,
                    start_time__lt=template.end_time,
                    end_time__gt=template.start_time
                ).exclude(status='CANCELLED')
                
                conflict = overlapping.filter(teacher=template.teacher).exists()
                
                if not conflict and template.student:
                    conflict = overlapping.filter(Q(student=template.student) | Q(group__students=template.student)).exists()
                    
                if not conflict and template.group:
                    group_students = template.group.students.all()
                    conflict = overlapping.filter(Q(student__in=group_students) | Q(group__students__in=group_students)).exists()
                    
                if not conflict:
                    lessons_to_create.append(Lesson(
                        teacher=template.teacher,
                        subject=template.subject,
                        student=template.student,
                        group=template.group,
                        template=template,
                        date=current_date,
                        start_time=template.start_time,
                        end_time=template.end_time,
                        status='SCHEDULED'
                    ))
            current_date += timedelta(days=1)
            
        if lessons_to_create:
            Lesson.objects.bulk_create(lessons_to_create)
            
        return template