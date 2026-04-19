"""
Views for metrics app.
"""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Avg, Sum, Count, F, Q
from django.db.models.functions import Coalesce
from django.utils import timezone
from datetime import timedelta
import csv
from django.http import HttpResponse

from core.permissions import IsSuperAdmin
from apps.tiendas.models import Tienda
from apps.pedidos.models import Pedido
from apps.calificaciones.models import Calificacion
from .serializers import (
    MetricasDashboardSerializer,
    TiendaMetricaSerializer,
    ResumenVentasSerializer,
    PedidoMetricaSerializer,
)


class MetricsViewSet(viewsets.ViewSet):
    """
    ViewSet for dashboard metrics.
    """
    permission_classes = [IsAuthenticated, IsSuperAdmin]

    def list(self, request):
        """
        Get dashboard metrics.
        """
        hoy = timezone.now().date()
        inicio_dia = timezone.now().replace(hour=0, minute=0, second=0, microsecond=0)

        # Total stores
        total_tiendas = Tienda.objects.filter(is_deleted=False).count()
        tiendas_activas = Tienda.objects.filter(
            is_deleted=False,
            disponible=True,
            abierto=True
        ).count()
        tiendas_suspendidas = Tienda.objects.filter(
            is_deleted=False,
            suspendido=True
        ).count()

        # Today's orders
        pedidos_hoy = Pedido.objects.filter(
            created_at__gte=inicio_dia,
            is_deleted=False
        ).count()

        # Today's sales
        ventas_data = Pedido.objects.filter(
            created_at__gte=inicio_dia,
            is_deleted=False,
            estado__in=['completado', 'pagado', 'confirmado', 'preparando', 'listo', 'en_camino']
        ).aggregate(
            total=Coalesce(Sum('total'), 0)
        )
        ventas_hoy = ventas_data['total']

        # Pending orders
        pedidos_pendientes = Pedido.objects.filter(
            estado__in=['pendiente_pago', 'esperando_comprobante', 'confirmado', 'preparando'],
            is_deleted=False
        ).count()

        # Average rating
        rating_data = Calificacion.objects.filter(
            is_deleted=False,
            valido=True
        ).aggregate(
            avg=Coalesce(Avg('rating_servicio'), 0)
        )
        calificacion_promedio = rating_data['avg']

        data = {
            'total_tiendas': total_tiendas,
            'tiendas_activas': tiendas_activas,
            'total_pedidos_hoy': pedidos_hoy,
            'pedidos_hoy': pedidos_hoy,
            'ventas_hoy': ventas_hoy,
            'calificacion_promedio': round(float(calificacion_promedio), 2),
            'pedidos_pendientes': pedidos_pendientes,
            'tiendas_suspendidas': tiendas_suspendidas,
        }

        serializer = MetricasDashboardSerializer(data)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def tiendas_top(self, request):
        """
        Get top performing stores by orders or sales.
        """
        metric_type = request.query_params.get('tipo', 'pedidos')  # 'pedidos' or 'ventas'
        periodo = request.query_params.get('periodo', 'semana')  # 'dia', 'semana', 'mes'
        limite = int(request.query_params.get('limite', 10))

        # Calculate date range
        hoy = timezone.now().date()
        if periodo == 'dia':
            fecha_inicio = hoy
        elif periodo == 'semana':
            fecha_inicio = hoy - timedelta(days=7)
        else:  # mes
            fecha_inicio = hoy - timedelta(days=30)

        fecha_inicio_dt = timezone.make_aware(
            timezone.datetime.combine(fecha_inicio, timezone.datetime.min.time())
        )

        # Get stores with metrics
        tiendas = Tienda.objects.filter(
            is_deleted=False
        ).annotate(
            total_pedidos=Count(
                'pedidos',
                filter=Q(
                    pedidos__created_at__gte=fecha_inicio_dt,
                    pedidos__is_deleted=False
                )
            ),
            ventas_totales=Coalesce(
                Sum(
                    'pedidos__total',
                    filter=Q(
                        pedidos__created_at__gte=fecha_inicio_dt,
                        pedidos__is_deleted=False,
                        pedidos__estado__in=['completado', 'pagado', 'confirmado', 'preparando', 'listo', 'en_camino']
                    )
                ),
                0
            ),
            calificacion_promedio=Coalesce(
                Avg(
                    'calificaciones__rating_servicio',
                    filter=Q(calificaciones__is_deleted=False, calificaciones__valido=True)
                ),
                0
            )
        )

        # Sort by metric type
        if metric_type == 'ventas':
            tiendas = tiendas.order_by('-ventas_totales')
        else:
            tiendas = tiendas.order_by('-total_pedidos')

        tiendas = tiendas[:limite]

        result = []
        for tienda in tiendas:
            ticket_promedio = (
                float(tienda.ventas_totales) / tienda.total_pedidos
                if tienda.total_pedidos > 0 else 0
            )
            result.append({
                'id': tienda.id,
                'nombre': tienda.nombre,
                'slug': tienda.slug,
                'logo_url': tienda.logo_url,
                'total_pedidos': tienda.total_pedidos,
                'ventas_totales': tienda.ventas_totales,
                'ticket_promedio': round(ticket_promedio, 2),
                'calificacion_promedio': round(float(tienda.calificacion_promedio), 2),
                'tiempo_promedio': None,  # Would require additional calculation
            })

        return Response(result)

    @action(detail=False, methods=['get'])
    def tiendas_bajo_rendimiento(self, request):
        """
        Get stores with low ratings that need attention.
        """
        threshold = float(request.query_params.get('umbral', 3.0))
        limite = int(request.query_params.get('limite', 10))

        tiendas = Tienda.objects.filter(
            is_deleted=False,
            disponible=True
        ).annotate(
            calificacion_promedio=Coalesce(
                Avg('calificaciones__rating_servicio'),
                0
            )
        ).filter(
            calificacion_promedio__lt=threshold,
            num_calificaciones__gt=0
        ).order_by('calificacion_promedio')[:limite]

        result = []
        for tienda in tiendas:
            result.append({
                'id': tienda.id,
                'nombre': tienda.nombre,
                'slug': tienda.slug,
                'logo_url': tienda.logo_url,
                'calificacion_servicio': float(tienda.calificacion_servicio),
                'calificacion_comida': float(tienda.calificacion_comida),
                'calificacion_tiempo': float(tienda.calificacion_tiempo),
                'calificacion_promedio': round(float(tienda.calificacion_promedio), 2),
                'num_calificaciones': tienda.num_calificaciones,
                'estado': 'supervision' if tienda.calificacion_promedio >= 2.0 else 'suspension'
            })

        return Response(result)

    @action(detail=False, methods=['get'])
    def ventas_resumen(self, request):
        """
        Get sales summary by period.
        """
        periodo = request.query_params.get('periodo', 'semana')
        limite = int(request.query_params.get('limite', 4))

        hoy = timezone.now().date()
        resultados = []

        for i in range(limite):
            if periodo == 'dia':
                fecha_inicio = hoy - timedelta(days=i)
                fecha_fin = fecha_inicio + timedelta(days=1)
                periodo_nombre = fecha_inicio.strftime('%d/%m')
            elif periodo == 'semana':
                fecha_inicio = hoy - timedelta(days=7 * (i + 1))
                fecha_fin = fecha_inicio + timedelta(days=7)
                periodo_nombre = f"Semana {i + 1}"
            else:  # mes
                fecha_inicio = hoy.replace(day=1) - timedelta(days=30 * i)
                fecha_fin = (fecha_inicio + timedelta(days=30)).replace(day=1)
                periodo_nombre = fecha_inicio.strftime('%B')

            fecha_inicio_dt = timezone.make_aware(
                timezone.datetime.combine(fecha_inicio, timezone.datetime.min.time())
            )
            fecha_fin_dt = timezone.make_aware(
                timezone.datetime.combine(fecha_fin, timezone.datetime.min.time())
            )

            ventas_data = Pedido.objects.filter(
                created_at__gte=fecha_inicio_dt,
                created_at__lt=fecha_fin_dt,
                is_deleted=False,
                estado__in=['completado', 'pagado', 'confirmado', 'preparando', 'listo', 'en_camino']
            ).aggregate(
                total=Coalesce(Sum('total'), 0),
                count=Count('id')
            )

            resultados.append({
                'periodo': periodo_nombre,
                'total_ventas': float(ventas_data['total']),
                'total_pedidos': ventas_data['count'],
                'ticket_promedio': (
                    float(ventas_data['total']) / ventas_data['count']
                    if ventas_data['count'] > 0 else 0
                ),
                'growth_percentage': None  # Would calculate vs previous period
            })

        # Reverse to show oldest first
        resultados.reverse()

        # Calculate growth percentages
        for i in range(1, len(resultados)):
            prev = resultados[i - 1]['total_ventas']
            curr = resultados[i]['total_ventas']
            if prev > 0:
                growth = ((curr - prev) / prev) * 100
                resultados[i]['growth_percentage'] = round(growth, 2)

        return Response(resultados)

    @action(detail=False, methods=['get'])
    def pedidos_estado(self, request):
        """
        Get order count by status.
        """
        estados = Pedido.objects.filter(
            is_deleted=False
        ).values('estado').annotate(
            cantidad=Count('id')
        ).order_by('estado')

        total = sum(e['cantidad'] for e in estados)

        result = []
        for estado in estados:
            result.append({
                'estado': estado['estado'],
                'cantidad': estado['cantidad'],
                'porcentaje': round(
                    (estado['cantidad'] / total * 100) if total > 0 else 0,
                    2
                )
            })

        return Response(result)

    @action(detail=False, methods=['get'])
    def exportar_csv(self, request):
        """
        Export metrics data as CSV.
        """
        tipo = request.query_params.get('tipo', 'pedidos')
        periodo = request.query_params.get('periodo', 'mes')

        # Calculate date range
        hoy = timezone.now().date()
        if periodo == 'dia':
            fecha_inicio = hoy
        elif periodo == 'semana':
            fecha_inicio = hoy - timedelta(days=7)
        else:
            fecha_inicio = hoy - timedelta(days=30)

        fecha_inicio_dt = timezone.make_aware(
            timezone.datetime.combine(fecha_inicio, timezone.datetime.min.time())
        )

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="metricas_{tipo}_{periodo}.csv"'

        writer = csv.writer(response)

        if tipo == 'pedidos':
            writer.writerow([
                'Tienda', 'Total Pedidos', 'Ventas Totales',
                'Ticket Promedio', 'Calificación'
            ])

            tiendas = Tienda.objects.filter(is_deleted=False).annotate(
                total_pedidos=Count(
                    'pedidos',
                    filter=Q(
                        pedidos__created_at__gte=fecha_inicio_dt,
                        pedidos__is_deleted=False
                    )
                ),
                ventas_totales=Coalesce(
                    Sum(
                        'pedidos__total',
                        filter=Q(
                            pedidos__created_at__gte=fecha_inicio_dt,
                            pedidos__is_deleted=False
                        )
                    ),
                    0
                )
            )

            for tienda in tiendas:
                ticket_prom = (
                    float(tienda.ventas_totales) / tienda.total_pedidos
                    if tienda.total_pedidos > 0 else 0
                )
                writer.writerow([
                    tienda.nombre,
                    tienda.total_pedidos,
                    float(tienda.ventas_totales),
                    round(ticket_prom, 2),
                    round(float(tienda.calificacion_servicio), 2)
                ])

        elif tipo == 'tiendas':
            writer.writerow([
                'Nombre', 'Dirección', 'Estado', 'Calificación',
                'Total Pedidos', 'Suspendida'
            ])

            tiendas = Tienda.objects.filter(is_deleted=False)

            for tienda in tiendas:
                total_pedidos = Pedido.objects.filter(
                    tienda=tienda,
                    created_at__gte=fecha_inicio_dt,
                    is_deleted=False
                ).count()

                writer.writerow([
                    tienda.nombre,
                    tienda.direccion,
                    'Activa' if tienda.disponible else 'Inactiva',
                    round(float(tienda.calificacion_servicio), 2),
                    total_pedidos,
                    'Sí' if tienda.suspendido else 'No'
                ])

        return response


class TiendaMetricsViewSet(viewsets.ViewSet):
    """
    ViewSet for individual store metrics.
    """
    permission_classes = [IsAuthenticated]

    def retrieve(self, request, pk=None):
        """
        Get metrics for a specific store.
        """
        try:
            tienda = Tienda.objects.get(pk=pk, is_deleted=False)
        except Tienda.DoesNotExist:
            return Response(
                {'error': 'Tienda no encontrada'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check permission
        if request.user != tienda.dueno and not request.user.is_superadmin:
            return Response(
                {'error': 'No tienes permiso para ver estas métricas'},
                status=status.HTTP_403_FORBIDDEN
            )

        periodo = request.query_params.get('periodo', 'semana')
        limite = int(request.query_params.get('limite', 30))

        # Calculate date range
        hoy = timezone.now().date()
        if periodo == 'dia':
            fecha_inicio = hoy
        elif periodo == 'semana':
            fecha_inicio = hoy - timedelta(days=7)
        else:
            fecha_inicio = hoy - timedelta(days=30)

        fecha_inicio_dt = timezone.make_aware(
            timezone.datetime.combine(fecha_inicio, timezone.datetime.min.time())
        )

        # Get orders
        pedidos = Pedido.objects.filter(
            tienda=tienda,
            created_at__gte=fecha_inicio_dt,
            is_deleted=False
        )

        # Calculate metrics
        total_pedidos = pedidos.count()
        ventas_totales = pedidos.filter(
            estado__in=['completado', 'pagado', 'confirmado', 'preparando', 'listo', 'en_camino']
        ).aggregate(total=Coalesce(Sum('total'), 0))['total']

        # Ratings
        ratings = Calificacion.objects.filter(
            tienda=tienda,
            is_deleted=False,
            valido=True
        ).aggregate(
            avg_servicio=Avg('rating_servicio'),
            avg_comida=Avg('rating_comida'),
            avg_tiempo=Avg('rating_tiempo')
        )

        return Response({
            'tienda_id': str(tienda.id),
            'tienda_nombre': tienda.nombre,
            'periodo': periodo,
            'fecha_inicio': str(fecha_inicio),
            'fecha_fin': str(hoy),
            'total_pedidos': total_pedidos,
            'ventas_totales': float(ventas_totales),
            'ticket_promedio': (
                float(ventas_totales) / total_pedidos if total_pedidos > 0 else 0
            ),
            'calificacion_servicio': round(float(ratings['avg_servicio'] or 0), 2),
            'calificacion_comida': round(float(ratings['avg_comida'] or 0), 2),
            'calificacion_tiempo': round(float(ratings['avg_tiempo'] or 0), 2),
            'num_calificaciones': Calificacion.objects.filter(
                tienda=tienda,
                is_deleted=False,
                valido=True
            ).count()
        })
