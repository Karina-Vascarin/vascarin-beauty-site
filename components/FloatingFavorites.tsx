"use client";

import { useFavoritesStore } from '@/store/favorites';
import { useCartStore } from '@/store/cart';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

export default function FloatingFavorites() {
  const [isMounted, setIsMounted] = useState(false);
  
  const favStore = useFavoritesStore() as any;
  const items = favStore.items || [];
  const isOpen = favStore.isOpen;
  const toggleFavorites = favStore.toggleFavorites;
  const removeItem = favStore.removeItem;
  
  const cartStore = useCartStore() as any;
  const addToCart = cartStore.addItem;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Grava lista de desejos no Supabase
  useEffect(() => {
    if (!isMounted) return;

    const syncFavorites = async () => {
      const clientData = localStorage.getItem('vascarin_client');
      if (!clientData) return;

      const client = JSON.parse(clientData);
      const cleanPhone = client.phone.replace(/\D/g, '');

      try {
        if (items.length > 0) {
          const produtosNomes = items.map((i: any) => i.nome).join(', ');
          await supabase.from('favoritos').upsert({
            telefone: cleanPhone,
            nome: client.name,
            produtos: produtosNomes,
            updated_at: new Date().toISOString()
          }, { onConflict: 'telefone' });
        } else {
          await supabase.from('favoritos').delete().eq('telefone', cleanPhone);
        }
      } catch (error) {
        console.error("Erro ao sincronizar favoritos:", error);
      }
    };

    syncFavorites();
  }, [items, isMounted]);

  if (!isMounted || !isOpen) return null;

  const formatPrice = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const handleAddAndClose = (item: any) => {
    addToCart(item);
    removeItem(item.id || item.nome);
    toggleFavorites();
    cartStore.toggleCart();
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-pink-50">
          <h2 className="text-sm font-black uppercase tracking-wider text-black flex items-center gap-2">
            💖 Lista de Desejos ({items.length})
          </h2>
          <button onClick={toggleFavorites} className="text-gray-400 hover:text-black transition-colors cursor-pointer text-lg font-bold">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <p className="text-gray-400 text-sm mb-4">Você ainda não favoritou nenhum produto.</p>
              <button onClick={toggleFavorites} className="bg-black text-white text-xs font-bold uppercase px-6 py-3 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer">
                Ver Perfumes
              </button>
            </div>
          ) : (
            items.map((item: any, index: number) => {
              let imageSrc = "";
              const semImagem = !item.imagem || String(item.imagem).includes('default-image');
              if (!semImagem) {
                let rawPath = String(item.imagem).replace(/[\r\n]+/g, '').trim();
                const hasExtension = /\.(png|jpe?g|webp)$/i.test(rawPath);
                imageSrc = encodeURI(`/produtos/${rawPath.replace('/produtos/', '').replace('produtos/', '')}${hasExtension ? '' : '.png'}`);
              }

              return (
                <div key={`${item.id || item.nome}-${index}`} className="flex gap-4 items-center border-b border-gray-100 pb-4">
                  <div className="relative w-16 h-16 bg-gray-50 flex-shrink-0 border border-gray-100 rounded-lg overflow-hidden">
                    {imageSrc && <Image src={imageSrc} alt={item.nome} fill unoptimized className="object-contain p-1" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-gray-800 truncate">{item.nome}</h4>
                    <span className="text-xs font-bold text-black mt-1 block">{formatPrice(Number(item.preco))}</span>
                    
                    <div className="flex items-center gap-3 mt-3">
                      <button 
                        onClick={() => handleAddAndClose(item)} 
                        className="text-[10px] uppercase font-bold bg-black text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800 cursor-pointer"
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
            })
          )}
        </div>
      </div>
    </div>
  );
}