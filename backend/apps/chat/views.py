"""
Views for chat app.
"""

from rest_framework import status, generics
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.shortcuts import get_object_or_404
from django.db.models import Q

from apps.pedidos.models import Pedido, Mensaje
from apps.pedidos.serializers import MensajeSerializer
from core.permissions import IsOwner, IsTiendaOwner
from core.utils import FileUploadValidator
from .serializers import ChatMensajeSerializer, ChatMensajeCreateSerializer


class ChatListView(generics.ListAPIView):
    """
    View for listing chat messages for an order.
    """
    serializer_class = ChatMensajeSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        pedido_id = self.kwargs.get('pedido_id')
        pedido = get_object_or_404(
            Pedido,
            id=pedido_id,
            is_deleted=False
        )

        user = self.request.user

        # Check if user is part of this order
        if user.is_usuario and pedido.usuario != user:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No tienes acceso a este pedido.')
        elif user.is_dueno and pedido.tienda != user.tienda:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('No tienes acceso a este pedido.')

        # Mark messages as read
        Mensaje.objects.filter(
            pedido=pedido,
            leido=False
        ).exclude(emisor=user).update(leido=True)

        return Mensaje.objects.filter(
            pedido=pedido,
            is_deleted=False
        ).order_by('created_at')


class ChatCreateView(APIView):
    """
    View for creating chat messages for an order.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pedido_id):
        pedido = get_object_or_404(
            Pedido,
            id=pedido_id,
            is_deleted=False
        )

        user = request.user

        # Check if user is part of this order
        if user.is_usuario and pedido.usuario != user:
            return Response(
                {'error': 'No tienes acceso a este pedido.'},
                status=status.HTTP_403_FORBIDDEN
            )
        elif user.is_dueno and pedido.tienda != user.tienda:
            return Response(
                {'error': 'No tienes acceso a este pedido.'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ChatMensajeCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        tipo = serializer.validated_data.get('tipo', 'texto')
        contenido = serializer.validated_data.get('contenido', '')
        archivo = serializer.validated_data.get('archivo')

        archivo_url = ''

        # Handle file upload
        if archivo:
            if tipo == 'imagen':
                is_valid, error_msg = FileUploadValidator.validate_image(archivo)
            else:
                is_valid, error_msg = FileUploadValidator.validate_document(archivo)

            if not is_valid:
                return Response(
                    {'error': error_msg},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Save file
            from django.conf import settings
            import os
            from django.utils import timezone

            ext = archivo.name.split('.')[-1].lower()
            filename = f'chat/{pedido.numero_pedido}_{timezone.now().strftime("%Y%m%d%H%M%S")}.{ext}'
            filepath = os.path.join(settings.MEDIA_ROOT, filename)
            os.makedirs(os.path.dirname(filepath), exist_ok=True)

            with open(filepath, 'wb+') as destination:
                for chunk in archivo.chunks():
                    destination.write(chunk)

            archivo_url = f'{settings.MEDIA_URL}{filename}'

        # Determine emisor tipo
        emisor_tipo = 'usuario' if user.is_usuario else 'tienda'

        # Create message
        mensaje = Mensaje.objects.create(
            pedido=pedido,
            emisor=user,
            emisor_tipo=emisor_tipo,
            tipo=tipo,
            contenido=contenido,
            archivo_url=archivo_url
        )

        return Response(
            ChatMensajeSerializer(mensaje, context={'request': request}).data,
            status=status.HTTP_201_CREATED
        )


class ChatUnreadCountView(APIView):
    """
    View for getting unread message count for an order.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pedido_id):
        pedido = get_object_or_404(
            Pedido,
            id=pedido_id,
            is_deleted=False
        )

        user = request.user

        # Check if user is part of this order
        if user.is_usuario and pedido.usuario != user:
            return Response(
                {'error': 'No tienes acceso a este pedido.'},
                status=status.HTTP_403_FORBIDDEN
            )
        elif user.is_dueno and pedido.tienda != user.tienda:
            return Response(
                {'error': 'No tienes acceso a este pedido.'},
                status=status.HTTP_403_FORBIDDEN
            )

        count = Mensaje.objects.filter(
            pedido=pedido,
            leido=False
        ).exclude(emisor=user).count()

        return Response({'unread_count': count})


class ComprobanteUploadView(APIView):
    """
    View for uploading payment proof via chat.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, pedido_id):
        pedido = get_object_or_404(
            Pedido,
            id=pedido_id,
            is_deleted=False
        )

        user = request.user

        # Check if user is the order owner
        if pedido.usuario != user:
            return Response(
                {'error': 'Solo el usuario puede subir comprobantes.'},
                status=status.HTTP_403_FORBIDDEN
            )

        if pedido.estado not in [Pedido.Estado.PENDIENTE_PAGO, Pedido.Estado.ESPERANDO_COMPROBANTE]:
            return Response(
                {'error': 'No se puede subir comprobante en este estado.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        file = request.FILES.get('archivo')
        if not file:
            return Response(
                {'error': 'Se requiere un archivo.'},
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

        ext = file.name.split('.')[-1].lower()
        filename = f'comprobantes/{pedido.numero_pedido}_{timezone.now().strftime("%Y%m%d%H%M%S")}.{ext}'
        filepath = os.path.join(settings.MEDIA_ROOT, filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)

        with open(filepath, 'wb+') as destination:
            for chunk in file.chunks():
                destination.write(chunk)

        archivo_url = f'{settings.MEDIA_URL}{filename}'

        # Update pedido
        pedido.comprobante_url = archivo_url
        pedido.estado = Pedido.Estado.ESPERANDO_COMPROBANTE
        pedido.save()

        # Create message
        mensaje = Mensaje.objects.create(
            pedido=pedido,
            emisor=user,
            emisor_tipo='usuario',
            tipo='archivo',
            contenido='Comprobante de pago subido',
            archivo_url=archivo_url
        )

        return Response({
            'message': 'Comprobante subido exitosamente.',
            'archivo_url': archivo_url,
            'mensaje': ChatMensajeSerializer(mensaje, context={'request': request}).data
        }, status=status.HTTP_201_CREATED)
