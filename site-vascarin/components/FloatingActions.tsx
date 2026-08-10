"use client";

import { useCartStore } from '@/store/cart';
import { useFavoritesStore } from '@/store/favorites';

export default function FloatingActions() {
  const { toggleCart, items: cartItems } = useCartStore();
  const { toggleFavorites, items: favoriteItems } = useFavoritesStore();

  // Conta a quantidade total de itens no carrinho e favoritos
  const cartCount = cartItems.reduce((acc, item) => acc + item.quantidade, 0);
  const favCount = favoriteItems.length;

  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col gap-3">
      
      {/* Botão de Favoritos */}
      <button 
        onClick={toggleFavorites}
        className="w-14 h-14 bg-white border border-gray-100 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center text-gray-700 hover:text-red-600 transition-all hover:scale-105 relative"
        aria-label="Abrir Favoritos"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
        {favCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[11px] font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            {favCount}
          </span>
        )}
      </button>

      {/* Botão da Sacola */}
      <button 
        onClick={toggleCart}
        className="w-14 h-14 bg-black text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.2)] flex items-center justify-center hover:bg-zinc-800 transition-all hover:scale-105 relative"
        aria-label="Abrir Sacola"
      >
        {/* Ícone de Sacola de Compras */}
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
        {cartCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#b90000] text-white text-[11px] font-bold w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
            {cartCount}
          </span>
        )}
      </button>

    </div>
  );
}