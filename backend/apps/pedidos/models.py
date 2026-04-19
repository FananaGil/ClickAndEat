"""
Models for pedidos app.
"""

from django.db import models
from django.utils import timezone
from core.models import SoftDeleteModel
from core.utils import generate_unique_number
from apps.accounts.models import User
from apps.tiendas.models import Tienda, MenuItem


class Pedido(SoftDeleteModel):
    """
    Model representing an order.
    """

    class TipoServicio(models.TextChoices):
        DELIVERY = 'delivery', 'Delivery'
        PICKUP = 'pickup', 'Pickup'
        SITIO = 'sitio', 'En Sitio'

    class Estado(models.TextChoices):
        PENDIENTE_PAGO = 'pendiente_pago', 'Pendiente de Pago'
        ESPERANDO_COMPROBANTE = 'esperando_comprobante', 'Esperando Comprobante'
        PAGADO = 'pagado', 'Pagado'
        CONFIRMADO = 'confirmado', 'Confirmado'
        PREPARANDO = 'preparando', 'Preparando'
        LISTO = 'listo', 'Listo'
        EN_CAMINO = 'en_camino', 'En Camino'
        COMPLETADO = 'completado', 'Completado'
        CANCELADO = 'cancelado', 'Cancelado'

    numero_pedido = models.CharField(max_length=20, unique=True, editable=False)
    usuario = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='pedidos'
    )
    tienda = models.ForeignKey(
        Tienda,
        on_delete=models.SET_NULL,
        null=True,
        related_name='pedidos'
    )
    tipo_servicio = models.CharField(
        max_length=20,
        choices=TipoServicio.choices,
        default=TipoServicio.DELIVERY
    )
    estado = models.CharField(
        max_length=30,
        choices=Estado.choices,
        default=Estado.PENDIENTE_PAGO
    )
    direccion_entrega = models.TextField(blank=True)
    lat_entrega = models.DecimalField(
        max_digits=10,
        decimal_places=8,
        null=True,
        blank=True
    )
    lng_entrega = models.DecimalField(
        max_digits=11,
        decimal_places=8,
        null=True,
        blank=True
    )
    subtotal = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )
    costo_delivery = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )
    total = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0
    )
    tiempo_estimado = models.IntegerField(null=True, blank=True)
    comentarios = models.TextField(blank=True)
    comprobante_url = models.URLField(blank=True)
    pago_confirmado = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'pedido'
        verbose_name_plural = 'pedidos'
        ordering = ['-created_at']

    def __str__(self):
        return f'{self.numero_pedido} - {self.usuario}'

    def save(self, *args, **kwargs):
        if not self.numero_pedido:
            self.numero_pedido = generate_unique_number('PED')
        super().save(*args, **kwargs)

    def calculate_totals(self):
        """
        Calculate subtotal, total, and delivery cost.
        """
        subtotal = sum(
            item.precio * item.cantidad
            for item in self.items.filter(is_deleted=False)
        )
        self.subtotal = subtotal
        if self.tipo_servicio == self.TipoServicio.DELIVERY:
            self.total = subtotal + self.costo_delivery
        else:
            self.total = subtotal
        return self.total

    def get_next_estados(self):
        """
        Get available next states based on current state.
        """
        flow = {
            self.Estado.PENDIENTE_PAGO: [
                self.Estado.ESPERANDO_COMPROBANTE,
                self.Estado.CANCELADO
            ],
            self.Estado.ESPERANDO_COMPROBANTE: [
                self.Estado.PAGADO,
                self.Estado.CANCELADO
            ],
            self.Estado.PAGADO: [
                self.Estado.CONFIRMADO,
                self.Estado.CANCELADO
            ],
            self.Estado.CONFIRMADO: [
                self.Estado.PREPARANDO,
                self.Estado.CANCELADO
            ],
            self.Estado.PREPARANDO: [
                self.Estado.LISTO,
                self.Estado.CANCELADO
            ],
            self.Estado.LISTO: [
                self.Estado.EN_CAMINO if self.tipo_servicio == self.TipoServicio.DELIVERY else self.Estado.COMPLETADO,
                self.Estado.CANCELADO
            ],
            self.Estado.EN_CAMINO: [
                self.Estado.COMPLETADO,
                self.Estado.CANCELADO
            ],
        }
        return flow.get(self.estado, [])

    def can_be_cancelled(self):
        """
        Check if the order can be cancelled.
        """
        return self.estado not in [
            self.Estado.COMPLETADO,
            self.Estado.CANCELADO,
            self.Estado.EN_CAMINO
        ]


class PedidoItem(SoftDeleteModel):
    """
    Model representing an item in an order.
    """
    pedido = models.ForeignKey(
        Pedido,
        on_delete=models.CASCADE,
        related_name='items'
    )
    menu_item = models.ForeignKey(
        MenuItem,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    nombre = models.CharField(max_length=100)  # Snapshot of item name
    precio = models.DecimalField(max_digits=10, decimal_places=2)
    cantidad = models.PositiveIntegerField(default=1)
    comentarios = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'pedido_item'
        verbose_name_plural = 'pedido_items'
        ordering = ['id']

    def __str__(self):
        return f'{self.nombre} x {self.cantidad}'

    def get_subtotal(self):
        """
        Get subtotal for this item.
        """
        return self.precio * self.cantidad


class Mensaje(SoftDeleteModel):
    """
    Model representing a message in an order conversation.
    """

    class EmisorTipo(models.TextChoices):
        USUARIO = 'usuario', 'Usuario'
        TIENDA = 'tienda', 'Tienda'
        SISTEMA = 'sistema', 'Sistema'

    class Tipo(models.TextChoices):
        TEXTO = 'texto', 'Texto'
        IMAGEN = 'imagen', 'Imagen'
        ARCHIVO = 'archivo', 'Archivo'
        SISTEMA = 'sistema', 'Sistema'

    pedido = models.ForeignKey(
        Pedido,
        on_delete=models.CASCADE,
        related_name='mensajes'
    )
    emisor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True
    )
    emisor_tipo = models.CharField(
        max_length=20,
        choices=EmisorTipo.choices,
        default=EmisorTipo.USUARIO
    )
    tipo = models.CharField(
        max_length=20,
        choices=Tipo.choices,
        default=Tipo.TEXTO
    )
    contenido = models.TextField()
    archivo_url = models.URLField(blank=True)
    leido = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'mensaje'
        verbose_name_plural = 'mensajes'
        ordering = ['created_at']

    def __str__(self):
        return f'{self.emisor} - {self.pedido.numero_pedido}'
