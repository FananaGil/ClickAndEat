'use client';

import { useCallback } from 'react';
import { useCart, selectCartItemCount, selectCartTotal } from '@/store/cartStore';
import type { CartItem } from '@/types';

export function useCart() {
  const store = useCart();

  const addItem = useCallback(
    (item: Omit<CartItem, 'id'>) => {
      store.addItem(item);
    },
    [store]
  );

  const removeItem = useCallback(
    (id: string) => {
      store.removeItem(id);
    },
    [store]
  );

  const updateQuantity = useCallback(
    (id: string, cantidad: number) => {
      store.updateQuantity(id, cantidad);
    },
    [store]
  );

  const updateComments = useCallback(
    (id: string, comentarios: string) => {
      store.updateComments(id, comentarios);
    },
    [store]
  );

  const clearCart = useCallback(() => {
    store.clear();
  }, [store]);

  const getItemCount = useCallback(() => {
    return selectCartItemCount(useCart.getState());
  }, []);

  const getTotal = useCallback(() => {
    return selectCartTotal(useCart.getState());
  }, []);

  const isInCart = useCallback(
    (menuItemId: string) => {
      return store.items.some((i) => i.menu_item_id === menuItemId);
    },
    [store.items]
  );

  return {
    items: store.items,
    tienda_id: store.tienda_id,
    subtotal: store.subtotal,
    delivery: store.delivery,
    total: store.total,
    addItem,
    removeItem,
    updateQuantity,
    updateComments,
    clearCart,
    getItemCount,
    getTotal,
    isInCart,
  };
}
