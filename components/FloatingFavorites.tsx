"use client";

import { useFavoritesStore } from '@/store/favorites'; // Ajuste o caminho se a sua store tiver outro nome
import { useCartStore } from '@/store/cart';
import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function FloatingFavorites() {
  const [isMounted, setIsMounted] = useState(false);
  
  const favStore = useFavoritesStore() as any;
  const items = favStore.items || [];
  const isOpen = favStore.isOpen;
  const toggleFavorites = favStore.toggleFavorites;
  const removeItem = favStore.removeItem;
  
  const cartStore = useCartStore() as any;
  const addToCart = cartStore.addItem;

  // 1. Controle de hidratação (evita erros no Next.js)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // 2. Rastreamento em TEMPO REAL de Favoritos
  useEffect(() => {
    if (!isMounted) return;
    
    const clientData = localStorage.getItem('vascarin_client');
    if (clientData) {
      try {
        const client = JSON.parse(clientData);
        fetch('/api/favoritos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telefone: client.phone,
            nome: client.name,
            items: items
          })
        });
      } catch (err) {
        console.error("Erro ao salvar favoritos no Supabase", err);
      }
    }
  }, [items, isMounted]); // Salva a cada novo favorito adicionado ou removido!

  if (!isMounted) return null;
  if (!isOpen) return null;

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const handleAddAndClose = (item: any) => {
    addToCart(item);
    removeItem(item.id || item.nome);
    toggleFavorites();
    cartStore.toggleCart();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        
        {/* Cabeçalho */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-pink-50">
          <h2 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-2">
            💖 Lista de Desejos ({items.length})
          </h2>
          <button onClick={toggleFavorites} className="text-gray-400 hover:text-black transition-colors cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* Lista de Favoritos */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <p className="text-gray-400 text-sm mb-4">Você ainda não favoritou nenhum produto.</p>
              <button onClick={toggleFavorites} className="bg-black text-white text-xs font-bold uppercase px-6 py-3 hover:bg-[#b90000] transition-colors cursor-pointer">
                Ver Catálogo
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {items.map((item: any, index: number) => {
                let imageSrc = "";
                const semImagem = !item.imagem || String(item.imagem).includes('default-image');
                if (!semImagem) {
                  let rawPath = String(item.imagem).replace(/[\r\n]+/g, '').trim();
                  if (rawPath.startsWith('/produtos/')) rawPath = rawPath.replace('/produtos/', '');
                  else if (rawPath.startsWith('produtos/')) rawPath = rawPath.replace('produtos/', '');
                  const hasExtension = /\.(png|jpe?g|webp)$/i.test(rawPath);
                  imageSrc = encodeURI(`/produtos/${rawPath}${hasExtension ? '' : '.png'}`);
                }

                return (
                  <div key={`${item.id || item.nome}-${index}`} className="flex gap-4 items-center border-b border-gray-100 pb-4">
                    <div className="relative w-16 h-16 bg-gray-50 flex-shrink-0 border border-gray-100">
                      {imageSrc && <Image src={imageSrc} alt={item.nome} fill unoptimized className="object-contain p-1" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-semibold text-gray-800 truncate">{item.nome}</h4>
                      <span className="text-xs font-bold text-black mt-1 block">{formatPrice(Number(item.preco))}</span>
                      
                      <div className="flex items-center gap-3 mt-3">
                        <button 
                          onClick={() => handleAddAndClose(item)} 
                          className="text-[10px] uppercase font-bold bg-black text-white px-3 py-1.5 rounded hover:bg-zinc-800 cursor-pointer"
                        >
                          Adicionar à Sacola
                        </button>
                        <button 
                          onClick={() => removeItem(item.id || item.nome)} 
                          className="text-[10px] uppercase font-bold text-red-500 hover:underline cursor-pointer"
                        >
                          Remover
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}