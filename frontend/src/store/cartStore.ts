import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, CartStore } from '@/types';

export const useCart = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      tienda_id: null,

      addItem: (item: Omit<CartItem, 'id'>) => {
        const existingItem = get().items.find(
          (i) => i.menu_item_id === item.menu_item_id && i.comentarios === item.comentarios
        );

        if (existingItem) {
          set((state) => ({
            items: state.items.map((i) =>
              i.id === existingItem.id
                ? { ...i, cantidad: i.cantidad + item.cantidad }
                : i
            ),
          }));
        } else {
          set((state) => ({
            items: [
              ...state.items,
              { ...item, id: crypto.randomUUID() },
            ],
          }));
        }
      },

      removeItem: (id: string) => {
        set((state) => ({
          items: state.items.filter((i) => i.id !== id),
        }));
      },

      updateQuantity: (id: string, cantidad: number) => {
        if (cantidad <= 0) {
          get().removeItem(id);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, cantidad } : i
          ),
        }));
      },

      updateComments: (id: string, comentarios: string) => {
        set((state) => ({
          items: state.items.map((i) =>
            i.id === id ? { ...i, comentarios } : i
          ),
        }));
      },

      clear: () => {
        set({ items: [], tienda_id: null });
      },

      get subtotal() {
        return get().items.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
      },

      get delivery() {
        // Delivery is set when the store is selected
        // This is a placeholder - actual implementation would fetch from store
        return 0;
      },

      get total() {
        return this.subtotal + this.delivery;
      },
    }),
    {
      name: 'clickandeat-cart',
      partialize: (state) => ({
        items: state.items,
        tienda_id: state.tienda_id,
      }),
    }
  )
);

// Helper selectors
export const selectCartItemCount = (state: CartStore) =>
  state.items.reduce((sum, i) => sum + i.cantidad, 0);

export const selectCartTotal = (state: CartStore) => {
  const subtotal = state.items.reduce((sum, i) => sum + i.precio * i.cantidad, 0);
  return subtotal + state.delivery;
};

export const selectIsInCart = (menuItemId: string) => (state: CartStore) =>
  state.items.some((i) => i.menu_item_id === menuItemId);

export const selectCartItemsByStore = (tiendaId: string) => (state: CartStore) =>
  state.items;
