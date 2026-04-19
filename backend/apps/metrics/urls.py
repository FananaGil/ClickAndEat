"""
URL configuration for metrics app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import MetricsViewSet, TiendaMetricsViewSet

router = DefaultRouter()
router.register(r'metrics', MetricsViewSet, basename='metrics')

urlpatterns = [
    path('', include(router.urls)),
    path('tienda/<uuid:pk>/', TiendaMetricsViewSet.as_view({'get': 'retrieve'}), name='tienda-metrics'),
]
