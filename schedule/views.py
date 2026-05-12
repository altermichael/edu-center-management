from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import LessonTemplate, Lesson, Attendance
from .serializers import LessonTemplateSerializer, LessonSerializer, AttendanceSerializer

class LessonViewSet(viewsets.ModelViewSet):
    serializer_class = LessonSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Lesson.objects.all()
        
        date = self.request.query_params.get('date')
        teacher_id = self.request.query_params.get('teacher')
        student_id = self.request.query_params.get('student')
        group_id = self.request.query_params.get('group')
        status = self.request.query_params.get('status')

        if date:
            queryset = queryset.filter(date=date)
        if teacher_id:
            queryset = queryset.filter(teacher_id=teacher_id)
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if group_id:
            queryset = queryset.filter(group_id=group_id)
        if status:
            queryset = queryset.filter(status=status)

        return queryset

class AttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Attendance.objects.all()
        
        lesson_id = self.request.query_params.get('lesson')
        student_id = self.request.query_params.get('student')
        status = self.request.query_params.get('status')

        if lesson_id:
            queryset = queryset.filter(lesson_id=lesson_id)
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if status:
            queryset = queryset.filter(status=status)

        return queryset

class LessonTemplateViewSet(viewsets.ModelViewSet):
    queryset = LessonTemplate.objects.all()
    serializer_class = LessonTemplateSerializer
    permission_classes = [IsAuthenticated]