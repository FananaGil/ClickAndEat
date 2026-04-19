"""
URL configuration for accounts app.
"""

from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    TokenRefreshView,
    LogoutView,
    MeView,
    ChangePasswordView,
    UserListView,
    UserDetailView,
)

app_name = 'accounts'

urlpatterns = [
    # Authentication endpoints
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutView.as_view(), name='logout'),

    # User profile
    path('me/', MeView.as_view(), name='me'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),

    # Admin endpoints
    path('users/', UserListView.as_view(), name='user_list'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user_detail'),
]
