from rest_framework.test import APITestCase
from rest_framework import status
from django.urls import reverse
from django.contrib.auth import get_user_model
from core.models import Branch, Subject
from students.models import Student
from .models import Lesson, Attendance

User = get_user_model()

class LessonConflictAPITests(APITestCase):
    def setUp(self):
        self.branch = Branch.objects.create(name='Main Branch', city='Kyiv')
        self.subject = Subject.objects.create(name='Math', branch=self.branch)
        self.teacher = User.objects.create_user(phone='+380991111111', password='password123')
        self.student = Student.objects.create(
            first_name='Ivan', last_name='Ivanov', branch=self.branch, phone='+380992222222'
        )
        
        self.admin = User.objects.create_superuser(phone='+380990000000', password='adminpassword')
        
        self.client.force_authenticate(user=self.admin)
        
        self.url = reverse('lesson-list')

        self.existing_lesson = Lesson.objects.create(
            teacher=self.teacher,
            subject=self.subject,
            student=self.student,
            date='2026-05-01',
            start_time='10:00:00',
            end_time='11:00:00',
            status='SCHEDULED'
        )

    def test_overlapping_lessons_are_a_conflict(self):
        data = {
            'teacher': self.teacher.id,
            'subject': self.subject.id,
            'student': self.student.id,
            'date': '2026-05-01',
            'start_time': '10:30:00',
            'end_time': '11:30:00'
        }
        response = self.client.post(self.url, data, format='json')

        # ASSERT
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('teacher', response.data)
        self.assertEqual(Lesson.objects.count(), 1)

    def test_exact_same_time_is_a_conflict(self):
        data = {
            'teacher': self.teacher.id,
            'subject': self.subject.id,
            'student': self.student.id,
            'date': '2026-05-01',
            'start_time': '10:00:00',
            'end_time': '11:00:00'
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Lesson.objects.count(), 1)

    def test_back_to_back_lessons_do_not_conflict(self):
        data = {
            'teacher': self.teacher.id,
            'subject': self.subject.id,
            'student': self.student.id,
            'date': '2026-05-01',
            'start_time': '11:00:00',
            'end_time': '12:00:00'
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Lesson.objects.count(), 2) # Урок успішно створено

    def test_cancelled_lessons_dont_block_new_ones(self):
        self.existing_lesson.status = 'CANCELLED'
        self.existing_lesson.save()

        data = {
            'teacher': self.teacher.id,
            'subject': self.subject.id,
            'student': self.student.id,
            'date': '2026-05-01',
            'start_time': '10:00:00',
            'end_time': '11:00:00'
        }
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Lesson.objects.count(), 2)



class LessonOptimizationTests(APITestCase):
    def setUp(self):
        self.branch = Branch.objects.create(name='Main Branch', city='Kyiv')
        self.subject = Subject.objects.create(name='Math', branch=self.branch)
        self.teacher = User.objects.create_user(phone='+380991111111', password='password123')
        self.student = Student.objects.create(
            first_name='Ivan', last_name='Ivanov', branch=self.branch, phone='+380992222222'
        )
        
        self.client.force_authenticate(user=self.teacher)
        self.url = reverse('lesson-list')

        for i in range(20):
            Lesson.objects.create(
                teacher=self.teacher,
                subject=self.subject,
                student=self.student,
                date='2026-05-01',
                start_time=f'{i:02d}:00:00',
                end_time=f'{i:02d}:45:00',
                status='SCHEDULED'
            )

    def test_lesson_list_uses_constant_queries(self):
        with self.assertNumQueries(2):
            response = self.client.get(self.url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)



class AttendanceAPITests(APITestCase):
    def setUp(self):
        self.branch = Branch.objects.create(name='Main Branch', city='Kyiv')
        self.subject = Subject.objects.create(name='Math', branch=self.branch)
        self.teacher = User.objects.create_user(phone='+380993333333', password='password123')
        self.student = Student.objects.create(
            first_name='Anna', last_name='Petrova', branch=self.branch, phone='+380994444444'
        )
        
        self.client.force_authenticate(user=self.teacher)
        self.url = reverse('attendance-list')

        self.cancelled_lesson = Lesson.objects.create(
            teacher=self.teacher,
            subject=self.subject,
            student=self.student,
            date='2026-05-02',
            start_time='12:00:00',
            end_time='13:00:00',
            status='CANCELLED'
        )

    def test_cannot_mark_attendance_on_cancelled_lesson(self):
        data = {
            'lesson': self.cancelled_lesson.id,
            'student': self.student.id,
            'status': 'PRESENT',
            'note': 'Прийшла, але урок був скасований'
        }
        
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('lesson', response.data)
        self.assertEqual(Attendance.objects.count(), 0)



class PermissionAPITests(APITestCase):
    def setUp(self):
        self.branch = Branch.objects.create(name='Main Branch', city='Kyiv')
        self.subject = Subject.objects.create(name='Math', branch=self.branch)
        self.student = Student.objects.create(
            first_name='Ivan', last_name='Ivanov', branch=self.branch, phone='+380992222222'
        )
        
        self.teacher = User.objects.create_user(phone='+380995555555', password='password123')
        self.url = reverse('lesson-list')

    def test_teacher_gets_403_when_creating_lesson(self):
        self.client.force_authenticate(user=self.teacher)
        
        data = {
            'teacher': self.teacher.id,
            'subject': self.subject.id,
            'student': self.student.id,
            'date': '2026-05-01',
            'start_time': '10:00:00',
            'end_time': '11:00:00'
        }
        
        response = self.client.post(self.url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(Lesson.objects.count(), 0)