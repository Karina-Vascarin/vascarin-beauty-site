"use client";

import { useFavoritesStore } from '@/store/favorites';
import { useCartStore } from '@/store/cart';
import Image from 'next/image';

export default function FloatingFavorites() {
  const { items, isOpen, toggleFavorites, removeItem } = useFavoritesStore();
  const addItemToCart = useCartStore((state) => state.addItem);

  const handleAddToCart = (item: any) => {
    addItemToCart({ ...item, quantidade: 1 });
    removeItem(item.id || item.nome);
    toggleFavorites(); // Fecha favoritos ao enviar pro carrinho
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 transition-opacity" onClick={toggleFavorites} />
      <div className="fixed top-0 right-0 h-full w-full max-w-[420px] bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300">
        
        <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100">
          <h2 className="text-2xl font-black text-black uppercase tracking-tight">Favoritos</h2>
          <button onClick={toggleFavorites} className="text-black text-3xl font-light hover:opacity-70">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6">
          {items.length === 0 ? (
            <p className="text-zinc-500 text-center mt-10">Sua lista de desejos está vazia.</p>
          ) : (
            items.map((item, index) => (
              <div key={`${item.id || item.nome}-${index}`} className="flex gap-4 py-6 border-b border-gray-100">
                <div className="relative w-20 h-20 bg-white flex-shrink-0">
                  {item.imagem ? (
                    <Image src={`/produtos/${item.imagem}`} alt={item.nome} fill className="object-contain" />
                  ) : (
                    <div className="w-full h-full bg-gray-100 flex items-center justify-center text-[10px] uppercase">Sem foto</div>
                  )}
                </div>
                <div className="flex flex-col flex-1 justify-center">
                  <span className="text-xs font-bold text-black uppercase">{item.marca || 'VASCARIN'}</span>
                  <h3 className="text-[13px] text-gray-800 font-medium leading-tight mt-1 mb-2">{item.nome}</h3>
                  <button 
                    onClick={() => handleAddToCart(item)}
                    className="text-xs bg-black text-white py-2 px-4 uppercase font-bold hover:bg-[#b90000] transition-colors w-fit"
                  >
                    Mover para Sacola
                  </button>
                </div>
                <button onClick={() => removeItem(item.id || item.nome)} className="text-gray-400 hover:text-red-500 self-start mt-1">
                   <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}