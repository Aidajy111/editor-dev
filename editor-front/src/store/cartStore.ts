import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem } from '../types/cart'

type CartState = {
  items: CartItem[]
  addItem: (item: CartItem) => void
  removeItem: (id: string) => void
  clear: () => void
}

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((state) => ({ items: [item, ...state.items] })),
      removeItem: (id) => set((state) => ({ items: state.items.filter((x) => x.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: 'editor-cart',
      partialize: (state) => ({
        // сохраняем только items, но можно ещё фильтровать поля
        items: state.items.map((it) => ({
          ...it,
          // если у item есть previewDataUrl — не сохраняем его
          previewDataUrl: undefined,
        })),
      }),
    }
  )
)