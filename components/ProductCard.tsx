"use client";

import { useFavoritesStore } from '@/store/favorites';
import { useCartStore } from '@/store/cart';
import Image from 'next/image';

interface ProductCardProps {
  product: any;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem: addToFavorites, items: favoriteItems, removeItem: removeFromFavorites } = useFavoritesStore();
  const addItemToCart = useCartStore((state) => state.addItem);

  // Verifica se o produto já está nos favoritos
  const isFavorite = favoriteItems.some((item) => (item.id && item.id === product.id) || item.nome === product.nome);

  const handleToggleFavorite = () => {
    if (isFavorite) {
      removeFromFavorites(product.id || product.nome);
    } else {
      addToFavorites(product);
    }
  };

  return (
    <div className="bg-white border border-gray-100 flex flex-col relative group p-4">
      {/* Botão do Coração */}
      <button 
        onClick={handleToggleFavorite}
        className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
        aria-label="Favoritar"
      >
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="20" 
          height="20" 
          viewBox="0 0 24 24" 
          fill={isFavorite ? "currentColor" : "none"} 
          stroke="currentColor" 
          strokeWidth="1.8" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className={isFavorite ? "text-red-600" : "text-gray-400"}
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
      </button>

      {/* Imagem do Produto */}
      <div className="relative w-full h-48 mb-4 bg-gray-50 flex items-center justify-center">
        {product.imagem ? (
          <Image 
            src={`/produtos/${product.imagem}`} 
            alt={product.nome} 
            fill 
            className="object-contain p-2" 
          />
        ) : (
          <span className="text-xs text-gray-400 uppercase">Sem foto</span>
        )}
      </div>

      {/* Detalhes do Produto */}
      <div className="flex flex-col flex-1 justify-between">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {product.marca || product.categoria || 'VASCARIN'}
          </span>
          <h3 className="text-xs font-medium text-gray-800 line-clamp-2 mt-1 mb-2">
            {product.nome}
          </h3>
        </div>

        <div>
          <div className="mb-3">
            <span className="text-[10px] uppercase text-gray-400 block">A partir de:</span>
            <span className="text-sm font-bold text-black">
              R$ {Number(product.preco || product.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <button
            onClick={() => addItemToCart({ ...product, quantidade: 1 })}
            className="w-full bg-black text-white text-xs font-bold uppercase py-2.5 hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Comprar
          </button>
        </div>
      </div>
    </div>
  );
}