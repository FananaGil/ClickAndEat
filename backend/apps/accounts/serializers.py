"""
Serializers for accounts app.
"""

from rest_framework import serializers
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """
    Serializer for User model.
    """
    class Meta:
        model = User
        fields = [
            'id', 'email', 'telefono', 'nombre', 'rol',
            'tienda', 'disponible', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'rol', 'tienda', 'created_at', 'updated_at']


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )

    class Meta:
        model = User
        fields = ['email', 'password', 'password_confirm', 'nombre', 'telefono']

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Las contraseñas no coinciden.'
            })
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        user = User.objects.create_user(**validated_data)
        return user


class UserProfileSerializer(serializers.ModelSerializer):
    """
    Serializer for user profile.
    """
    class Meta:
        model = User
        fields = [
            'id', 'email', 'telefono', 'nombre', 'rol',
            'tienda', 'disponible', 'created_at'
        ]
        read_only_fields = ['id', 'email', 'rol', 'tienda', 'created_at']


class ChangePasswordSerializer(serializers.Serializer):
    """
    Serializer for password change.
    """
    old_password = serializers.CharField(
        required=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        required=True,
        style={'input_type': 'password'}
    )

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': 'Las nuevas contraseñas no coinciden.'
            })
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('La contraseña actual es incorrecta.')
        return value


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom token serializer that includes additional user data.
    """
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['email'] = user.email
        token['nombre'] = user.nombre
        token['rol'] = user.rol

        return token

    def validate(self, attrs):
        data = super().validate(attrs)

        # Add extra user data to response
        data['user'] = {
            'id': self.user.id,
            'email': self.user.email,
            'nombre': self.user.nombre,
            'rol': self.user.rol,
        }

        return data


class UserListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing users (limited fields).
    """
    class Meta:
        model = User
        fields = ['id', 'email', 'nombre', 'rol', 'disponible']
