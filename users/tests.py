from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model

User = get_user_model()

class LoginTests(APITestCase):
    def test_inactive_user_cannot_log_in(self):
        self.inactive_user = User.objects.create_user(
            phone='+380999999999', 
            password='secretpassword123',
            is_active=False
        )
        
        data = {
            'phone': '+380999999999',
            'password': 'secretpassword123'
        }
        url = '/api/v1/auth/login/' 
        response = self.client.post(url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        
        error_message = str(response.data).lower()
        self.assertNotIn('phone', error_message)