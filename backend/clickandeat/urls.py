"""
URL configuration for clickandeat project.
"""

from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/', include('apps.tiendas.urls')),
    path('api/', include('apps.pedidos.urls')),
    path('api/', include('apps.chat.urls')),
    path('api/', include('apps.calificaciones.urls')),
    path('api/', include('apps.metrics.urls')),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
