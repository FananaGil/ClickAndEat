'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  ChefHat,
  Bike,
  Package,
  XCircle,
  MessageSquare,
  Upload,
  Star,
  Phone,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useChat } from '@/hooks/useChat';
import { ordersApi } from '@/lib/api';
import type { Pedido, PedidoItem, OrderStatus } from '@/types';

const STATUS_CONFIG: Record<string, {
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}> = {
  pendiente_pago: {
    label: 'Pendiente de pago',
    icon: <Clock className="w-5 h-5" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
  },
  esperando_comprobante: {
    label: 'Esperando comprobante',
    icon: <Upload className="w-5 h-5" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  pagado: {
    label: 'Pago recibido',
    icon: <CheckCircle className="w-5 h-5" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  confirmado: {
    label: 'Pedido confirmado',
    icon: <CheckCircle className="w-5 h-5" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  preparando: {
    label: 'Preparando',
    icon: <ChefHat className="w-5 h-5" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  listo: {
    label: 'Listo',
    icon: <Package className="w-5 h-5" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
  en_camino: {
    label: 'En camino',
    icon: <Bike className="w-5 h-5" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  completado: {
    label: 'Completado',
    icon: <CheckCircle className="w-5 h-5" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
  },
  cancelado: {
    label: 'Cancelado',
    icon: <XCircle className="w-5 h-5" />,
    color: 'text-red-600',
    bgColor: 'bg-red-100',
  },
};

const ESTADO_ORDEN = [
  'pendiente_pago',
  'esperando_comprobante',
  'confirmado',
  'preparando',
  'listo',
  'en_camino',
  'completado',
];

export default function PedidoPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { messages, sendMessage, uploadFile, loading: chatLoading } = useChat(resolvedParams.id);

  const [pedido, setPedido] = useState<Pedido | null>(null);
  const [items, setItems] = useState<PedidoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    loadPedido();
  }, [resolvedParams.id]);

  const loadPedido = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await ordersApi.getById(resolvedParams.id);

      if (response.success && response.data) {
        setPedido(response.data);
        setItems(response.data.items || []);
      } else {
        setError('Pedido no encontrado');
      }
    } catch (err) {
      setError('Error al cargar el pedido');
      console.error('Error loading order:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      await sendMessage({
        contenido: newMessage,
        tipo: 'texto',
      });
      setNewMessage('');
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Error al enviar el mensaje');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      alert('El archivo debe ser menor a 5MB');
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      alert('Solo se permiten imágenes JPG, PNG o WebP');
      return;
    }

    setUploadingFile(true);

    try {
      const formData = new FormData();
      formData.append('archivo', file);
      formData.append('tipo', 'imagen');
      formData.append('contenido', 'Comprobante de pago');

      await uploadFile(formData);
      alert('Comprobante subido exitosamente');
    } catch (err) {
      console.error('Error uploading file:', err);
      alert('Error al subir el comprobante');
    } finally {
      setUploadingFile(false);
    }
  };

  const getCurrentStatusIndex = () => {
    if (!pedido) return -1;
    return ESTADO_ORDEN.indexOf(pedido.estado);
  };

  const canCalificar = () => {
    return pedido?.estado === 'completado';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando pedido...</p>
        </div>
      </div>
    );
  }

  if (error || !pedido) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircle className="w-16 h-16 text-red-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            {error || 'Pedido no encontrado'}
          </h2>
          <Link href="/">
            <Button variant="primary">Volver al inicio</Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[pedido.estado] || STATUS_CONFIG.pendiente_pago;
  const currentIndex = getCurrentStatusIndex();

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-lg font-bold text-gray-800">
              Pedido #{pedido.numero_pedido}
            </h1>
            <div className="w-10" /> {/* Spacer for alignment */}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Status Card */}
        <div className={`${statusConfig.bgColor} rounded-2xl p-6 mb-6`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={statusConfig.color}>{statusConfig.icon}</div>
            <div>
              <h2 className={`text-lg font-bold ${statusConfig.color}`}>
                {statusConfig.label}
              </h2>
              {pedido.tiempo_estimado && (
                <p className="text-sm text-gray-600">
                  Tiempo estimado: {pedido.tiempo_estimado} min
                </p>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {pedido.estado !== 'cancelado' && pedido.estado !== 'pendiente_pago' && (
            <div className="relative">
              <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{
                    width: `${Math.max(0, Math.min(100, (currentIndex / (ESTADO_ORDEN.length - 2)) * 100))}%`,
                  }}
                />
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-500">
                <span>Pedido</span>
                <span>Preparando</span>
                <span>Listo</span>
                <span>Entregado</span>
              </div>
            </div>
          )}
        </div>

        {/* Store Info */}
        {pedido.tienda && (
          <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {pedido.tienda.logo_url && (
                  <img
                    src={pedido.tienda.logo_url}
                    alt={pedido.tienda.nombre}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                )}
                <div>
                  <h3 className="font-semibold text-gray-800">
                    {pedido.tienda.nombre}
                  </h3>
                  <Badge
                    variant={
                      pedido.tipo_servicio === 'delivery'
                        ? 'primary'
                        : pedido.tipo_servicio === 'pickup'
                        ? 'secondary'
                        : 'default'
                    }
                  >
                    {pedido.tipo_servicio === 'delivery'
                      ? 'Delivery'
                      : pedido.tipo_servicio === 'pickup'
                      ? 'Pickup'
                      : 'En sitio'}
                  </Badge>
                </div>
              </div>
              {pedido.tienda.telefono && (
                <a
                  href={`tel:${pedido.tienda.telefono}`}
                  className="p-2 bg-gray-100 rounded-full hover:bg-gray-200"
                >
                  <Phone className="w-5 h-5 text-gray-600" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-800">Productos</h3>
          </div>
          <div className="divide-y">
            {items.map((item) => (
              <div key={item.id} className="p-4">
                <div className="flex justify-between">
                  <div>
                    <span className="font-medium text-gray-800">
                      {item.cantidad}x {item.nombre}
                    </span>
                    {item.comentarios && (
                      <p className="text-sm text-gray-500 mt-1">
                        Nota: {item.comentarios}
                      </p>
                    )}
                  </div>
                  <span className="font-medium">
                    Bs. {(item.precio * item.cantidad).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 bg-gray-50">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Subtotal</span>
              <span>Bs. {pedido.subtotal?.toFixed(2) || '0.00'}</span>
            </div>
            {pedido.delivery > 0 && (
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Delivery</span>
                <span>Bs. {pedido.delivery.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-lg pt-2 border-t">
              <span>Total</span>
              <span className="text-orange-500">
                Bs. {pedido.total?.toFixed(2) || '0.00'}
              </span>
            </div>
          </div>
        </div>

        {/* Rating Section */}
        {canCalificar() && (
          <Link href={`/calificar/${pedido.id}`}>
            <div className="bg-gradient-to-r from-orange-500 to-yellow-500 rounded-xl p-6 mb-4 cursor-pointer hover:shadow-lg transition-shadow">
              <div className="flex items-center gap-3 text-white">
                <Star className="w-8 h-8 fill-current" />
                <div>
                  <h3 className="font-bold text-lg">¡Califica tu pedido!</h3>
                  <p className="text-sm opacity-90">
                    Tu opinión ayuda a mejorar el servicio
                  </p>
                </div>
              </div>
            </div>
          </Link>
        )}

        {/* Chat Toggle */}
        <button
          onClick={() => setShowChat(!showChat)}
          className="w-full bg-white rounded-xl p-4 shadow-sm flex items-center justify-between mb-4"
        >
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-orange-500" />
            <span className="font-semibold text-gray-800">Chat con la tienda</span>
          </div>
          <span className={`transform transition-transform ${showChat ? 'rotate-180' : ''}`}>
            ▼
          </span>
        </button>

        {/* Chat Section */}
        {showChat && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-4">
            <div className="h-64 overflow-y-auto p-4 space-y-3">
              {chatLoading ? (
                <div className="text-center text-gray-500 py-8">
                  Cargando mensajes...
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MessageSquare className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                  <p>No hay mensajes todavía</p>
                </div>
              ) : (
                messages.map((msg: any) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.emisor_tipo === 'usuario' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-xl px-4 py-2 ${
                        msg.emisor_tipo === 'usuario'
                          ? 'bg-orange-500 text-white'
                          : msg.tipo === 'sistema'
                          ? 'bg-gray-100 text-gray-600 text-sm'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {msg.tipo === 'imagen' ? (
                        <img
                          src={msg.archivo_url}
                          alt="Imagen"
                          className="rounded-lg max-w-full"
                        />
                      ) : (
                        <p>{msg.contenido}</p>
                      )}
                      <span className="text-xs opacity-70 block mt-1">
                        {new Date(msg.created_at).toLocaleTimeString('es-VE', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* File Upload */}
            {pedido.estado === 'esperando_comprobante' && (
              <div className="p-3 border-t">
                <label className="flex items-center justify-center gap-2 w-full py-2 bg-orange-50 text-orange-600 rounded-lg cursor-pointer hover:bg-orange-100 transition-colors">
                  <Upload className="w-5 h-5" />
                  <span className="text-sm font-medium">
                    {uploadingFile ? 'Subiendo...' : 'Subir comprobante'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploadingFile}
                  />
                </label>
              </div>
            )}

            {/* Message Input */}
            <div className="p-3 border-t flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                placeholder="Escribe un mensaje..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="w-10 h-10 bg-orange-500 text-white rounded-full flex items-center justify-center hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Action */}
      {!canCalificar() && pedido.estado !== 'cancelado' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
          <div className="max-w-2xl mx-auto px-4 py-4">
            {pedido.estado === 'pendiente_pago' && (
              <Link href="/carrito">
                <Button variant="primary" className="w-full">
                  Completar pago
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
