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
  fetchCart: () => Promise<void>;
  toggleCart: (open?: boolean) => void;
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
        // Cart will be created on first add
      },

      addItem: async (productId, quantity, variantId) => {
        set({ isLoading: true });
        try {
          let { cartId } = get();
          if (!cartId) {
            // Create cart first
            const guestToken = `guest_${Date.now()}`;
            const cartRes = await api.post('/orders/cart/add', { productId, quantity, variantId, guestToken });
            // Backend creates cart on first add
            set({ cartId: cartRes.data.id });
          } else {
            await api.post('/orders/cart/add', { cartId, productId, quantity, variantId });
          }
          await get().fetchCart();
          set({ isOpen: true });
        } finally {
          set({ isLoading: false });
        }
      },

      fetchCart: async () => {
        const { cartId } = get();
        if (!cartId) return;
        const res = await api.get(`/orders/cart?cartId=${cartId}`);
        set({ items: res.data.items, subtotal: res.data.subtotal, itemCount: res.data.itemCount });
      },

      toggleCart: (open) => set((s) => ({ isOpen: open !== undefined ? open : !s.isOpen })),
    }),
    { name: 'blikcart-cart', partialize: (s) => ({ cartId: s.cartId }) }
  )
);
