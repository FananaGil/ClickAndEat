"""
Services for pedidos app.
"""

from django.db.models import Sum, Count, Avg
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from .models import Pedido, PedidoItem, Mensaje


class PedidoService:
    """
    Service class for pedido-related operations.
    """

    @staticmethod
    def get_pedido_by_id(pedido_id):
        """
        Get pedido by ID.
        """
        try:
            return Pedido.objects.get(id=pedido_id, is_deleted=False)
        except Pedido.DoesNotExist:
            return None

    @staticmethod
    def get_pedido_by_numero(numero_pedido):
        """
        Get pedido by numero.
        """
        try:
            return Pedido.objects.get(numero_pedido=numero_pedido, is_deleted=False)
        except Pedido.DoesNotExist:
            return None

    @staticmethod
    def get_pedidos_por_usuario(user_id):
        """
        Get all pedidos for a user.
        """
        return Pedido.objects.filter(
            usuario_id=user_id,
            is_deleted=False
        ).order_by('-created_at')

    @staticmethod
    def get_pedidos_por_tienda(tienda_id):
        """
        Get all pedidos for a tienda.
        """
        return Pedido.objects.filter(
            tienda_id=tienda_id,
            is_deleted=False
        ).order_by('-created_at')

    @staticmethod
    def get_pedidos_activos():
        """
        Get all active orders (not completed or cancelled).
        """
        return Pedido.objects.filter(
            is_deleted=False,
            estado__in=[
                Pedido.Estado.PENDIENTE_PAGO,
                Pedido.Estado.ESPERANDO_COMPROBANTE,
                Pedido.Estado.PAGADO,
                Pedido.Estado.CONFIRMADO,
                Pedido.Estado.PREPARANDO,
                Pedido.Estado.LISTO,
                Pedido.Estado.EN_CAMINO
            ]
        ).order_by('created_at')

    @staticmethod
    def get_estadisticas_pedidos(tienda_id=None, usuario_id=None, days=30):
        """
        Get order statistics.
        """
        fecha_inicio = timezone.now() - timedelta(days=days)

        queryset = Pedido.objects.filter(
            is_deleted=False,
            created_at__gte=fecha_inicio
        )

        if tienda_id:
            queryset = queryset.filter(tienda_id=tienda_id)
        if usuario_id:
            queryset = queryset.filter(usuario_id=usuario_id)

        total = queryset.count()
        completados = queryset.filter(estado=Pedido.Estado.COMPLETADO).count()
        cancelados = queryset.filter(estado=Pedido.Estado.CANCELADO).count()
        total_ventas = queryset.filter(
            estado=Pedido.Estado.COMPLETADO
        ).aggregate(total=Sum('total'))['total'] or Decimal('0')

        return {
            'total': total,
            'completados': completados,
            'cancelados': cancelados,
            'tasa_completacion': round((completados / total * 100) if total > 0 else 0, 2),
            'total_ventas': float(total_ventas),
            'pedidos_por_dia': total / days if days > 0 else 0
        }

    @staticmethod
    def update_tiempo_estimado(pedido_id, tiempo):
        """
        Update estimated time for an order.
        """
        try:
            pedido = Pedido.objects.get(id=pedido_id)
            pedido.tiempo_estimado = tiempo
            pedido.save(update_fields=['tiempo_estimado'])
            return pedido
        except Pedido.DoesNotExist:
            return None


class MensajeService:
    """
    Service class for mensaje-related operations.
    """

    @staticmethod
    def get_mensajes_por_pedido(pedido_id, unread_only=False):
        """
        Get all messages for a pedido.
        """
        queryset = Mensaje.objects.filter(
            pedido_id=pedido_id,
            is_deleted=False
        )

        if unread_only:
            queryset = queryset.filter(leido=False)

        return queryset.order_by('created_at')

    @staticmethod
    def mark_as_read(mensaje_id):
        """
        Mark a message as read.
        """
        try:
            mensaje = Mensaje.objects.get(id=mensaje_id)
            mensaje.leido = True
            mensaje.save(update_fields=['leido'])
            return mensaje
        except Mensaje.DoesNotExist:
            return None

    @staticmethod
    def mark_all_as_read(pedido_id, user):
        """
        Mark all messages in a pedido as read for a user.
        """
        Mensaje.objects.filter(
            pedido_id=pedido_id,
            emisor__isnull=False
        ).exclude(
            emisor=user
        ).update(leido=True)

    @staticmethod
    def get_unread_count(pedido_id, user):
        """
        Get unread message count for a pedido.
        """
        return Mensaje.objects.filter(
            pedido_id=pedido_id,
            leido=False
        ).exclude(emisor=user).count()

    @staticmethod
    def create_system_message(pedido_id, contenido):
        """
        Create a system message.
        """
        return Mensaje.objects.create(
            pedido_id=pedido_id,
            emisor=None,
            emisor_tipo='sistema',
            tipo='sistema',
            contenido=contenido
        )
