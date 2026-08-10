import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id?: string | number;
  nome: string;
  preco: number;
  imagem: string;
  quantity: number;
  [key: string]: any;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  toggleCart: () => void;
  addItem: (product: any) => void;
  removeItem: (identifier: string | number) => void;
  updateQuantity: (identifier: string | number, quantity: number) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      toggleCart: () => set((state) => ({ isOpen: !state.isOpen })),
      
      addItem: (product) => {
        const currentItems = get().items;
        const identifier = product.id || product.nome;
        const existingIndex = currentItems.findIndex(item => (item.id || item.nome) === identifier);

        // Garante que o preço salvo seja sempre puramente numérico
        let cleanPrice = Number(product.preco) || 0;

        if (existingIndex > -1) {
          const newItems = [...currentItems];
          newItems[existingIndex].quantity += 1;
          set({ items: newItems, isOpen: true });
        } else {
          set({
            items: [...currentItems, { ...product, preco: cleanPrice, quantity: 1 }],
            isOpen: true
          });
        }
      },

      removeItem: (identifier) => {
        set({
          items: get().items.filter(item => (item.id || item.nome) !== identifier)
        });
      },

      updateQuantity: (identifier, quantity) => {
        if (quantity <= 0) {
          get().removeItem(identifier);
          return;
        }
        set({
          items: get().items.map(item => 
            (item.id || item.nome) === identifier ? { ...item, quantity } : item
          )
        });
      },

      clearCart: () => set({ items: [] })
    }),
    {
      name: 'vascarin-cart-storage',
    }
  )
);