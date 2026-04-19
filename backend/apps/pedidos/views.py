"""
Views for pedidos app.
"""

from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django_filters.rest_framework import DjangoFilterBackend
from django.shortcuts import get_object_or_404
from django.db.models import Q

from core.permissions import IsOwner, IsTiendaOwner, IsSuperAdmin
from core.utils import FileUploadValidator
from .models import Pedido, PedidoItem, Mensaje
from .serializers import (
    PedidoListSerializer,
    PedidoDetailSerializer,
    PedidoCreateSerializer,
    PedidoEstadoUpdateSerializer,
    PedidoItemSerializer,
    MensajeSerializer,
    MensajeCreateSerializer,
)


class PedidoViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Pedido model.
    """
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['estado', 'tienda', 'tipo_servicio']
    ordering_fields = ['created_at', 'total', 'estado']

    def get_serializer_class(self):
        if self.action == 'create':
            return PedidoCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return PedidoEstadoUpdateSerializer
        elif self.action == 'list':
            return PedidoListSerializer
        return PedidoDetailSerializer

    def get_queryset(self):
        user = self.request.user
        queryset = Pedido.objects.filter(is_deleted=False)

        # Filter by user role
        if user.is_usuario:
            queryset = queryset.filter(usuario=user)
        elif user.is_dueno:
            queryset = queryset.filter(tienda=user.tienda)
        # Superadmin sees all

        # Filter by specific status if provided
        estado = self.request.query_params.get('estado')
        if estado:
            queryset = queryset.filter(estado=estado)

        return queryset

    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            return [IsAuthenticated()]
        elif self.action in ['update_estado', 'add_comprobante']:
            return [IsAuthenticated(), IsTiendaOwner()]
        return [IsAuthenticated()]

    @action(detail=False, methods=['get'])
    def mis_pedidos(self, request):
        """
        Get current user's orders.
        """
        pedidos = Pedido.objects.filter(
            usuario=request.user,
            is_deleted=False
        ).order_by('-created_at')

        page = self.paginate_queryset(pedidos)
        if page is not None:
            serializer = PedidoListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = PedidoListSerializer(pedidos, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def detalle(self, request, pk=None):
        """
        Get order detail.
        """
        pedido = self.get_object()
        serializer = PedidoDetailSerializer(pedido)
        return Response(serializer.data)

    @action(detail=True, methods=['put', 'patch'], url_path='estado')
    def update_estado(self, request, pk=None):
        """
        Update order status.
        """
        pedido = self.get_object()

        serializer = PedidoEstadoUpdateSerializer(
            data=request.data,
            context={'pedido': pedido, 'request': request}
        )
        serializer.is_valid(raise_exception=True)

        old_estado = pedido.estado
        new_estado = serializer.validated_data['estado']
        pedido.estado = new_estado

        # Handle specific state transitions
        if new_estado == Pedido.Estado.PAGADO:
            pedido.pago_confirmado = True
        elif new_estado == Pedido.Estado.COMPLETADO:
            # Complete the order
            pass
        elif new_estado == Pedido.Estado.CANCELADO:
            # Handle cancellation logic
            pass

        pedido.save()

        # Create system message
        Mensaje.objects.create(
            pedido=pedido,
            emisor=None,
            emisor_tipo='sistema',
            tipo='sistema',
            contenido=f'Pedido #{pedido.numero_pedido} actualizado de {old_estado} a {new_estado}'
        )

        return Response(PedidoDetailSerializer(pedido).data)

    @action(detail=True, methods=['post'], url_path='comprobante')
    def add_comprobante(self, request, pk=None):
        """
        Add payment proof to order.
        """
        pedido = self.get_object()

        if pedido.estado not in [Pedido.Estado.PENDIENTE_PAGO, Pedido.Estado.ESPERANDO_COMPROBANTE]:
            return Response(
                {'error': 'No se puede agregar comprobante a un pedido en este estado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        file = request.FILES.get('comprobante')
        if not file:
            return Response(
                {'error': 'Se requiere un archivo de comprobante.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate file
        is_valid, error_msg = FileUploadValidator.validate_document(file)
        if not is_valid:
            return Response(
                {'error': error_msg},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Save file
        from django.conf import settings
        import os
        from django.utils import timezone

        filename = f'comprobantes/{pedido.numero_pedido}_{timezone.now().strftime("%Y%m%d%H%M%S")}.{file.name.split(".")[-1]}'
        filepath = os.path.join(settings.MEDIA_ROOT, filename)

        # Ensure directory exists
        os.makedirs(os.path.dirname(filepath), exist_ok=True)

        with open(filepath, 'wb+') as destination:
            for chunk in file.chunks():
                destination.write(chunk)

        comprobante_url = f'{settings.MEDIA_URL}{filename}'
        pedido.comprobante_url = comprobante_url
        pedido.estado = Pedido.Estado.ESPERANDO_COMPROBANTE
        pedido.save()

        # Create message
        Mensaje.objects.create(
            pedido=pedido,
            emisor=request.user,
            emisor_tipo='usuario' if request.user.is_usuario else 'tienda',
            tipo='archivo',
            contenido='Comprobante de pago subido',
            archivo_url=comprobante_url
        )

        return Response({
            'message': 'Comprobante agregado exitosamente.',
            'comprobante_url': comprobante_url,
            'pedido': PedidoDetailSerializer(pedido).data
        })

    @action(detail=True, methods=['post'])
    def cancelar(self, request, pk=None):
        """
        Cancel an order.
        """
        pedido = self.get_object()

        if not pedido.can_be_cancelled():
            return Response(
                {'error': 'Este pedido no puede ser cancelado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        pedido.estado = Pedido.Estado.CANCELADO
        pedido.save()

        # Create system message
        Mensaje.objects.create(
            pedido=pedido,
            emisor=None,
            emisor_tipo='sistema',
            tipo='sistema',
            contenido=f'Pedido #{pedido.numero_pedido} ha sido cancelado'
        )

        return Response(PedidoDetailSerializer(pedido).data)


class PedidoItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for PedidoItem model.
    """
    serializer_class = PedidoItemSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        pedido_id = self.kwargs.get('pedido_id')
        if pedido_id:
            return PedidoItem.objects.filter(
                pedido_id=pedido_id,
                is_deleted=False
            )
        return PedidoItem.objects.none()
