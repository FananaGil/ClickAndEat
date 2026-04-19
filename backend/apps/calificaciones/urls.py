"""
URL configuration for calificaciones app.
"""

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    CalificacionViewSet,
    MisCalificacionesView,
    CalificacionDetalleView,
)

router = DefaultRouter()
router.register(r'calificaciones', CalificacionViewSet, basename='calificacion')

urlpatterns = [
    path('', include(router.urls)),
    path('mis-calificaciones/', MisCalificacionesView.as_view(), name='mis-calificaciones'),
    path('calificacion/<int:pk>/', CalificacionDetalleView.as_view(), name='calificacion-detalle'),
]
