from core.views import NoDeleteViewSet

from rest_framework.permissions import IsAuthenticated
from .models import LessonTemplate, Lesson, Attendance
from .serializers import LessonTemplateSerializer, LessonSerializer, AttendanceSerializer
from core.permissions import IsAdminOrReadOnly, IsAdminOrTeacherOfLesson

class LessonViewSet(NoDeleteViewSet):
    permission_classes = [IsAdminOrReadOnly]
    serializer_class = LessonSerializer

    def get_queryset(self):
        user = self.request.user
        
        if user.role == 'teacher':
            queryset = Lesson.objects.filter(teacher=user)
        else:
            queryset = Lesson.objects.all()
            
        queryset = queryset.select_related('teacher', 'subject', 'student', 'group')
        
        date = self.request.query_params.get('date')
        teacher_id = self.request.query_params.get('teacher')
        student_id = self.request.query_params.get('student')
        group_id = self.request.query_params.get('group')
        status = self.request.query_params.get('status')

        if date:
            queryset = queryset.filter(date=date)
        if teacher_id and user.role == 'admin':
            queryset = queryset.filter(teacher_id=teacher_id)
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        if group_id:
            queryset = queryset.filter(group_id=group_id)
        if status:
            queryset = queryset.filter(status=status)

        return queryset.order_by('date', 'start_time')

class AttendanceViewSet(NoDeleteViewSet):
    permission_classes = [IsAdminOrTeacherOfLesson]
    serializer_class = AttendanceSerializer

    def get_queryset(self):
        user = self.request.user
        
        if getattr(user, 'role', '') == 'teacher':
            queryset = Attendance.objects.filter(lesson__teacher=user)
        else:
            queryset = Attendance.objects.all()

        lesson_id = self.request.query_params.get('lesson')
        student_id = self.request.query_params.get('student')

        if lesson_id:
            queryset = queryset.filter(lesson_id=lesson_id)
        if student_id:
            queryset = queryset.filter(student_id=student_id)
        return queryset

class LessonTemplateViewSet(NoDeleteViewSet):
    permission_classes = [IsAdminOrReadOnly]
    queryset = LessonTemplate.objects.all()
    serializer_class = LessonTemplateSerializer
