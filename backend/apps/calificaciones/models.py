"""
Models for calificaciones app.
"""

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from core.models import SoftDeleteModel
from apps.accounts.models import User
from apps.tiendas.models import Tienda
from apps.pedidos.models import Pedido


class Calificacion(SoftDeleteModel):
    """
    Model representing a rating/evaluation for a store order.
    """
    pedido = models.OneToOneField(
        Pedido,
        on_delete=models.CASCADE,
        related_name='calificacion',
        null=True,
        blank=True
    )
    usuario = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='calificaciones'
    )
    tienda = models.ForeignKey(
        Tienda,
        on_delete=models.SET_NULL,
        null=True,
        related_name='calificaciones'
    )
    # Individual ratings (1-5 scale)
    rating_servicio = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text='Rating for service quality'
    )
    rating_comida = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text='Rating for food quality'
    )
    rating_tiempo = models.IntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text='Rating for delivery/wait time'
    )
    # Comment
    comentario = models.TextField(
        blank=True,
        help_text='Optional user comment'
    )
    # Validity flag
    valido = models.BooleanField(
        default=True,
        help_text='Whether this rating is valid'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'calificacion'
        verbose_name_plural = 'calificaciones'
        ordering = ['-created_at']
        # Only one rating per order
        constraints = [
            models.UniqueConstraint(
                fields=['pedido'],
                name='unique_rating_per_order'
            )
        ]

    def __str__(self):
        return f'Calificación {self.id} - {self.tienda}'

    def get_promedio(self):
        """
        Calculate the average rating across all categories.
        """
        return (
            self.rating_servicio +
            self.rating_comida +
            self.rating_tiempo
        ) / 3.0

    def save(self, *args, **kwargs):
        """
        Override save to update the average rating on the related store.
        """
        super().save(*args, **kwargs)
        self.actualizar_calificaciones_tienda()

    def actualizar_calificaciones_tienda(self):
        """
        Update the aggregate ratings on the related store.
        """
        if self.tienda:
            calificaciones = Calificacion.objects.filter(
                tienda=self.tienda,
                is_deleted=False,
                valido=True
            )

            if calificaciones.exists():
                self.tienda.calificacion_servicio = calificaciones.avg('rating_servicio')
                self.tienda.calificacion_comida = calificaciones.avg('rating_comida')
                self.tienda.calificacion_tiempo = calificaciones.avg('rating_tiempo')
                self.tienda.num_calificaciones = calificaciones.count()
            else:
                self.tienda.calificacion_servicio = 0
                self.tienda.calificacion_comida = 0
                self.tienda.calificacion_tiempo = 0
                self.tienda.num_calificaciones = 0

            self.tienda.save(update_fields=[
                'calificacion_servicio',
                'calificacion_comida',
                'calificacion_tiempo',
                'num_calificaciones',
                'updated_at'
            ])


class RespuestaCalificacion(models.Model):
    """
    Model representing a store owner's response to a rating.
    """
    calificacion = models.OneToOneField(
        Calificacion,
        on_delete=models.CASCADE,
        related_name='respuesta'
    )
    usuario = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='respuestas_calificaciones'
    )
    contenido = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'respuesta_calificacion'
        verbose_name_plural = 'respuestas_calificaciones'
        ordering = ['-created_at']

    def __str__(self):
        return f'Respuesta a {self.calificacion}'
