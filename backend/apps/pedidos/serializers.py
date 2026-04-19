"""
Serializers for pedidos app.
"""

from rest_framework import serializers
from django.db.models import Sum
from .models import Pedido, PedidoItem, Mensaje
from apps.tiendas.serializers import TiendaListSerializer
from apps.accounts.serializers import UserSerializer


class PedidoItemSerializer(serializers.ModelSerializer):
    """
    Serializer for PedidoItem model.
    """
    subtotal = serializers.SerializerMethodField()

    class Meta:
        model = PedidoItem
        fields = [
            'id', 'pedido', 'menu_item', 'nombre', 'precio',
            'cantidad', 'comentarios', 'subtotal'
        ]
        read_only_fields = ['id', 'pedido']

    def get_subtotal(self, obj):
        return obj.get_subtotal()


class PedidoItemCreateSerializer(serializers.Serializer):
    """
    Serializer for creating order items.
    """
    menu_item_id = serializers.IntegerField(required=False)
    nombre = serializers.CharField(max_length=100)
    precio = serializers.DecimalField(max_digits=10, decimal_places=2)
    cantidad = serializers.IntegerField(min_value=1, default=1)
    comentarios = serializers.CharField(required=False, allow_blank=True, default='')


class MensajeSerializer(serializers.ModelSerializer):
    """
    Serializer for Mensaje model.
    """
    emisor_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Mensaje
        fields = [
            'id', 'pedido', 'emisor', 'emisor_nombre', 'emisor_tipo',
            'tipo', 'contenido', 'archivo_url', 'leido', 'created_at'
        ]
        read_only_fields = ['id', 'pedido', 'emisor', 'emisor_tipo', 'created_at']

    def get_emisor_nombre(self, obj):
        if obj.emisor:
            return obj.emisor.nombre
        return 'Sistema'


class MensajeCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating messages.
    """

    class Meta:
        model = Mensaje
        fields = ['tipo', 'contenido', 'archivo_url']

    def validate(self, attrs):
        tipo = attrs.get('tipo', 'texto')
        contenido = attrs.get('contenido', '')
        archivo_url = attrs.get('archivo_url', '')

        if tipo in ['imagen', 'archivo'] and not archivo_url:
            raise serializers.ValidationError(
                'Se requiere URL del archivo para mensajes de tipo imagen o archivo.'
            )

        if tipo == 'texto' and not contenido:
            raise serializers.ValidationError(
                'El contenido no puede estar vacío para mensajes de tipo texto.'
            )

        return attrs


class PedidoListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing orders.
    """
    tienda_nombre = serializers.CharField(source='tienda.nombre', read_only=True)
    tienda_slug = serializers.CharField(source='tienda.slug', read_only=True)
    usuario_nombre = serializers.CharField(source='usuario.nombre', read_only=True)
    items_count = serializers.SerializerMethodField()

    class Meta:
        model = Pedido
        fields = [
            'id', 'numero_pedido', 'tienda', 'tienda_nombre', 'tienda_slug',
            'usuario', 'usuario_nombre', 'tipo_servicio', 'estado',
            'total', 'tiempo_estimado', 'items_count', 'created_at'
        ]

    def get_items_count(self, obj):
        return obj.items.filter(is_deleted=False).count()


class PedidoDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for order detail.
    """
    items = PedidoItemSerializer(many=True, read_only=True)
    tienda = TiendaListSerializer(read_only=True)
    usuario = UserSerializer(read_only=True)
    mensajes_count = serializers.SerializerMethodField()
    next_estados = serializers.SerializerMethodField()
    can_be_cancelled = serializers.SerializerMethodField()

    class Meta:
        model = Pedido
        fields = [
            'id', 'numero_pedido', 'tienda', 'usuario', 'tipo_servicio',
            'estado', 'direccion_entrega', 'lat_entrega', 'lng_entrega',
            'subtotal', 'costo_delivery', 'total', 'tiempo_estimado',
            'comentarios', 'comprobante_url', 'pago_confirmado',
            'items', 'mensajes_count', 'next_estados', 'can_be_cancelled',
            'created_at', 'updated_at'
        ]

    def get_mensajes_count(self, obj):
        return obj.mensajes.filter(is_deleted=False).count()

    def get_next_estados(self, obj):
        return [{'value': e, 'label': l} for e, l in obj.get_next_estados()]

    def get_can_be_cancelled(self, obj):
        return obj.can_be_cancelled()


class PedidoCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating orders.
    """
    items = PedidoItemCreateSerializer(many=True, required=True)
    direccion_entrega = serializers.CharField(required=False, allow_blank=True)
    lat_entrega = serializers.DecimalField(
        max_digits=10, decimal_places=8,
        required=False, allow_null=True
    )
    lng_entrega = serializers.DecimalField(
        max_digits=11, decimal_places=8,
        required=False, allow_null=True
    )

    class Meta:
        model = Pedido
        fields = [
            'tienda', 'tipo_servicio', 'direccion_entrega', 'lat_entrega',
            'lng_entrega', 'comentarios', 'items'
        ]

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError(
                'Debe incluir al menos un producto.'
            )
        return value

    def validate_tienda(self, value):
        if not value.disponible:
            raise serializers.ValidationError(
                'La tienda no está disponible.'
            )
        if not value.abierto:
            raise serializers.ValidationError(
                'La tienda está cerrada.'
            )
        if value.suspendido:
            raise serializers.ValidationError(
                'La tienda está suspendida.'
            )
        return value

    def create(self, validated_data):
        items_data = validated_data.pop('items')
        user = self.context['request'].user
        tienda = validated_data['tienda']

        # Set delivery address from user profile if not provided
        if validated_data.get('tipo_servicio') == 'delivery':
            if not validated_data.get('direccion_entrega'):
                validated_data['direccion_entrega'] = getattr(user, 'direccion', '')

        # Set tiempo estimado
        validated_data['tiempo_estimado'] = tienda.get_tiempo_estimado(
            validated_data.get('tipo_servicio', 'delivery')
        )

        # Set delivery cost
        if validated_data.get('tipo_servicio') == 'delivery':
            validated_data['costo_delivery'] = tienda.costo_delivery

        pedido = Pedido.objects.create(
            usuario=user,
            **validated_data
        )

        # Create order items
        for item_data in items_data:
            menu_item_id = item_data.pop('menu_item_id', None)
            if menu_item_id:
                from apps.tiendas.models import MenuItem
                try:
                    menu_item = MenuItem.objects.get(id=menu_item_id, is_deleted=False)
                    item_data['menu_item'] = menu_item
                    item_data['nombre'] = menu_item.nombre
                    item_data['precio'] = menu_item.precio
                except MenuItem.DoesNotExist:
                    pass

            PedidoItem.objects.create(pedido=pedido, **item_data)

        # Calculate totals
        pedido.calculate_totals()

        # Create system message
        Mensaje.objects.create(
            pedido=pedido,
            emisor=None,
            emisor_tipo='sistema',
            tipo='sistema',
            contenido=f'Se ha creado el pedido #{pedido.numero_pedido}'
        )

        return pedido


class PedidoEstadoUpdateSerializer(serializers.Serializer):
    """
    Serializer for updating order status.
    """
    estado = serializers.ChoiceField(choices=Pedido.Estado.choices)

    def validate_estado(self, value):
        pedido = self.context.get('pedido')
        if pedido:
            next_estados = pedido.get_next_estados()
            if value not in next_estados:
                raise serializers.ValidationError(
                    f'No se puede cambiar al estado {value}. '
                    f'Estados disponibles: {", ".join(next_estados)}'
                )
        return value
