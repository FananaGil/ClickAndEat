"""
Services for accounts app.
"""

from django.contrib.auth import get_user_model
from django.db.models import Q

User = get_user_model()


class UserService:
    """
    Service class for user-related operations.
    """

    @staticmethod
    def get_user_by_email(email):
        """
        Get user by email address.
        """
        try:
            return User.objects.get(email=email, is_deleted=False)
        except User.DoesNotExist:
            return None

    @staticmethod
    def get_user_by_id(user_id):
        """
        Get user by ID.
        """
        try:
            return User.objects.get(id=user_id, is_deleted=False)
        except User.DoesNotExist:
            return None

    @staticmethod
    def search_users(query):
        """
        Search users by name or email.
        """
        return User.objects.filter(
            Q(nombre__icontains=query) | Q(email__icontains=query),
            is_deleted=False
        )

    @staticmethod
    def get_tienda_empleados(tienda_id):
        """
        Get all employees of a tienda.
        """
        return User.objects.filter(
            tienda_id=tienda_id,
            is_deleted=False
        )

    @staticmethod
    def get_duenos():
        """
        Get all store owners.
        """
        return User.objects.filter(
            rol=User.Rol.DUENO,
            is_deleted=False
        )

    @staticmethod
    def update_user_availability(user_id, disponible):
        """
        Update user availability status.
        """
        try:
            user = User.objects.get(id=user_id)
            user.disponible = disponible
            user.save(update_fields=['disponible'])
            return user
        except User.DoesNotExist:
            return None

    @staticmethod
    def assign_tienda(user_id, tienda_id):
        """
        Assign a tienda to a user.
        """
        try:
            user = User.objects.get(id=user_id)
            user.tienda_id = tienda_id
            user.save(update_fields=['tienda'])
            return user
        except User.DoesNotExist:
            return None
