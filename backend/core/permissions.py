"""
Custom permissions for CLICK&EAT project.
"""

from rest_framework import permissions


class IsOwner(permissions.BasePermission):
    """
    Permission that allows only owners of an object to access it.
    """
    def has_object_permission(self, request, view, obj):
        # Check if the object has a 'usuario' field (owner)
        if hasattr(obj, 'usuario'):
            return obj.usuario == request.user
        # Check if the object has a 'user' field
        if hasattr(obj, 'user'):
            return obj.user == request.user
        # Check if the object has a 'owner' field
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        return False


class IsTiendaOwner(permissions.BasePermission):
    """
    Permission that allows only the owner of a tienda to access it.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.rol in ['dueno', 'superadmin']

    def has_object_permission(self, request, view, obj):
        # If user is superadmin, allow access
        if request.user.rol == 'superadmin':
            return True
        # Check if the user owns the tienda
        if hasattr(obj, 'tienda'):
            return obj.tienda.dueno == request.user
        if hasattr(obj, 'dueno'):
            return obj.dueno == request.user
        return False


class IsSuperAdmin(permissions.BasePermission):
    """
    Permission that allows only superadmin users.
    """
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.rol == 'superadmin'


class IsAuthenticated(permissions.BasePermission):
    """
    Permission that allows only authenticated users.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Permission that allows owners to edit, but everyone can read.
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if hasattr(obj, 'usuario'):
            return obj.usuario == request.user
        if hasattr(obj, 'user'):
            return obj.user == request.user
        if hasattr(obj, 'dueno'):
            return obj.dueno == request.user
        return False


class IsTiendaOwnerOrCustomer(permissions.BasePermission):
    """
    Permission that allows tienda owners to access their own tienda data,
    and customers to access their own related data.
    """
    def has_object_permission(self, request, view, obj):
        user = request.user

        # Superadmin can access everything
        if user.rol == 'superadmin':
            return True

        # If the object is a Tienda, check if user is the owner
        if hasattr(obj, 'dueno') and obj.dueno == user:
            return True

        # If the object has a tienda, check if user is the owner of that tienda
        if hasattr(obj, 'tienda') and hasattr(obj.tienda, 'dueno'):
            if obj.tienda.dueno == user:
                return True

        # If the object has a usuario, check if user is that usuario
        if hasattr(obj, 'usuario') and obj.usuario == user:
            return True

        return False


class AllowAny(permissions.BasePermission):
    """
    Permission that allows any access.
    """
    def has_permission(self, request, view):
        return True


class ReadOnly(permissions.BasePermission):
    """
    Permission that only allows read operations.
    """
    def has_permission(self, request, view):
        return request.method in permissions.SAFE_METHODS
