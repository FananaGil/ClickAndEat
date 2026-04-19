"""
Serializers for metrics app.
"""

from rest_framework import serializers
from apps.tiendas.models import Tienda
from apps.pedidos.models import Pedido
from apps.calificaciones.models import Calificacion


class MetricasDashboardSerializer(serializers.Serializer):
    """
    Serializer for dashboard metrics.
    """
    total_tiendas = serializers.IntegerField()
    tiendas_activas = serializers.IntegerField()
    total_pedidos_hoy = serializers.IntegerField()
    pedidos_hoy = serializers.IntegerField()
    ventas_hoy = serializers.DecimalField(max_digits=12, decimal_places=2)
    calificacion_promedio = serializers.DecimalField(max_digits=3, decimal_places=2)
    pedidos_pendientes = serializers.IntegerField()
    tiendas_suspendidas = serializers.IntegerField()


class TiendaMetricaSerializer(serializers.Serializer):
    """
    Serializer for individual store metrics.
    """
    id = serializers.UUIDField()
    nombre = serializers.CharField()
    slug = serializers.CharField()
    logo_url = serializers.URLField(allow_null=True)
    total_pedidos = serializers.IntegerField()
    ventas_totales = serializers.DecimalField(max_digits=12, decimal_places=2)
    ticket_promedio = serializers.DecimalField(max_digits=10, decimal_places=2)
    calificacion_promedio = serializers.DecimalField(max_digits=3, decimal_places=2)
    tiempo_promedio = serializers.DecimalField(max_digits=10, decimal_places=2)


class ResumenVentasSerializer(serializers.Serializer):
    """
    Serializer for sales summary.
    """
    periodo = serializers.CharField()
    total_ventas = serializers.DecimalField(max_digits=12, decimal_places=2)
    total_pedidos = serializers.IntegerField()
    ticket_promedio = serializers.DecimalField(max_digits=10, decimal_places=2)
    growth_percentage = serializers.DecimalField(max_digits=5, decimal_places=2, allow_null=True)


class PedidoMetricaSerializer(serializers.Serializer):
    """
    Serializer for order metrics.
    """
    estado = serializers.CharField()
    cantidad = serializers.IntegerField()
    porcentaje = serializers.DecimalField(max_digits=5, decimal_places=2)


class IncidenciaMetricaSerializer(serializers.Serializer):
    """
    Serializer for incident metrics.
    """
    tienda_id = serializers.UUIDField()
    tienda_nombre = serializers.CharField()
    total_incidencias = serializers.IntegerField()
    incidencias_pendientes = serializers.IntegerField()
    incidencias_resueltas = serializers.IntegerField()
