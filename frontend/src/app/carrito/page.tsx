'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  MapPin,
  MessageSquare,
  Clock,
  Truck,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useCart } from '@/hooks/useCart';
import { storesApi } from '@/lib/api';
import type { Tienda } from '@/types';

type TipoServicio = 'delivery' | 'pickup' | 'sitio';

export default function CarritoPage() {
  const router = useRouter();
  const {
    items,
    tienda_id,
    updateQuantity,
    removeItem,
    updateComments,
    clear,
    subtotal,
    delivery,
    total,
  } = useCart();

  const [tienda, setTienda] = useState<Tienda | null>(null);
  const [loading, setLoading] = useState(false);
  const [direccion, setDireccion] = useState('');
  const [instrucciones, setInstrucciones] = useState('');
  const [tipoServicio, setTipoServicio] = useState<TipoServicio>('delivery');
  const [editandoComentario, setEditandoComentario] = useState<string | null>(null);
  const [comentarioTemporal, setComentarioTemporal] = useState('');

  useEffect(() => {
    if (tienda_id) {
      loadTienda();
    }
  }, [tienda_id]);

  const loadTienda = async () => {
    try {
      const response = await storesApi.getById(tienda_id!);
      if (response.success && response.data) {
        setTienda(response.data);
      }
    } catch (err) {
      console.error('Error loading tienda:', err);
    }
  };

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(itemId);
    } else {
      updateQuantity(itemId, newQuantity);
    }
  };

  const handleEditComment = (itemId: string, currentComment: string) => {
    setEditandoComentario(itemId);
    setComentarioTemporal(currentComment);
  };

  const handleSaveComment = (itemId: string) => {
    updateComments(itemId, comentarioTemporal);
    setEditandoComentario(null);
    setComentarioTemporal('');
  };

  const handleConfirmarPedido = async () => {
    if (items.length === 0) return;

    if (tipoServicio === 'delivery' && !direccion.trim()) {
      alert('Por favor ingresa una dirección de entrega');
      return;
    }

    setLoading(true);

    try {
      // Prepare order data
      const orderData = {
        items: items.map((item) => ({
          menu_item_id: item.menu_item_id,
          cantidad: item.cantidad,
          comentarios: item.comentarios,
        })),
        tipo_servicio: tipoServicio,
        direccion_entrega: tipoServicio === 'delivery' ? direccion : undefined,
        instrucciones_entrega: tipoServicio === 'delivery' ? instrucciones : undefined,
        metodo_pago: 'transferencia', // Default for now
      };

      // Call API to create order
      const { ordersApi } = await import('@/lib/api');
      const response = await ordersApi.create(orderData);

      if (response.success && response.data) {
        // Clear cart and redirect to order tracking
        clear();
        router.push(`/pedido/${response.data.id}`);
      } else {
        alert('Error al crear el pedido. Intenta de nuevo.');
      }
    } catch (err) {
      console.error('Error creating order:', err);
      alert('Error al crear el pedido. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-40">
          <div className="max-w-2xl mx-auto px-4 py-3">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.back()}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-bold text-gray-800">Tu Carrito</h1>
            </div>
          </div>
        </header>

        {/* Empty Cart */}
        <div className="max-w-2xl mx-auto px-4 py-16 text-center">
          <ShoppingBag className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            Tu carrito está vacío
          </h2>
          <p className="text-gray-400 mb-6">
            Agrega productos de alguna tienda para comenzar.
          </p>
          <Link href="/">
            <Button variant="primary">Ver tiendas</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-gray-800">Tu Carrito</h1>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Store Info */}
        {tienda && (
          <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <div className="flex items-center gap-3">
              {tienda.logo_url && (
                <img
                  src={tienda.logo_url}
                  alt={tienda.nombre}
                  className="w-12 h-12 rounded-lg object-cover"
                />
              )}
              <div>
                <h3 className="font-semibold text-gray-800">{tienda.nombre}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Clock className="w-4 h-4" />
                  {tienda.tiempo_preparacion || 20} min
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Service Type */}
        <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">Tipo de servicio</h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setTipoServicio('delivery')}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                tipoServicio === 'delivery'
                  ? 'border-orange-500 bg-orange-50 text-orange-600'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Truck className="w-5 h-5" />
              <span className="text-xs font-medium">Delivery</span>
            </button>
            <button
              onClick={() => setTipoServicio('pickup')}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                tipoServicio === 'pickup'
                  ? 'border-orange-500 bg-orange-50 text-orange-600'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="text-xs font-medium">Pickup</span>
            </button>
            <button
              onClick={() => setTipoServicio('sitio')}
              className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                tipoServicio === 'sitio'
                  ? 'border-orange-500 bg-orange-50 text-orange-600'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <span className="text-lg">🍽️</span>
              <span className="text-xs font-medium">En sitio</span>
            </button>
          </div>
        </div>

        {/* Delivery Address */}
        {tipoServicio === 'delivery' && (
          <div className="bg-white rounded-xl p-4 mb-4 shadow-sm">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-orange-500" />
              Dirección de entrega
            </h3>
            <div className="space-y-3">
              <Input
                placeholder="Ej: Av. Manaure, Casa #123"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
              />
              <textarea
                placeholder="Instrucciones adicionales (opcional)"
                value={instrucciones}
                onChange={(e) => setInstrucciones(e.target.value)}
                className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                rows={2}
              />
            </div>
          </div>
        )}

        {/* Cart Items */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-gray-800">
              Productos ({items.length})
            </h3>
          </div>

          <div className="divide-y">
            {items.map((item) => (
              <div key={item.id} className="p-4">
                <div className="flex gap-3">
                  {item.imagen_url && (
                    <img
                      src={item.imagen_url}
                      alt={item.nombre}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex justify-between">
                      <h4 className="font-medium text-gray-800">{item.nombre}</h4>
                      <span className="font-semibold text-gray-800">
                        Bs. {(item.precio * item.cantidad).toFixed(2)}
                      </span>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleQuantityChange(item.id, item.cantidad - 1)}
                          className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium">
                          {item.cantidad}
                        </span>
                        <button
                          onClick={() => handleQuantityChange(item.id, item.cantidad + 1)}
                          className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-600 p-2"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Comment Section */}
                    <div className="mt-3">
                      {editandoComentario === item.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={comentarioTemporal}
                            onChange={(e) => setComentarioTemporal(e.target.value)}
                            placeholder="Ej: Sin cebolla, término medio..."
                            className="w-full p-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveComment(item.id)}
                              className="text-sm text-orange-500 hover:text-orange-600"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={() => setEditandoComentario(null)}
                              className="text-sm text-gray-500 hover:text-gray-600"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditComment(item.id, item.comentarios)}
                          className="flex items-center gap-1 text-sm text-gray-500 hover:text-orange-500"
                        >
                          <MessageSquare className="w-4 h-4" />
                          {item.comentarios || 'Agregar nota'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-white rounded-xl p-4 mt-4 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">Resumen del pedido</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal</span>
              <span className="font-medium">Bs. {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Delivery</span>
              <span className="font-medium">
                {tipoServicio === 'delivery' && tienda?.costo_delivery ? (
                  `Bs. ${tienda.costo_delivery.toFixed(2)}`
                ) : (
                  <span className="text-green-600">Gratis</span>
                )}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t">
              <span className="font-semibold text-gray-800">Total</span>
              <span className="font-bold text-xl text-orange-500">
                Bs. {total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Method Note */}
        <div className="bg-amber-50 rounded-xl p-4 mt-4">
          <p className="text-sm text-amber-800">
            <strong>Método de pago:</strong> Transferencia o Pago Móvil.
            Después de confirmar, podrás subir el comprobante de pago en el chat con la tienda.
          </p>
        </div>
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <Button
            variant="primary"
            className="w-full"
            onClick={handleConfirmarPedido}
            loading={loading}
          >
            Confirmar Pedido · Bs. {total.toFixed(2)}
          </Button>
        </div>
      </div>
    </div>
  );
}
