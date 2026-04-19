"""
Serializers for calificaciones app.
"""

from rest_framework import serializers
from django.db.models import Avg, Count
from .models import Calificacion, RespuestaCalificacion


class CalificacionSerializer(serializers.ModelSerializer):
    """
    Serializer for Calificacion model.
    """
    promedio = serializers.SerializerMethodField()
    usuario_nombre = serializers.SerializerMethodField()
    tienda_nombre = serializers.SerializerMethodField()
    respuesta = serializers.SerializerMethodField()

    class Meta:
        model = Calificacion
        fields = [
            'id', 'pedido', 'usuario', 'tienda', 'rating_servicio',
            'rating_comida', 'rating_tiempo', 'promedio', 'comentario',
            'valido', 'usuario_nombre', 'tienda_nombre', 'respuesta',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'usuario', 'tienda', 'valido', 'created_at']

    def get_promedio(self, obj):
        """Calculate average rating."""
        return round(obj.get_promedio(), 2)

    def get_usuario_nombre(self, obj):
        """Get the name of the user who made the rating."""
        return obj.usuario.nombre if obj.usuario else None

    def get_tienda_nombre(self, obj):
        """Get the name of the rated store."""
        return obj.tienda.nombre if obj.tienda else None

    def get_respuesta(self, obj):
        """Get the store owner's response if any."""
        try:
            if hasattr(obj, 'respuesta'):
                return RespuestaCalificacionSerializer(obj.respuesta).data
        except RespuestaCalificacion.DoesNotExist:
            pass
        return None


class CalificacionCreateSerializer(serializers.ModelSerializer):
    """
    Serializer for creating a new rating.
    """

    class Meta:
        model = Calificacion
        fields = [
            'pedido', 'rating_servicio', 'rating_comida',
            'rating_tiempo', 'comentario'
        ]

    def validate_rating_servicio(self, value):
        """Validate rating is between 1 and 5."""
        if value < 1 or value > 5:
            raise serializers.ValidationError(
                'La calificación debe estar entre 1 y 5.'
            )
        return value

    def validate_rating_comida(self, value):
        """Validate rating is between 1 and 5."""
        if value < 1 or value > 5:
            raise serializers.ValidationError(
                'La calificación debe estar entre 1 y 5.'
            )
        return value

    def validate_rating_tiempo(self, value):
        """Validate rating is between 1 and 5."""
        if value < 1 or value > 5:
            raise serializers.ValidationError(
                'La calificación debe estar entre 1 y 5.'
            )
        return value

    def validate(self, attrs):
        """Validate that the order exists and belongs to the user."""
        pedido = attrs.get('pedido')
        user = self.context.get('request').user

        if not pedido:
            raise serializers.ValidationError(
                {'pedido': 'Debe especificar un pedido para calificar.'}
            )

        # Check if the order belongs to this user
        if pedido.usuario != user:
            raise serializers.ValidationError(
                {'pedido': 'Este pedido no pertenece a usted.'}
            )

        # Check if the order is completed
        if pedido.estado != 'completado':
            raise serializers.ValidationError(
                {'pedido': 'Solo puede calificar pedidos completados.'}
            )

        # Check if already rated
        if Calificacion.objects.filter(pedido=pedido, is_deleted=False).exists():
            raise serializers.ValidationError(
                {'pedido': 'Este pedido ya ha sido calificado.'}
            )

        # Set tienda from the order
        attrs['tienda'] = pedido.tienda
        attrs['usuario'] = user

        return attrs

    def create(self, validated_data):
        """Create the rating and update store ratings."""
        calificacion = super().create(validated_data)
        # Update store ratings
        calificacion.actualizar_calificaciones_tienda()
        return calificacion


class CalificacionListSerializer(serializers.ModelSerializer):
    """
    Serializer for listing ratings (lighter response).
    """
    promedio = serializers.SerializerMethodField()
    usuario_nombre = serializers.SerializerMethodField()

    class Meta:
        model = Calificacion
        fields = [
            'id', 'tienda', 'rating_servicio', 'rating_comida',
            'rating_tiempo', 'promedio', 'comentario',
            'usuario_nombre', 'created_at'
        ]

    def get_promedio(self, obj):
        """Calculate average rating."""
        return round(obj.get_promedio(), 2)

    def get_usuario_nombre(self, obj):
        """Get the first name of the user."""
        return obj.usuario.nombre.split()[0] if obj.usuario else 'Anónimo'


class RespuestaCalificacionSerializer(serializers.ModelSerializer):
    """
    Serializer for response to a rating.
    """
    usuario_nombre = serializers.SerializerMethodField()

    class Meta:
        model = RespuestaCalificacion
        fields = ['id', 'contenido', 'usuario', 'usuario_nombre', 'created_at']
        read_only_fields = ['id', 'usuario', 'created_at']

    def get_usuario_nombre(self, obj):
        """Get the name of the user who responded."""
        return obj.usuario.nombre if obj.usuario else None

    def validate(self, attrs):
        """Validate that the user can respond to this rating."""
        calificacion = self.context.get('calificacion')
        user = self.context.get('request').user

        if not calificacion:
            raise serializers.ValidationError(
                'Debe especificar una calificación.'
            )

        # Check if the user is the store owner
        if calificacion.tienda and calificacion.tienda.dueno != user:
            if not user.is_superadmin:
                raise serializers.ValidationError(
                    'Solo el dueño de la tienda puede responder a las calificaciones.'
                )

        # Check if already responded
        if hasattr(calificacion, 'respuesta'):
            raise serializers.ValidationError(
                'Esta calificación ya tiene una respuesta.'
            )

        attrs['calificacion'] = calificacion
        attrs['usuario'] = user

        return attrs


class CalificacionResumenSerializer(serializers.Serializer):
    """
    Serializer for aggregated rating summary.
    """
    total_calificaciones = serializers.IntegerField()
    promedio_general = serializers.FloatField()
    promedio_servicio = serializers.FloatField()
    promedio_comida = serializers.FloatField()
    promedio_tiempo = serializers.FloatField()
    distribucion = serializers.DictField(
        child=serializers.IntegerField()
    )
