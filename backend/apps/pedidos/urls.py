"""
URL configuration for pedidos app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PedidoViewSet, PedidoItemViewSet

app_name = 'pedidos'

router = DefaultRouter()
router.register(r'pedidos', PedidoViewSet, basename='pedido')

urlpatterns = [
    path('', include(router.urls)),
]
