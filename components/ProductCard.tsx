"use client";

import { useFavoritesStore } from '@/store/favorites';
import { useCartStore } from '@/store/cart';
import Image from 'next/image';
import { useState } from 'react';
import ProductModal from './ProductModal';
import { supabase } from '@/lib/supabase';

interface ProductCardProps {
  product: any;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem: addToFavorites, items: favoriteItems, removeItem: removeFromFavorites } = useFavoritesStore();
  const addItemToCart = useCartStore((state) => state.addItem);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estado para controlar se a imagem deu erro ao carregar
  const [imageError, setImageError] = useState(false);

  const isFavorite = favoriteItems.some((item) => (item.id && item.id === product.id) || item.nome === product.nome);

  const handleToggleFavorite = () => {
    if (isFavorite) {
      removeFromFavorites(product.id || product.nome);
    } else {
      addToFavorites(product);
    }
  };

  const estoqueNum = Number(product.estoque ?? product.quantidade ?? 1);
  const isEsgotado = estoqueNum <= 0;

  const handleAviseMe = async () => {
    let clientName = null;
    let clientPhone = null;
    
    try {
      const localData = localStorage.getItem('vascarin_client');
      if (localData) {
        const parsed = JSON.parse(localData);
        clientName = parsed.name;
        clientPhone = parsed.phone;
      }
    } catch (e) {}

    const nome = clientName || prompt("Digite seu nome:");
    if (!nome) return;

    const telefone = clientPhone || prompt("Digite seu WhatsApp para avisarmos quando chegar:");
    if (!telefone) return;

    try {
      await supabase.from('fila_espera').insert([{
        nome: nome,
        telefone: telefone.replace(/\D/g, ''),
        produto: product.nome
      }]);
      alert(`Pronto, ${nome}! Vamos te avisar no WhatsApp assim que o ${product.nome} estiver disponível.`);
    } catch (err) {
      alert("Erro ao registrar na fila de espera.");
    }
  };

  // Montagem do caminho da imagem
  let imageSrc = "";
  const semImagem = !product.imagem || String(product.imagem).includes('default-image');
  if (!semImagem) {
    let rawPath = String(product.imagem).replace(/[\r\n]+/g, '').trim();
    if (rawPath.startsWith('/produtos/')) rawPath = rawPath.replace('/produtos/', '');
    else if (rawPath.startsWith('produtos/')) rawPath = rawPath.replace('produtos/', '');
    const hasExtension = /\.(png|jpe?g|webp)$/i.test(rawPath);
    imageSrc = encodeURI(`/produtos/${rawPath}${hasExtension ? '' : '.png'}`);
  }

  // Se der erro ou vier sem imagem, usamos o fallback (Pode mudar para '/logo.png' se preferir)
  const finalImageSrc = (imageError || semImagem || !imageSrc) ? '/logo.png' : imageSrc;

  // Pega a categoria real da coluna C da planilha
  const categoriaExibida = product.categoria || product.marca || 'Perfumes';

  return (
    <>
      <div className="bg-white border border-gray-100 flex flex-col relative group p-4 rounded-2xl shadow-sm hover:border-black transition-all">
        {/* Botão do Coração */}
        <button 
          onClick={handleToggleFavorite}
          className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-black transition-colors cursor-pointer"
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
            className={isFavorite ? "text-black" : "text-gray-400"}
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        </button>

        {/* Imagem do Produto com sistema anti-falha */}
        <div 
          onClick={() => setIsModalOpen(true)}
          className="relative w-full h-48 mb-4 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center cursor-pointer group-hover:opacity-90 transition-opacity"
          title="Clique para ampliar"
        >
          <Image 
            src={finalImageSrc} 
            alt={product.nome} 
            fill 
            className={`object-contain p-2 ${(imageError || semImagem) ? 'opacity-30' : ''}`}
            onError={() => setImageError(true)} 
          />

          {isEsgotado && (
            <div className="absolute inset-0 bg-white/75 flex items-center justify-center">
              <span className="bg-red-600 text-white text-[10px] uppercase font-bold px-3 py-1 tracking-wider shadow-sm rounded-full">
                Esgotado
              </span>
            </div>
          )}
        </div>

        {/* Detalhes do Produto */}
        <div className="flex flex-col flex-1 justify-between">
          <div>
            {/* Exibe a categoria real da coluna C */}
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {categoriaExibida}
            </span>
            <h3 
              onClick={() => setIsModalOpen(true)}
              className="text-xs font-medium text-gray-800 line-clamp-2 mt-1 mb-2 cursor-pointer hover:underline"
            >
              {product.nome}
            </h3>
          </div>

          <div>
            <div className="mb-3">
              <span className="text-sm font-bold text-black">
                R$ {Number(product.preco || product.valor || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            {isEsgotado ? (
              <button
                onClick={handleAviseMe}
                className="w-full bg-zinc-800 text-white text-[10px] font-bold uppercase py-3 rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                ⏳ Avise-me quando chegar
              </button>
            ) : (
              <button
                onClick={() => addItemToCart({ ...product, quantidade: 1 })}
                className="w-full bg-black text-white text-xs font-bold uppercase py-3 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Comprar
              </button>
            )}
          </div>
        </div>
      </div>

      <ProductModal 
        product={product} 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onAddToCart={(item) => addItemToCart({ ...item, quantidade: 1 })} 
      />
    </>
  );
}