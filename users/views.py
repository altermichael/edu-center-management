# from django.contrib.auth import authenticate, login, logout
# from django.shortcuts import render, redirect
# from django.contrib.auth.decorators import login_required
# from django.contrib.auth import get_user_model
# from core.models import Branch
# from students.models import Student, Group

from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import CustomTokenObtainPairSerializer
from rest_framework import viewsets
from django.contrib.auth import get_user_model
from .serializers import UserSerializer
from rest_framework.permissions import AllowAny
from django.db.models import Q
from core.permissions import IsAdminOrReadOnly

class CustomTokenObtainPairView(TokenObtainPairView):
    permission_classes = [AllowAny]
    serializer_class = CustomTokenObtainPairSerializer

User = get_user_model()

class UserViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAdminOrReadOnly]
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_queryset(self):
        queryset = User.objects.all()
        role = self.request.query_params.get('role', None)
        search = self.request.query_params.get('search', None)
        
        if role:
            queryset = queryset.filter(role=role)
        if search:
            queryset = queryset.filter(Q(first_name__icontains=search) | Q(last_name__icontains=search))
            
        return queryset

from django.http import HttpResponse
from django.contrib.auth import get_user_model

def create_first_admin(request):
    User = get_user_model()
    
    # Зверни увагу: якщо твоє поле називається phone_number, а не phone - зміни його тут!
    admin_phone = '+380991112233' 
    admin_password = 'SuperPassword123!'
    
    if not User.objects.filter(phone=admin_phone).exists():
        # Передай сюди всі обов'язкові поля твоєї моделі (наприклад, role='ADMIN')
        User.objects.create_superuser(
            phone=admin_phone, 
            password=admin_password,
            first_name='Головний',
            last_name='Адмін',
            role='ADMIN' # Якщо у вас роль обов'язкова
        )
        return HttpResponse(f"Суперкористувача {admin_phone} успішно створено! Пароль: {admin_password} <br><br>🚨 ТЕПЕР ОБОВ'ЯЗКОВО ВИДАЛИ ЦЕЙ КОД!")
    
    return HttpResponse("Суперкористувач вже існує.")

# def login_view(request):
#     if request.method == 'POST':
#         phone = request.POST.get('phone')
#         password = request.POST.get('password')
        
#         user = authenticate(request, phone=phone, password=password)
        
#         if user is not None:
#             login(request, user)
#             return redirect('dashboard')
#         else:
#             return render(request, 'users/login.html', {
#                 'error': 'Невірний номер телефону або пароль'
#             })
            
#     return render(request, 'users/login.html')

# def logout_view(request):
#     logout(request)
#     return redirect('login')

# @login_required(login_url='/login/')
# def dashboard(request):
#     if request.user.role == 'admin':
#         teachers = get_user_model().objects.filter(role='teacher')
        
#         branches = Branch.objects.all()
#         student_count = Student.objects.count()
        
#         return render(request, 'users/admin_dashboard.html', {
#             'teachers': teachers,
#             'branches': branches,
#             'student_count': student_count,
#         })
#     else:
#         return render(request, 'users/teacher_dashboard.html')