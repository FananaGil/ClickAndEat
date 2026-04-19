"""
Services for tiendas app.
"""

from django.db.models import Avg, Count
from django.db.models.functions import Coalesce
from decimal import Decimal
from .models import Tienda, Categoria, MenuItem
from apps.calificaciones.models import Calificacion


class TiendaService:
    """
    Service class for tienda-related operations.
    """

    @staticmethod
    def get_tienda_by_slug(slug):
        """
        Get tienda by slug.
        """
        try:
            return Tienda.objects.get(slug=slug, is_deleted=False)
        except Tienda.DoesNotExist:
            return None

    @staticmethod
    def get_tienda_by_id(tienda_id):
        """
        Get tienda by ID.
        """
        try:
            return Tienda.objects.get(id=tienda_id, is_deleted=False)
        except Tienda.DoesNotExist:
            return None

    @staticmethod
    def update_calificaciones(tienda_id):
        """
        Update tienda ratings based on calificaciones.
        """
        try:
            tienda = Tienda.objects.get(id=tienda_id)

            calificaciones = Calificacion.objects.filter(
                tienda=tienda,
                is_deleted=False
            )

            if calificaciones.exists():
                avg_servicio = calificaciones.aggregate(Avg('rating_servicio'))['rating_servicio__avg']
                avg_comida = calificaciones.aggregate(Avg('rating_comida'))['rating_comida__avg']
                avg_tiempo = calificaciones.aggregate(Avg('rating_tiempo'))['rating_tiempo__avg']
                num_calificaciones = calificaciones.count()

                tienda.calificacion_servicio = Decimal(str(round(avg_servicio, 2)))
                tienda.calificacion_comida = Decimal(str(round(avg_comida, 2)))
                tienda.calificacion_tiempo = Decimal(str(round(avg_tiempo, 2)))
                tienda.num_calificaciones = num_calificaciones
            else:
                tienda.calificacion_servicio = Decimal('0')
                tienda.calificacion_comida = Decimal('0')
                tienda.calificacion_tiempo = Decimal('0')
                tienda.num_calificaciones = 0

            tienda.save(update_fields=[
                'calificacion_servicio',
                'calificacion_comida',
                'calificacion_tiempo',
                'num_calificaciones'
            ])

            return tienda
        except Tienda.DoesNotExist:
            return None

    @staticmethod
    def toggle_disponibilidad(tienda_id):
        """
        Toggle tienda disponibilidad status.
        """
        try:
            tienda = Tienda.objects.get(id=tienda_id)
            tienda.disponible = not tienda.disponible
            tienda.save(update_fields=['disponible'])
            return tienda
        except Tienda.DoesNotExist:
            return None

    @staticmethod
    def toggle_abierto(tienda_id):
        """
        Toggle tienda abierto status.
        """
        try:
            tienda = Tienda.objects.get(id=tienda_id)
            tienda.abierto = not tienda.abierto
            tienda.save(update_fields=['abierto'])
            return tienda
        except Tienda.DoesNotExist:
            return None

    @staticmethod
    def suspender_tienda(tienda_id, motivo=''):
        """
        Suspend a tienda.
        """
        try:
            tienda = Tienda.objects.get(id=tienda_id)
            tienda.suspendido = True
            tienda.motivo_suspension = motivo
            tienda.save(update_fields=['suspendido', 'motivo_suspension'])
            return tienda
        except Tienda.DoesNotExist:
            return None

    @staticmethod
    def activar_tienda(tienda_id):
        """
        Activate a suspended tienda.
        """
        try:
            tienda = Tienda.objects.get(id=tienda_id)
            tienda.suspendido = False
            tienda.motivo_suspension = ''
            tienda.save(update_fields=['suspendido', 'motivo_suspension'])
            return tienda
        except Tienda.DoesNotExist:
            return None


class CategoriaService:
    """
    Service class for categoria-related operations.
    """

    @staticmethod
    def get_categorias_por_tienda(tienda_id):
        """
        Get all categories for a tienda.
        """
        return Categoria.objects.filter(
            tienda_id=tienda_id,
            is_deleted=False
        ).order_by('orden', 'nombre')

    @staticmethod
    def get_categoria_by_id(categoria_id):
        """
        Get categoria by ID.
        """
        try:
            return Categoria.objects.get(id=categoria_id, is_deleted=False)
        except Categoria.DoesNotExist:
            return None


class MenuItemService:
    """
    Service class for menu item-related operations.
    """

    @staticmethod
    def get_menu_items_por_tienda(tienda_id, disponible_only=True):
        """
        Get all menu items for a tienda.
        """
        queryset = MenuItem.objects.filter(
            tienda_id=tienda_id,
            is_deleted=False
        )
        if disponible_only:
            queryset = queryset.filter(disponible=True)
        return queryset.order_by('orden', 'nombre')

    @staticmethod
    def get_menu_items_por_categoria(categoria_id, disponible_only=True):
        """
        Get all menu items for a categoria.
        """
        queryset = MenuItem.objects.filter(
            categoria_id=categoria_id,
            is_deleted=False
        )
        if disponible_only:
            queryset = queryset.filter(disponible=True)
        return queryset.order_by('orden', 'nombre')

    @staticmethod
    def get_menu_item_by_id(item_id):
        """
        Get menu item by ID.
        """
        try:
            return MenuItem.objects.get(id=item_id, is_deleted=False)
        except MenuItem.DoesNotExist:
            return None

    @staticmethod
    def toggle_disponibilidad(item_id):
        """
        Toggle menu item disponibilidad status.
        """
        try:
            item = MenuItem.objects.get(id=item_id)
            item.disponible = not item.disponible
            item.save(update_fields=['disponible'])
            return item
        except MenuItem.DoesNotExist:
            return None
