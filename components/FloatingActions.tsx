"use client";

import { useCartStore } from '@/store/cart';
import { useFavoritesStore } from '@/store/favorites';
import { useEffect, useState } from 'react';

export default function FloatingActions() {
  const [isMounted, setIsMounted] = useState(false);

  const cartStore = useCartStore() as any;
  const items = cartStore.items || [];
  const toggleCart = cartStore.toggleCart;
  
  const favoritesStore = useFavoritesStore() as any;
  const favorites = favoritesStore.items || []; // <-- CORREÇÃO AQUI: o padrão costuma ser 'items' na store, e não 'favorites'. Se não funcionar, mudamos para 'favorites'.
  const toggleFavorites = favoritesStore.toggleFavorites;

  // Garante que a hidratação aconteça corretamente para evitar erros de renderização com o Zustand
  useEffect(() => {
    setIsMounted(true);
  }, []);

  const totalItemsCount = items.reduce((acc: number, item: any) => acc + (item.quantity || item.amount || 1), 0);
  const totalFavoritesCount = favorites.length;

  const handleWhatsAppClick = () => {
    const telefoneLoja = "5511992465042";
    const mensagem = "Olá! Gostaria de tirar uma dúvida sobre os produtos da Vascarin Beauty.";
    window.open(`https://wa.me/${telefoneLoja}?text=${encodeURIComponent(mensagem)}`, '_blank');
  };

  // Se não montou ainda, não renderiza para não dar erro de hidratação
  if (!isMounted) return null;

  return (
    <div className="fixed bottom-24 right-4 z-40 flex flex-col gap-3 items-end">
      
      {/* Botão Flutuante do WhatsApp */}
      <button 
        onClick={handleWhatsAppClick}
        className="relative bg-green-500 text-white w-12 h-12 rounded-full shadow-lg hover:bg-green-600 transition-all flex items-center justify-center cursor-pointer"
        title="Falar no WhatsApp"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.955c-.001 5.45-4.436 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
        </svg>
      </button>

      {/* Botão de Favoritos */}
      <button 
        onClick={toggleFavorites} 
        className="relative bg-white text-zinc-800 border border-gray-200 w-12 h-12 rounded-full shadow-lg hover:bg-gray-50 transition-all flex items-center justify-center cursor-pointer"
        title="Favoritos"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
        {totalFavoritesCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md">
            {totalFavoritesCount}
          </span>
        )}
      </button>

      {/* Botão da Sacola */}
      <button 
        onClick={toggleCart} 
        className="relative bg-black text-white w-12 h-12 rounded-full shadow-lg hover:bg-zinc-800 transition-all flex items-center justify-center cursor-pointer"
        title="Sacola de Compras"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
        {totalItemsCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md">
            {totalItemsCount}
          </span>
        )}
      </button>

    </div>
  );
}