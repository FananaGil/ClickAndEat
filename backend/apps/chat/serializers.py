"""
Serializers for chat app.
"""

from rest_framework import serializers
from apps.pedidos.models import Mensaje


class ChatMensajeSerializer(serializers.ModelSerializer):
    """
    Serializer for chat messages.
    """
    emisor_nombre = serializers.SerializerMethodField()
    es_mio = serializers.SerializerMethodField()

    class Meta:
        model = Mensaje
        fields = [
            'id', 'pedido', 'emisor', 'emisor_nombre', 'emisor_tipo',
            'tipo', 'contenido', 'archivo_url', 'leido', 'created_at',
            'es_mio'
        ]
        read_only_fields = [
            'id', 'pedido', 'emisor', 'emisor_tipo', 'created_at', 'es_mio'
        ]

    def get_emisor_nombre(self, obj):
        if obj.emisor:
            return obj.emisor.nombre
        return 'Sistema'

    def get_es_mio(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.emisor == request.user
        return False


class ChatMensajeCreateSerializer(serializers.Serializer):
    """
    Serializer for creating chat messages via API.
    """
    contenido = serializers.CharField(required=False, allow_blank=True)
    tipo = serializers.ChoiceField(
        choices=['texto', 'imagen', 'archivo'],
        default='texto'
    )
    archivo = serializers.FileField(required=False)

    def validate(self, attrs):
        tipo = attrs.get('tipo', 'texto')
        contenido = attrs.get('contenido', '')
        archivo = attrs.get('archivo')

        if tipo == 'texto' and not contenido:
            raise serializers.ValidationError(
                'El contenido no puede estar vacío para mensajes de tipo texto.'
            )

        if tipo in ['imagen', 'archivo'] and not archivo:
            raise serializers.ValidationError(
                'Se requiere un archivo para mensajes de tipo imagen o archivo.'
            )

        return attrs
