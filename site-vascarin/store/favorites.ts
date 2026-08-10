import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface FavoritesState {
  items: any[];
  isOpen: boolean;
  toggleFavorites: () => void;
  addItem: (product: any) => void;
  removeItem: (identifier: string | number) => void;
  clearFavorites: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      toggleFavorites: () => set((state) => ({ isOpen: !state.isOpen })),
      addItem: (product) => {
        const currentItems = get().items;
        const productId = product.id || product.nome;
        
        // Verifica se já existe para não duplicar
        const exists = currentItems.some((item) => (item.id || item.nome) === productId);
        
        if (!exists) {
          set({ items: [...currentItems, product] });
        }
      },
      removeItem: (identifier) => {
        set({
          items: get().items.filter(
            (item) => item.id !== identifier && item.nome !== identifier
          ),
        });
      },
      clearFavorites: () => set({ items: [] }),
    }),
    {
      name: 'vascarin-favorites-storage',
    }
  )
);