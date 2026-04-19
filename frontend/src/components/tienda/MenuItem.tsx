'use client';

import { useState } from 'react';
import { Plus, Minus, ShoppingCart, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/utils';
import type { MenuItem } from '@/types';

interface MenuItemCardProps {
  item: MenuItem;
  onAdd?: (item: MenuItem, quantity: number, comments: string) => void;
  onRemove?: (item: MenuItem) => void;
  isInCart?: boolean;
  cartQuantity?: number;
  showComments?: boolean;
}

export function MenuItemCard({
  item,
  onAdd,
  onRemove,
  isInCart = false,
  cartQuantity = 0,
  showComments = true,
}: MenuItemCardProps) {
  const [quantity, setQuantity] = useState(1);
  const [comments, setComments] = useState('');
  const [showCommentsInput, setShowCommentsInput] = useState(false);

  const handleAdd = () => {
    if (onAdd) {
      onAdd(item, quantity, comments);
      setQuantity(1);
      setComments('');
      setShowCommentsInput(false);
    }
  };

  if (!item.disponible) {
    return (
      <div className="relative bg-gray-50 rounded-xl p-4 opacity-60">
        <div className="flex gap-4">
          {item.imagen_url && (
            <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
              {/* Image would go here */}
            </div>
          )}
          <div className="flex-1">
            <h3 className="font-semibold text-gray-700">{item.nombre}</h3>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">
              {item.descripcion}
            </p>
            <div className="flex items-center justify-between mt-2">
              <span className="font-bold text-gray-700">
                {formatCurrency(item.precio)}
              </span>
              <span className="text-xs text-gray-500 bg-gray-200 px-2 py-1 rounded">
                Agotado
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4">
      <div className="flex gap-4">
        {/* Image */}
        {item.imagen_url && (
          <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            <img
              src={item.imagen_url}
              alt={item.nombre}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-gray-900">{item.nombre}</h3>
            <span className="font-bold text-primary whitespace-nowrap">
              {formatCurrency(item.precio)}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
            {item.descripcion}
          </p>

          {/* Cart Actions */}
          <div className="flex items-center justify-between mt-3">
            {isInCart ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onRemove?.(item)}
                  className="w-8 h-8 rounded-full bg-red-50 text-red-500 hover:bg-red-100 flex items-center justify-center transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-8 text-center font-semibold">
                  {cartQuantity}
                </span>
                <button
                  onClick={() => onAdd?.(item, 1, '')}
                  className="w-8 h-8 rounded-full bg-primary text-white hover:bg-primary/90 flex items-center justify-center transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  onAdd?.(item, 1, '');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                <span className="text-sm font-medium">Agregar</span>
              </button>
            )}

            {showComments && (
              <button
                onClick={() => setShowCommentsInput(!showCommentsInput)}
                className={cn(
                  'flex items-center gap-1 px-3 py-2 rounded-lg text-sm transition-colors',
                  showCommentsInput
                    ? 'bg-gray-100 text-gray-700'
                    : 'text-gray-500 hover:bg-gray-50'
                )}
              >
                <MessageSquare className="w-4 h-4" />
                <span>Notas</span>
              </button>
            )}
          </div>

          {/* Comments Input */}
          {showCommentsInput && (
            <div className="mt-3">
              <textarea
                placeholder="Ej: Sin cebolla, extra queso..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                rows={2}
              />
              {comments && (
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={() => {
                      setShowCommentsInput(false);
                      setComments('');
                    }}
                    className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAdd}
                    className="px-3 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    Agregar con nota
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Skeleton for loading state
export function MenuItemCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-card p-4 animate-pulse">
      <div className="flex gap-4">
        <div className="w-24 h-24 rounded-lg bg-gray-200" />
        <div className="flex-1 space-y-3">
          <div className="flex justify-between">
            <div className="w-32 h-5 bg-gray-200 rounded" />
            <div className="w-20 h-5 bg-gray-200 rounded" />
          </div>
          <div className="w-full h-4 bg-gray-200 rounded" />
          <div className="w-2/3 h-4 bg-gray-200 rounded" />
          <div className="w-24 h-8 bg-gray-200 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
