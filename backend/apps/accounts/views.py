"""
Views for accounts app.
"""

from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model

from .serializers import (
    UserSerializer,
    UserRegistrationSerializer,
    UserProfileSerializer,
    ChangePasswordSerializer,
    CustomTokenObtainPairSerializer,
)
from core.permissions import IsSuperAdmin

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """
    View for user registration.
    """
    queryset = User.objects.all()
    serializer_class = UserRegistrationSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        # Generate tokens for the new user
        refresh = RefreshToken.for_user(user)

        return Response({
            'user': UserSerializer(user).data,
            'tokens': {
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }
        }, status=status.HTTP_201_CREATED)


class LoginView(TokenObtainPairView):
    """
    View for user login with JWT.
    """
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]


class TokenRefreshView(TokenRefreshView):
    """
    View for refreshing JWT tokens.
    """
    permission_classes = [AllowAny]


class LogoutView(APIView):
    """
    View for user logout (blacklist refresh token).
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response({
                'message': 'Sesión cerrada exitosamente.'
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({
                'error': 'No se pudo cerrar la sesión.'
            }, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    """
    View for getting current user profile.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def put(self, request):
        serializer = UserProfileSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserProfileSerializer(
            request.user,
            data=request.data,
            partial=True
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class ChangePasswordView(APIView):
    """
    View for changing password.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        serializer.is_valid(raise_exception=True)

        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()

        return Response({
            'message': 'Contraseña actualizada exitosamente.'
        }, status=status.HTTP_200_OK)


class UserListView(generics.ListAPIView):
    """
    View for listing users (admin only).
    """
    queryset = User.objects.filter(is_deleted=False)
    serializer_class = UserListSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    View for retrieving, updating, and deleting users (admin only).
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def get_queryset(self):
        return User.objects.filter(is_deleted=False)

    def perform_destroy(self, instance):
        instance.delete()  # Soft delete
