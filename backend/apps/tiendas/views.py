"""
Views for tiendas app.
"""

from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, F
from django.shortcuts import get_object_or_404

from core.permissions import IsOwner, IsTiendaOwner, IsSuperAdmin, IsAuthenticated
from core.utils import calculate_distance, is_within_radius
from .models import Tienda, Categoria, MenuItem
from .serializers import (
    TiendaListSerializer,
    TiendaDetailSerializer,
    TiendaCreateUpdateSerializer,
    CategoriaSerializer,
    CategoriaListSerializer,
    CategoriaCreateUpdateSerializer,
    MenuItemSerializer,
    MenuItemListSerializer,
    MenuItemCreateUpdateSerializer,
)


class TiendaViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Tienda model with geo filtering support.
    """
    queryset = Tienda.objects.filter(is_deleted=False)
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['disponible', 'abierto', 'suspendido']
    search_fields = ['nombre', 'descripcion', 'direccion']
    ordering_fields = ['nombre', 'calificacion_servicio', 'created_at']

    def get_serializer_class(self):
        if self.action == 'list':
            return TiendaListSerializer
        elif self.action in ['create', 'update', 'partial_update']:
            return TiendaCreateUpdateSerializer
        return TiendaDetailSerializer

    def get_permissions(self):
        if self.action in ['create']:
            return [IsAuthenticated()]
        elif self.action in ['update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsTiendaOwner()]
        return super().get_permissions()

    def get_queryset(self):
        queryset = super().get_queryset()

        # Geo filtering
        lat = self.request.query_params.get('lat')
        lng = self.request.query_params.get('lng')
        radio = self.request.query_params.get('radio')  # km

        if lat and lng and radio:
            try:
                lat = float(lat)
                lng = float(lng)
                radio = float(radio)

                # Filter stores within radius
                stores_with_distance = []
                for tienda in queryset:
                    distance = calculate_distance(lat, lng, tienda.lat, tienda.lng)
                    if distance <= radio:
                        tienda.distancia = round(distance, 2)
                        stores_with_distance.append(tienda)

                return stores_with_distance
            except (ValueError, TypeError):
                pass

        return queryset

    def get_object(self):
        queryset = self.get_queryset()
        slug = self.kwargs.get('slug')

        if 'slug' in self.kwargs:
            obj = get_object_or_404(queryset, slug=slug)
        else:
            obj = super().get_object()

        # Check permissions
        self.check_object_permissions(self.request, obj)
        return obj

    def perform_create(self, serializer):
        serializer.save(dueno=self.request.user)

    @action(detail=True, methods=['get'])
    def menu(self, request, slug=None):
        """
        Get full menu for a store.
        """
        tienda = self.get_object()
        categorias = Categoria.objects.filter(
            tienda=tienda,
            is_deleted=False
        ).prefetch_related('items')

        serializer = CategoriaSerializer(categorias, many=True)
        return Response({
            'tienda': TiendaListSerializer(tienda).data,
            'categorias': serializer.data
        })

    @action(detail=True, methods=['get'])
    def categorias(self, request, slug=None):
        """
        Get categories for a store.
        """
        tienda = self.get_object()
        categorias = Categoria.objects.filter(
            tienda=tienda,
            is_deleted=False
        )
        serializer = CategoriaListSerializer(categorias, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def destacadas(self, request):
        """
        Get featured/highlighted stores.
        """
        tiendas = Tienda.objects.filter(
            is_deleted=False,
            disponible=True,
            abierto=True,
            suspendido=False
        ).order_by('-calificacion_servicio')[:10]

        serializer = TiendaListSerializer(tiendas, many=True)
        return Response(serializer.data)


class CategoriaViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Categoria model.
    """
    serializer_class = CategoriaSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['tienda']
    ordering_fields = ['orden', 'nombre']

    def get_queryset(self):
        return Categoria.objects.filter(is_deleted=False)

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return CategoriaCreateUpdateSerializer
        elif self.action == 'list':
            return CategoriaListSerializer
        return CategoriaSerializer

    def perform_create(self, serializer):
        tienda_id = self.request.data.get('tienda')
        if tienda_id:
            tienda = get_object_or_404(Tienda, id=tienda_id)
            if self.request.user != tienda.dueno and not self.request.user.is_superadmin:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied('No tienes permiso para agregar categorías a esta tienda.')
        serializer.save()


class MenuItemViewSet(viewsets.ModelViewSet):
    """
    ViewSet for MenuItem model.
    """
    serializer_class = MenuItemSerializer
    permission_classes = [AllowAny]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['tienda', 'categoria', 'disponible']
    search_fields = ['nombre', 'descripcion']
    ordering_fields = ['orden', 'nombre', 'precio']

    def get_queryset(self):
        return MenuItem.objects.filter(is_deleted=False)

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return super().get_permissions()

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return MenuItemCreateUpdateSerializer
        elif self.action == 'list':
            return MenuItemListSerializer
        return MenuItemSerializer

    def perform_create(self, serializer):
        tienda_id = self.request.data.get('tienda')
        if tienda_id:
            tienda = get_object_or_404(Tienda, id=tienda_id)
            if self.request.user != tienda.dueno and not self.request.user.is_superadmin:
                from rest_framework.exceptions import PermissionDenied
                raise PermissionDenied('No tienes permiso para agregar productos a esta tienda.')
        serializer.save()


class TiendaDuenoView(generics.ListAPIView):
    """
    View for listing stores owned by the current user.
    """
    serializer_class = TiendaListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Tienda.objects.filter(
            dueno=self.request.user,
            is_deleted=False
        )


class TiendaMenuItemsView(generics.ListAPIView):
    """
    View for listing all menu items of a specific store.
    """
    serializer_class = MenuItemListSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        slug = self.kwargs.get('slug')
        tienda = get_object_or_404(Tienda, slug=slug, is_deleted=False)
        return MenuItem.objects.filter(
            tienda=tienda,
            is_deleted=False
        )
