"""
Models for tiendas app.
"""

from django.db import models
from django.utils import timezone
from core.models import SoftDeleteModel
from core.utils import generate_slug
from apps.accounts.models import User


class Tienda(SoftDeleteModel):
    """
    Model representing a store/restaurant in the platform.
    """
    nombre = models.CharField(max_length=100)
    slug = models.SlugField(unique=True, max_length=100)
    descripcion = models.TextField(blank=True)
    direccion = models.CharField(max_length=255)
    lat = models.DecimalField(max_digits=10, decimal_places=8)
    lng = models.DecimalField(max_digits=11, decimal_places=8)
    telefono = models.CharField(max_length=20)
    logo_url = models.URLField(blank=True)
    banner_url = models.URLField(blank=True)
    color_primario = models.CharField(max_length=7, default='#FF6B35')
    color_secundario = models.CharField(max_length=7, default='#1A535C')
    disponible = models.BooleanField(default=True)
    abierto = models.BooleanField(default=True)
    calificacion_servicio = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0
    )
    calificacion_comida = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0
    )
    calificacion_tiempo = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=0
    )
    num_calificaciones = models.IntegerField(default=0)
    tiempo_pickup = models.IntegerField(default=15)  # minutes
    tiempo_delivery = models.IntegerField(default=30)  # minutes
    tiempo_sitio = models.IntegerField(default=20)  # minutes
    costo_delivery = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )
    suspendido = models.BooleanField(default=False)
    motivo_suspension = models.TextField(blank=True)
    dueno = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='tiendas'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'tienda'
        verbose_name_plural = 'tiendas'
        ordering = ['-created_at']

    def __str__(self):
        return self.nombre

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = generate_slug(self.nombre)
        super().save(*args, **kwargs)

    def get_calificacion_promedio(self):
        """
        Calculate overall rating.
        """
        if self.num_calificaciones == 0:
            return 0
        return (
            float(self.calificacion_servicio) +
            float(self.calificacion_comida) +
            float(self.calificacion_tiempo)
        ) / 3

    def get_tiempo_estimado(self, tipo_servicio='delivery'):
        """
        Get estimated time based on service type.
        """
        if tipo_servicio == 'delivery':
            return self.tiempo_delivery
        elif tipo_servicio == 'pickup':
            return self.tiempo_pickup
        elif tipo_servicio == 'sitio':
            return self.tiempo_sitio
        return self.tiempo_delivery


class Categoria(SoftDeleteModel):
    """
    Model representing a menu category.
    """
    tienda = models.ForeignKey(
        Tienda,
        on_delete=models.CASCADE,
        related_name='categorias'
    )
    nombre = models.CharField(max_length=50)
    descripcion = models.CharField(max_length=255, blank=True)
    icono = models.CharField(max_length=50, blank=True)
    orden = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'categoria'
        verbose_name_plural = 'categorias'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return f'{self.tienda.nombre} - {self.nombre}'


class MenuItem(SoftDeleteModel):
    """
    Model representing a menu item.
    """
    tienda = models.ForeignKey(
        Tienda,
        on_delete=models.CASCADE,
        related_name='menu_items'
    )
    categoria = models.ForeignKey(
        Categoria,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='items'
    )
    nombre = models.CharField(max_length=100)
    descripcion = models.TextField(blank=True)
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    imagen_url = models.URLField(blank=True)
    disponible = models.BooleanField(default=True)
    orden = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'menu_item'
        verbose_name_plural = 'menu_items'
        ordering = ['orden', 'nombre']

    def __str__(self):
        return f'{self.tienda.nombre} - {self.nombre}'
