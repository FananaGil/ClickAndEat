"""
Models for accounts app.
"""

from django.db import models
from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin, BaseUserManager
from django.utils import timezone
from core.models import SoftDeleteModel


class UserManager(BaseUserManager):
    """
    Custom user manager for User model.
    """
    def create_user(self, email, password=None, **extra_fields):
        """
        Create and save a regular user with the given email and password.
        """
        if not email:
            raise ValueError('The Email field must be set')

        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        """
        Create and save a superuser with the given email and password.
        """
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('rol', 'superadmin')

        if extra_fields.get('is_staff') is not True:
            raise ValueError('Superuser must have is_staff=True.')
        if extra_fields.get('is_superuser') is not True:
            raise ValueError('Superuser must have is_superuser=True.')

        return self.create_user(email, password, **extra_fields)


class User(SoftDeleteModel, AbstractBaseUser, PermissionsMixin):
    """
    Custom user model for CLICK&EAT.
    """
    class Rol(models.IntegerChoices):
        USUARIO = 1, 'usuario'
        DUENO = 2, 'dueno'
        SUPERADMIN = 3, 'superadmin'

    email = models.EmailField(
        'email',
        unique=True,
        max_length=255,
        error_messages={
            'unique': 'Ya existe un usuario con este email.',
        }
    )
    telefono = models.CharField(max_length=20, blank=True)
    nombre = models.CharField(max_length=100)
    rol = models.IntegerField(choices=Rol.choices, default=Rol.USUARIO)
    tienda = models.ForeignKey(
        'tiendas.Tienda',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='empleados'
    )
    disponible = models.BooleanField(default=True)
    last_login = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Required fields for AbstractBaseUser
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = UserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['nombre']

    class Meta:
        verbose_name = 'usuario'
        verbose_name_plural = 'usuarios'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.nombre} ({self.email})'

    def get_full_name(self):
        return self.nombre

    def get_short_name(self):
        return self.nombre.split()[0] if self.nombre else self.email.split('@')[0]

    def update_last_login(self):
        self.last_login = timezone.now()
        self.save(update_fields=['last_login'])

    @property
    def is_usuario(self):
        return self.rol == self.Rol.USUARIO

    @property
    def is_dueno(self):
        return self.rol == self.Rol.DUENO

    @property
    def is_superadmin(self):
        return self.rol == self.Rol.SUPERADMIN

    def can_manage_tienda(self, tienda):
        """Check if user can manage a specific tienda."""
        if self.is_superadmin:
            return True
        if self.is_dueno and self.tienda == tienda:
            return True
        return False
