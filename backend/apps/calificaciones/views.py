"""
Views for calificaciones app.
"""

from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.db.models import Avg, Count

from core.permissions import IsOwner, IsTiendaOwner, IsSuperAdmin
from .models import Calificacion, RespuestaCalificacion
from .serializers import (
    CalificacionSerializer,
    CalificacionCreateSerializer,
    CalificacionListSerializer,
    RespuestaCalificacionSerializer,
    CalificacionResumenSerializer,
)


class CalificacionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Calificacion model.
    """
    queryset = Calificacion.objects.filter(is_deleted=False, valido=True)
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['tienda', 'usuario']
    ordering_fields = ['created_at', 'rating_servicio', 'rating_comida', 'rating_tiempo']

    def get_serializer_class(self):
        if self.action == 'create':
            return CalificacionCreateSerializer
        elif self.action == 'list':
            return CalificacionListSerializer
        return CalificacionSerializer

    def get_permissions(self):
        if self.action in ['create']:
            return [IsAuthenticated()]
        elif self.action in ['update', 'partial_update', 'destroy', 'responder']:
            return [IsAuthenticated()]
        return super().get_permissions()

    def perform_destroy(self, instance):
        """Soft delete the rating."""
        instance.delete()

    @action(detail=False, methods=['get'])
    def por_tienda(self, request, pk=None):
        """
        Get all ratings for a specific store.
        """
        tienda_id = request.query_params.get('tienda_id')
        if not tienda_id:
            return Response(
                {'error': 'Se requiere tienda_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        calificaciones = self.queryset.filter(tienda_id=tienda_id)

        # Optional: include response
        include_response = request.query_params.get('include_response', 'false').lower() == 'true'
        if include_response:
            serializer = CalificacionSerializer(calificaciones, many=True)
        else:
            serializer = CalificacionListSerializer(calificaciones, many=True)

        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def responder(self, request, pk=None):
        """
        Add a response to a rating (store owner only).
        """
        calificacion = self.get_object()

        # Check if user is store owner or admin
        if request.user != calificacion.tienda.dueno and not request.user.is_superadmin:
            return Response(
                {'error': 'No tienes permiso para responder a esta calificación'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Check if already has response
        if hasattr(calificacion, 'respuesta'):
            return Response(
                {'error': 'Esta calificación ya tiene una respuesta'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = RespuestaCalificacionSerializer(
            data=request.data,
            context={'calificacion': calificacion, 'request': request}
        )

        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def resumen(self, request):
        """
        Get aggregated rating summary for a store.
        """
        tienda_id = request.query_params.get('tienda_id')

        if not tienda_id:
            return Response(
                {'error': 'Se requiere tienda_id'},
                status=status.HTTP_400_BAD_REQUEST
            )

        calificaciones = self.queryset.filter(tienda_id=tienda_id)

        if not calificaciones.exists():
            return Response({
                'total_calificaciones': 0,
                'promedio_general': 0,
                'promedio_servicio': 0,
                'promedio_comida': 0,
                'promedio_tiempo': 0,
                'distribucion': {
                    '1': 0, '2': 0, '3': 0, '4': 0, '5': 0
                }
            })

        # Calculate aggregates
        aggregates = calificaciones.aggregate(
            avg_servicio=Avg('rating_servicio'),
            avg_comida=Avg('rating_comida'),
            avg_tiempo=Avg('rating_tiempo'),
            total=Count('id')
        )

        # Calculate distribution
        distribution = {}
        for i in range(1, 6):
            # Count ratings equal to i
            count = calificaciones.filter(
                rating_servicio=i
            ).count() + calificaciones.filter(
                rating_comida=i
            ).count() + calificaciones.filter(
                rating_tiempo=i
            ).count()
            distribution[str(i)] = count // 3  # Divide by 3 since we count all three ratings

        promedio_general = (
            float(aggregates['avg_servicio'] or 0) +
            float(aggregates['avg_comida'] or 0) +
            float(aggregates['avg_tiempo'] or 0)
        ) / 3.0

        return Response({
            'total_calificaciones': aggregates['total'],
            'promedio_general': round(promedio_general, 2),
            'promedio_servicio': round(float(aggregates['avg_servicio'] or 0), 2),
            'promedio_comida': round(float(aggregates['avg_comida'] or 0), 2),
            'promedio_tiempo': round(float(aggregates['avg_tiempo'] or 0), 2),
            'distribucion': distribution
        })


class MisCalificacionesView(generics.ListAPIView):
    """
    View for listing ratings made by the current user.
    """
    serializer_class = CalificacionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Calificacion.objects.filter(
            usuario=self.request.user,
            is_deleted=False
        )


class CalificacionDetalleView(generics.RetrieveAPIView):
    """
    View for getting a specific rating detail.
    """
    serializer_class = CalificacionSerializer
    permission_classes = [AllowAny]
    queryset = Calificacion.objects.filter(is_deleted=False, valido=True)
    lookup_field = 'pk'
