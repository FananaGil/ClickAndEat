"""
URL configuration for chat app.
"""

from django.urls import path
from .views import (
    ChatListView,
    ChatCreateView,
    ChatUnreadCountView,
    ComprobanteUploadView,
)

app_name = 'chat'

urlpatterns = [
    path('chat/<int:pedido_id>/', ChatListView.as_view(), name='chat_list'),
    path('chat/<int:pedido_id>/mensajes/', ChatCreateView.as_view(), name='chat_create'),
    path('chat/<int:pedido_id>/unread/', ChatUnreadCountView.as_view(), name='chat_unread'),
    path('chat/<int:pedido_id>/comprobante/', ComprobanteUploadView.as_view(), name='chat_comprobante'),
]
