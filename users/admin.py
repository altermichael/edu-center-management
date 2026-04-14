from django.contrib import admin
from .models import CustomUser

class CustomUserAdmin(admin.ModelAdmin):
    def save_model(self, request, obj, form, change):
        if obj.password and not obj.password.startswith('pbkdf2_'): #шифруємо звич тектс
            obj.set_password(obj.password)
        super().save_model(request, obj, form, change)

admin.site.register(CustomUser, CustomUserAdmin)