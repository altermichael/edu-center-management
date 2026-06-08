from core.views import NoDeleteViewSet

from rest_framework.views import APIView
from rest_framework.response import Response

from rest_framework.permissions import IsAuthenticated
from .models import LessonTemplate, Lesson, Attendance
from students.models import Student
from .serializers import LessonTemplateSerializer, LessonSerializer, AttendanceSerializer, BranchStatisticsSerializer
from core.permissions import IsAdminOrReadOnly, IsAdminOrTeacherOfLesson, IsAdminUser
from django.db.models import Q

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
        branch_id = self.request.query_params.get('branch')

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

        if branch_id:
            queryset = queryset.filter(
                Q(subject__branch_id=branch_id) |
                Q(student__branch_id=branch_id) |
                Q(group__branch_id=branch_id)
            )

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

class BranchStatisticsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        branch_id = request.query_params.get('branch')
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        students = Student.objects.filter(status='ACTIVE')
        lessons = Lesson.objects.all()
        
        if branch_id:
            students = students.filter(branch_id=branch_id)
            lessons = lessons.filter(subject__branch_id=branch_id)
        if start_date:
            lessons = lessons.filter(date__gte=start_date)
        if end_date:
            lessons = lessons.filter(date__lte=end_date)
            
        active_students = students.count()
        completed_lessons = lessons.filter(status='COMPLETED').count()
        cancelled_lessons = lessons.filter(status='CANCELLED').count()
        
        attendances = Attendance.objects.filter(lesson__in=lessons)
        total_records = attendances.count()
        present_records = attendances.filter(status='PRESENT').count()
        
        attendance_percent = (present_records / total_records * 100) if total_records > 0 else 0
        
        data = {
            'active_students': active_students,
            'completed_lessons': completed_lessons,
            'cancelled_lessons': cancelled_lessons,
            'attendance_percent': round(attendance_percent, 1)
        }
        
        serializer = BranchStatisticsSerializer(data)
        return Response(serializer.data)