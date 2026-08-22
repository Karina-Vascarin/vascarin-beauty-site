"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cart';
import { useFavoritesStore } from '@/store/favorites';

export default function Header() {
  const [searchTerm, setSearchTerm] = useState('');
  const [clientData, setClientData] = useState<{name: string, phone: string} | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  // Conectando com as Lojas (Zustand)
  const cartStore = useCartStore() as any;
  const cartItems = cartStore.items || [];
  const toggleCart = cartStore.toggleCart;

  const favoritesStore = useFavoritesStore() as any;
  const favoritesItems = favoritesStore.items || []; 
  const toggleFavorites = favoritesStore.toggleFavorites;

  useEffect(() => {
    setIsMounted(true);
    const data = localStorage.getItem('vascarin_client');
    if (data) {
      try {
        setClientData(JSON.parse(data));
      } catch (e) {}
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchTerm.trim();
    if (!query) return;

    try {
      await supabase.from('buscas_site').insert([{
        termo: query,
        nome: clientData?.name || null,
        telefone: clientData?.phone ? clientData.phone.replace(/\D/g, '') : null,
        resultados: 1
      }]);
    } catch (error) {
      console.error("Erro ao registrar busca:", error);
    }

    router.push(`/?q=${encodeURIComponent(query)}`);
  };

  // Cálculos dos contadores
  const totalCartItems = cartItems.reduce((acc: number, item: any) => acc + (item.quantity || item.amount || 1), 0);
  const totalFavorites = favoritesItems.length;

  return (
    <header className="w-full bg-white border-b border-gray-200 py-3 px-4 sm:px-6 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 sm:gap-6">
        
        {/* LOGO */}
        <Link href="/" className="flex items-center shrink-0">
          <Image 
            src="/logo/logo_site.png" 
            alt="Vascarin Beauty" 
            width={160} 
            height={55} 
            priority
            className="object-contain h-8 sm:h-10 w-auto"
          />
        </Link>

        {/* BARRA DE PESQUISA */}
        <div className="flex-1 max-w-xl">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar perfumes, marcas..." 
              className="w-full bg-gray-50 border border-gray-200 text-xs text-gray-800 rounded-full py-2 sm:py-2.5 pl-4 pr-10 focus:outline-none focus:border-black transition-colors"
            />
            <button type="submit" className="absolute right-3 text-gray-400 hover:text-black transition-colors cursor-pointer flex items-center justify-center" title="Buscar">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </form>
        </div>

        {/* ÍCONES DE AÇÃO (FAVORITOS E SACOLA) */}
        <div className="flex items-center gap-1 sm:gap-3 shrink-0">
          
          {/* Botão de Favoritos */}
          <button 
            onClick={toggleFavorites} 
            className="relative p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            title="Meus Favoritos"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            {isMounted && totalFavorites > 0 && (
              <span className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center transform translate-x-1/4 -translate-y-1/4 border border-white">
                {totalFavorites}
              </span>
            )}
          </button>

          {/* Botão da Sacola */}
          <button 
            onClick={toggleCart} 
            className="relative p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            title="Minha Sacola"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            {isMounted && totalCartItems > 0 && (
              <span className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center transform translate-x-1/4 -translate-y-1/4 border border-white">
                {totalCartItems}
              </span>
            )}
          </button>

        </div>
      </div>
    </header>
  );
}