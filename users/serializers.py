from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework import serializers
from django.contrib.auth import get_user_model

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = user.role
        return token


User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'phone', 'first_name', 'last_name', 'role', 'password', 'branches']
        extra_kwargs = {'password': {'write_only': True, 'required': False}}

    def create(self, validated_data):
        branches = validated_data.pop('branches', [])
        password = validated_data.pop('password', None)
        user = User(**validated_data)
        if password:
            user.set_password(password)
        user.save()

        if branches:
            user.branches.set(branches)
        return user

    def update(self, instance, validated_data):
        branches = validated_data.pop('branches', None)
        password = validated_data.pop('password', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if password:
            instance.set_password(password)
        instance.save()

        if branches is not None:
            instance.branches.set(branches)
        return instance