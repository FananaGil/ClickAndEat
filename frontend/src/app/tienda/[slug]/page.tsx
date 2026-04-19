'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Phone,
  Star,
  Clock,
  Truck,
  ShoppingBag,
  Utensils,
  ArrowLeft,
  Plus,
  Minus,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { MenuItem } from '@/components/tienda/MenuItem';
import { CategoriaList } from '@/components/tienda/CategoriaList';
import { useCart } from '@/hooks/useCart';
import { storesApi, menuApi } from '@/lib/api';
import type { Tienda, CategoriaMenu, CartItem } from '@/types';

type TipoServicio = 'delivery' | 'pickup' | 'sitio';

export default function TiendaPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { items, addItem, removeItem, updateQuantity, clearCart, tienda_id } = useCart();

  const [tienda, setTienda] = useState<Tienda | null>(null);
  const [menu, setMenu] = useState<CategoriaMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tipoServicio, setTipoServicio] = useState<TipoServicio>('delivery');
  const [showComments, setShowComments] = useState<Record<string, boolean>>({});
  const [itemComments, setItemComments] = useState<Record<string, string>>({});

  useEffect(() => {
    loadTienda();
  }, [resolvedParams.slug]);

  const loadTienda = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load store details
      const tiendaResponse = await storesApi.getBySlug(resolvedParams.slug);
      if (!tiendaResponse.success || !tiendaResponse.data) {
        setError('Tienda no encontrada');
        return;
      }
      setTienda(tiendaResponse.data);

      // Load menu
      const menuResponse = await menuApi.getByTienda(tiendaResponse.data.id);
      if (menuResponse.success && menuResponse.data) {
        setMenu(menuResponse.data.categorias || []);
      }
    } catch (err) {
      setError('Error al cargar la tienda');
      console.error('Error loading store:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (item: any) => {
    // Check if cart has items from different store
    if (tienda_id && tienda_id !== tienda?.id) {
      if (!confirm('Tu carrito tiene items de otra tienda. ¿Deseas vaciarlo?')) {
        return;
      }
      clearCart();
    }

    const comment = itemComments[item.id] || '';

    const cartItem: Omit<CartItem, 'id'> = {
      menu_item_id: item.id,
      nombre: item.nombre,
      precio: item.precio,
      cantidad: 1,
      comentarios: comment,
      imagen_url: item.imagen_url,
    };

    addItem(cartItem);
    setItemComments((prev) => ({ ...prev, [item.id]: '' }));
    setShowComments((prev) => ({ ...prev, [item.id]: false }));
  };

  const getCartItemQuantity = (menuItemId: string) => {
    return items.find((item) => item.menu_item_id === menuItemId)?.cantidad || 0;
  };

  const cartItemCount = items.reduce((sum, item) => sum + item.cantidad, 0);
  const cartTotal = items.reduce((sum, item) => sum + item.precio * item.cantidad, 0);

  const getEstimatedTime = () => {
    if (!tienda) return '';
    switch (tipoServicio) {
      case 'pickup':
        return `${tienda.tiempo_preparacion || 15} min`;
      case 'sitio':
        return `${tienda.tiempo_preparacion || 20} min`;
      default:
        return `${(tienda.tiempo_preparacion || 30) + 10} min`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-48 bg-gray-200 rounded-2xl mb-6" />
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
            <div className="h-4 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !tienda) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Utensils className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            {error || 'Tienda no encontrada'}
          </h2>
          <Link href="/">
            <Button variant="primary">Volver al inicio</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <Utensils className="w-6 h-6 text-orange-500" />
              <span className="font-bold text-lg">CLICK&EAT</span>
            </div>
            <Link href="/carrito" className="relative p-2">
              <ShoppingBag className="w-6 h-6" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Store Banner */}
      <div className="relative">
        <div
          className="h-48 bg-cover bg-center"
          style={{
            backgroundImage: tienda.banner_url
              ? `url(${tienda.banner_url})`
              : `linear-gradient(135deg, ${tienda.color_primario || '#FF6B35'} 0%, ${tienda.color_secundario || '#1A535C'} 100%)`,
          }}
        >
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-end gap-4">
              {tienda.logo_url && (
                <img
                  src={tienda.logo_url}
                  alt={tienda.nombre}
                  className="w-20 h-20 rounded-xl object-cover border-4 border-white shadow-lg"
                />
              )}
              <div className="flex-1 text-white">
                <h1 className="text-2xl font-bold mb-1">{tienda.nombre}</h1>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    {tienda.calificacion_comida?.toFixed(1) || '0.0'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {getEstimatedTime()}
                  </span>
                  {tienda.costo_delivery === 0 && (
                    <Badge variant="success">Delivery gratis</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Store Info */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2 text-gray-600">
            <MapPin className="w-5 h-5" />
            <span className="text-sm">{tienda.direccion}</span>
          </div>
          {tienda.telefono && (
            <a
              href={`tel:${tienda.telefono}`}
              className="flex items-center gap-2 text-gray-600 hover:text-orange-500"
            >
              <Phone className="w-5 h-5" />
              <span className="text-sm">{tienda.telefono}</span>
            </a>
          )}
        </div>

        {tienda.descripcion && (
          <p className="text-gray-600 mb-6">{tienda.descripcion}</p>
        )}

        {/* Service Type Selector */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
          <h3 className="font-semibold text-gray-800 mb-3">Tipo de servicio</h3>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setTipoServicio('delivery')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                tipoServicio === 'delivery'
                  ? 'border-orange-500 bg-orange-50 text-orange-600'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Truck className="w-6 h-6" />
              <span className="text-sm font-medium">Delivery</span>
              <span className="text-xs text-gray-500">
                {tienda.costo_delivery > 0 ? `Bs. ${tienda.costo_delivery}` : 'Gratis'}
              </span>
            </button>
            <button
              onClick={() => setTipoServicio('pickup')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                tipoServicio === 'pickup'
                  ? 'border-orange-500 bg-orange-50 text-orange-600'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <ShoppingBag className="w-6 h-6" />
              <span className="text-sm font-medium">Pickup</span>
              <span className="text-xs text-gray-500">
                {tienda.tiempo_preparacion || 15} min
              </span>
            </button>
            <button
              onClick={() => setTipoServicio('sitio')}
              className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                tipoServicio === 'sitio'
                  ? 'border-orange-500 bg-orange-50 text-orange-600'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <Utensils className="w-6 h-6" />
              <span className="text-sm font-medium">En sitio</span>
              <span className="text-xs text-gray-500">
                {tienda.tiempo_preparacion || 20} min
              </span>
            </button>
          </div>
        </div>

        {/* Menu */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-gray-800">Menú</h3>

          {menu.length === 0 ? (
            <div className="bg-white rounded-xl p-8 text-center">
              <Utensils className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Esta tienda aún no tiene productos disponibles.</p>
            </div>
          ) : (
            menu.map((categoria) => (
              <div key={categoria.id} className="bg-white rounded-xl p-4 shadow-sm">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  {categoria.icono && <span>{categoria.icono}</span>}
                  {categoria.nombre}
                </h4>
                <div className="space-y-3">
                  {categoria.items.map((item) => {
                    const quantity = getCartItemQuantity(item.id);
                    return (
                      <div key={item.id}>
                        <MenuItem
                          item={item}
                          onAdd={() => handleAddToCart(item)}
                          quantity={quantity}
                          onIncrease={() => handleAddToCart(item)}
                          onDecrease={() => {
                            const cartItem = items.find(
                              (i) => i.menu_item_id === item.id
                            );
                            if (cartItem) {
                              removeItem(cartItem.id);
                            }
                          }}
                          onShowComments={() =>
                            setShowComments((prev) => ({
                              ...prev,
                              [item.id]: !prev[item.id],
                            }))
                          }
                          showComments={showComments[item.id]}
                          comment={itemComments[item.id] || ''}
                          onCommentChange={(comment) =>
                            setItemComments((prev) => ({
                              ...prev,
                              [item.id]: comment,
                            }))
                          }
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Cart Floating Bar */}
      {cartItemCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <Link href="/carrito">
              <Button variant="primary" className="w-full flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5" />
                  Ver carrito ({cartItemCount} items)
                </span>
                <span className="font-bold">Bs. {cartTotal.toFixed(2)}</span>
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
