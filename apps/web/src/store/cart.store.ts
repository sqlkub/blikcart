import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/lib/api';

interface CartState {
  cartId: string | null;
  items: any[];
  subtotal: number;
  itemCount: number;
  isOpen: boolean;
  isLoading: boolean;
  initCart: () => Promise<void>;
  addItem: (productId: string, quantity: number, variantId?: string) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  fetchCart: () => Promise<void>;
  toggleCart: (open?: boolean) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cartId: null,
      items: [],
      subtotal: 0,
      itemCount: 0,
      isOpen: false,
      isLoading: false,

      initCart: async () => {
        const { cartId } = get();
        if (cartId) {
          await get().fetchCart();
        }
      },

      addItem: async (productId, quantity, variantId) => {
        set({ isLoading: true });
        try {
          let { cartId } = get();
          if (!cartId) {
            const guestToken = `guest_${Date.now()}_${Math.random().toString(36).slice(2)}`;
            const cartRes = await api.post('/orders/cart', { guestToken });
            cartId = cartRes.data.id;
            set({ cartId });
          }
          await api.post('/orders/cart/add', { cartId, productId, quantity, variantId });
          await get().fetchCart();
          set({ isOpen: true });
        } finally {
          set({ isLoading: false });
        }
      },

      removeItem: async (itemId) => {
        const { cartId } = get();
        if (!cartId) return;
        await api.delete(`/orders/cart/item/${itemId}`);
        await get().fetchCart();
      },

      fetchCart: async () => {
        const { cartId } = get();
        if (!cartId) return;
        try {
          const res = await api.get(`/orders/cart?cartId=${cartId}`);
          set({ items: res.data.items, subtotal: res.data.subtotal, itemCount: res.data.itemCount });
        } catch {
          set({ cartId: null, items: [], subtotal: 0, itemCount: 0 });
        }
      },

      toggleCart: (open) => set((s) => ({ isOpen: open !== undefined ? open : !s.isOpen })),

      clearCart: () => set({ cartId: null, items: [], subtotal: 0, itemCount: 0, isOpen: false }),
    }),
    { name: 'blikcart-cart', partialize: (s) => ({ cartId: s.cartId }) }
  )
);
