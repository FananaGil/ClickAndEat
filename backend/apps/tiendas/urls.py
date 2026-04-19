"""
URL configuration for tiendas app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    TiendaViewSet,
    CategoriaViewSet,
    MenuItemViewSet,
    TiendaDuenoView,
    TiendaMenuItemsView,
)

app_name = 'tiendas'

router = DefaultRouter()
router.register(r'tiendas', TiendaViewSet, basename='tienda')
router.register(r'categorias', CategoriaViewSet, basename='categoria')
router.register(r'menu-items', MenuItemViewSet, basename='menuitem')

urlpatterns = [
    path('', include(router.urls)),
    path('mis-tiendas/', TiendaDuenoView.as_view(), name='mis_tiendas'),
    path('tiendas/<slug:slug>/menu/', TiendaMenuItemsView.as_view(), name='tienda_menu'),
]
