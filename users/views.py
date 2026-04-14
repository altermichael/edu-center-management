from django.contrib.auth import authenticate, login, logout
from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib.auth import get_user_model
from core.models import Branch, Student, Group

def login_view(request):
    if request.method == 'POST':
        phone = request.POST.get('phone')
        password = request.POST.get('password')
        
        user = authenticate(request, phone=phone, password=password)
        
        if user is not None:
            login(request, user)
            return redirect('dashboard')
        else:
            return render(request, 'users/login.html', {
                'error': 'Невірний номер телефону або пароль'
            })
            
    return render(request, 'users/login.html')

def logout_view(request):
    logout(request)
    return redirect('login')

@login_required(login_url='/login/')
def dashboard(request):
    if request.user.role == 'admin':
        teachers = get_user_model().objects.filter(role='teacher')
        
        branches = Branch.objects.all()
        student_count = Student.objects.count()
        
        return render(request, 'users/admin_dashboard.html', {
            'teachers': teachers,
            'branches': branches,
            'student_count': student_count,
        })
    else:
        return render(request, 'users/teacher_dashboard.html')