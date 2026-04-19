"""
Serializers for tiendas app.
"""

from rest_framework import serializers
from django.db.models import Avg
from .models import Tienda, Categoria, MenuItem


class MenuItemSerializer(serializers.ModelSerializer):
    """
    Serializer for MenuItem model.
    """
    class Meta:
        model = MenuItem
        fields = [
            'id', 'tienda', 'categoria', 'nombre', 'descripcion',
            'precio', 'imagen_url', 'disponible', 'orden'
        ]
        read_only_fields = ['id', 'tienda', 'created_at', 'updated_at']


class MenuItemListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing menu items.
    """
    class Meta:
        model = MenuItem
        fields = [
            'id', 'nombre', 'descripcion', 'precio',
            'imagen_url', 'disponible', 'orden'
        ]


class CategoriaSerializer(serializers.ModelSerializer):
    """
    Serializer for Categoria model.
    """
    items = MenuItemListSerializer(many=True, read_only=True)

    class Meta:
        model = Categoria
        fields = [
            'id', 'tienda', 'nombre', 'descripcion',
            'icono', 'orden', 'items'
        ]
        read_only_fields = ['id', 'tienda', 'created_at']


class CategoriaListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing categories.
    """
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Categoria
        fields = ['id', 'nombre', 'descripcion', 'icono', 'orden', 'item_count']

    def get_item_count(self, obj):
        return obj.items.filter(is_deleted=False, disponible=True).count()


class TiendaListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing stores.
    """
    calificacion_promedio = serializers.SerializerMethodField()
    tiempo_estimado = serializers.SerializerMethodField()
    distancia = serializers.SerializerMethodField(required=False)

    class Meta:
        model = Tienda
        fields = [
            'id', 'nombre', 'slug', 'descripcion', 'direccion',
            'lat', 'lng', 'telefono', 'logo_url', 'banner_url',
            'color_primario', 'color_secundario', 'disponible',
            'abierto', 'calificacion_promedio', 'tiempo_estimado',
            'costo_delivery', 'num_calificaciones', 'distancia'
        ]

    def get_calificacion_promedio(self, obj):
        return obj.get_calificacion_promedio()

    def get_tiempo_estimado(self, obj):
        return obj.tiempo_delivery

    def get_distancia(self, obj):
        # Distance is added by the view if geo filtering is used
        return getattr(obj, 'distancia', None)


class TiendaDetailSerializer(serializers.ModelSerializer):
    """
    Serializer for store detail.
    """
    categorias = CategoriaSerializer(many=True, read_only=True)
    calificacion_promedio = serializers.SerializerMethodField()
    tiempo_estimado_delivery = serializers.SerializerMethodField()
    tiempo_estimado_pickup = serializers.SerializerMethodField()
    tiempo_estimado_sitio = serializers.SerializerMethodField()

    class Meta:
        model = Tienda
        fields = [
            'id', 'nombre', 'slug', 'descripcion', 'direccion',
            'lat', 'lng', 'telefono', 'logo_url', 'banner_url',
            'color_primario', 'color_secundario', 'disponible',
            'abierto', 'calificacion_servicio', 'calificacion_comida',
            'calificacion_tiempo', 'calificacion_promedio',
            'num_calificaciones', 'tiempo_pickup', 'tiempo_delivery',
            'tiempo_sitio', 'tiempo_estimado_delivery',
            'tiempo_estimado_pickup', 'tiempo_estimado_sitio',
            'costo_delivery', 'suspendido', 'motivo_suspension',
            'categorias', 'created_at', 'updated_at'
        ]

    def get_calificacion_promedio(self, obj):
        return obj.get_calificacion_promedio()

    def get_tiempo_estimado_delivery(self, obj):
        return obj.tiempo_delivery

    def get_tiempo_estimado_pickup(self, obj):
        return obj.tiempo_pickup

    def get_tiempo_estimado_sitio(self, obj):
        return obj.tiempo_sitio


class TiendaCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating stores.
    """
    class Meta:
        model = Tienda
        fields = [
            'nombre', 'descripcion', 'direccion', 'lat', 'lng',
            'telefono', 'logo_url', 'banner_url', 'color_primario',
            'color_secundario', 'disponible', 'abierto', 'tiempo_pickup',
            'tiempo_delivery', 'tiempo_sitio', 'costo_delivery'
        ]

    def validate_lat(self, value):
        if value < -90 or value > 90:
            raise serializers.ValidationError(
                'La latitud debe estar entre -90 y 90.'
            )
        return value

    def validate_lng(self, value):
        if value < -180 or value > 180:
            raise serializers.ValidationError(
                'La longitud debe estar entre -180 y 180.'
            )
        return value


class MenuItemCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating menu items.
    """
    class Meta:
        model = MenuItem
        fields = [
            'categoria', 'nombre', 'descripcion', 'precio',
            'imagen_url', 'disponible', 'orden'
        ]

    def validate_precio(self, value):
        if value <= 0:
            raise serializers.ValidationError(
                'El precio debe ser mayor a 0.'
            )
        return value


class CategoriaCreateUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/updating categories.
    """
    class Meta:
        model = Categoria
        fields = ['nombre', 'descripcion', 'icono', 'orden']
