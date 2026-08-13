"use client";

import { useFavoritesStore } from '@/store/favorites';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function FloatingFavorites() {
  const [isMounted, setIsMounted] = useState(false);
  const favStore = useFavoritesStore() as any;
  const items = favStore.items || [];
  const isOpen = favStore.isOpen;
  const toggleFavorites = favStore.toggleFavorites;
  const removeItem = favStore.removeItem;

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (!isMounted) return;
    const saveFavorites = async () => {
      const clientData = localStorage.getItem('vascarin_client');
      if (!clientData) return;
      const client = JSON.parse(clientData);
      try {
        if (items.length > 0) {
          const produtos = items.map((i: any) => i.nome).join(', ');
          await supabase.from('favoritos').upsert([{ telefone: client.phone, nome: client.name, produtos }], { onConflict: 'telefone' });
        } else {
          await supabase.from('favoritos').delete().eq('telefone', client.phone);
        }
      } catch (err) {}
    };
    saveFavorites();
  }, [items, isMounted]);

  if (!isMounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white h-full p-6 shadow-2xl">
        <h2 className="text-sm font-black uppercase mb-4">💖 Lista de Desejos ({items.length})</h2>
        {items.map((item: any, i: number) => (
          <div key={i} className="flex justify-between border-b py-4 text-xs font-bold">
            {item.nome}
            <button onClick={() => removeItem(item.id)} className="text-red-500">REMOVER</button>
          </div>
        ))}
        <button onClick={toggleFavorites} className="w-full mt-4 bg-gray-200 p-4 font-bold uppercase text-xs">FECHAR</button>
      </div>
    </div>
  );
}