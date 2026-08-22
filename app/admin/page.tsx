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

  // ESTADOS DO NOVO MODAL "AVISE-ME"
  const [showAviseModal, setShowAviseModal] = useState(false);
  const [aviseName, setAviseName] = useState('');
  const [avisePhone, setAvisePhone] = useState('');
  const [isSubmittingAvise, setIsSubmittingAvise] = useState(false);

  const isFavorite = favoriteItems.some((item: any) => (item.id && item.id === product.id) || item.nome === product.nome);

  const handleToggleFavorite = () => {
    if (isFavorite) {
      removeFromFavorites(product.id || product.nome);
    } else {
      addToFavorites(product);
    }
  };

  const estoqueNum = Number(product.estoque ?? product.quantidade ?? 1);
  const isEsgotado = estoqueNum <= 0;

  // Função da Máscara de Telefone
  const formatPhone = (value: string) => {
    return value.replace(/\D/g, "").replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2").slice(0, 15);
  };

  const triggerAviseMe = () => {
    let clientName = '';
    let clientPhone = '';

    try {
      const localData = localStorage.getItem('vascarin_client');
      if (localData) {
        const parsed = JSON.parse(localData);
        clientName = parsed.name || '';
        clientPhone = parsed.phone || '';
      }
    } catch (e) {}

    if (clientName && clientPhone) {
      registrarAviseMe(clientName, clientPhone);
    } else {
      setShowAviseModal(true);
    }
  };

  const registrarAviseMe = async (nome: string, telefone: string) => {
    const cleanPhone = telefone.replace(/\D/g, '');
    
    if (cleanPhone.length !== 11) {
      alert("Por favor, digite um número de WhatsApp válido com 11 dígitos.");
      return;
    }

    setIsSubmittingAvise(true);
    
    try {
      await supabase.from('fila_espera').insert([{
        nome: nome,
        telefone: cleanPhone,
        produto: product.nome
      }]);
      
      alert(`Pronto, ${nome}! Vamos te avisar no WhatsApp assim que o ${product.nome} estiver disponível.`);
      setShowAviseModal(false);

      localStorage.setItem('vascarin_client', JSON.stringify({ name: nome, phone: cleanPhone, wantsUpdates: true }));
      
      await supabase.from('clientes').upsert({
        telefone: cleanPhone,
        nome: nome,
        updated_at: new Date().toISOString()
      }, { onConflict: 'telefone' });

    } catch (err) {
      alert("Erro ao registrar na fila de espera. Tente novamente.");
    } finally {
      setIsSubmittingAvise(false);
    }
  };

  const handleSubmitAviseModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aviseName || !avisePhone) return;
    registrarAviseMe(aviseName, avisePhone);
  };

  // MONTAGEM DO CAMINHO DA IMAGEM
  let imageSrc = "";
  const semImagem = !product.imagem || String(product.imagem).includes('default-image');
  
  if (!semImagem) {
    let rawPath = String(product.imagem).replace(/[\r\n]+/g, '').trim();
    if (rawPath.startsWith('/produtos/')) rawPath = rawPath.replace('/produtos/', '');
    else if (rawPath.startsWith('produtos/')) rawPath = rawPath.replace('produtos/', '');
    
    const hasExtension = /\.(png|jpe?g|webp)$/i.test(rawPath);
    imageSrc = encodeURI(`/produtos/${rawPath}${hasExtension ? '' : '.png'}`);
  } else if (product.id) {
    imageSrc = encodeURI(`/produtos/${String(product.id).toLowerCase()}.png`);
  }

  const mostrarImagem = !!imageSrc;
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

        {/* Imagem do Produto */}
        <div 
          onClick={() => setIsModalOpen(true)}
          className="relative w-full h-48 mb-4 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center cursor-pointer group-hover:opacity-90 transition-opacity"
          title="Clique para ampliar"
        >
          {mostrarImagem ? (
            <Image 
              src={imageSrc} 
              alt={product.nome} 
              fill 
              unoptimized
              className="object-contain p-2"
            />
          ) : (
            <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Sem foto</span>
          )}

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
                onClick={triggerAviseMe}
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
        onAddToCart={(item: any) => addItemToCart({ ...item, quantidade: 1 })} 
      />

      {/* MODAL "AVISE-ME QUANDO CHEGAR" */}
      {showAviseModal && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-white relative w-full max-w-md rounded-2xl shadow-2xl p-8 flex flex-col gap-5 animate-in fade-in zoom-in duration-300">
            
            <button 
              onClick={() => setShowAviseModal(false)}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="text-center mt-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 block mb-1">⏳ Fila de Espera</span>
              <h2 className="text-sm font-bold text-gray-800 pr-4 pl-4">Avise-me quando chegar!</h2>
              <p className="text-xs text-gray-500 mt-2">Identifique-se para avisarmos assim que o <strong className="text-black">{product.nome}</strong> voltar ao estoque.</p>
            </div>

            <form onSubmit={handleSubmitAviseModal} className="flex flex-col gap-3 mt-2">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Seu Nome</label>
                <input 
                  type="text" 
                  placeholder="Digite seu nome" 
                  value={aviseName} 
                  onChange={(e) => setAviseName(e.target.value)}
                  className="w-full border border-gray-300 p-3 text-xs rounded-lg focus:outline-none focus:border-black"
                  required
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Seu WhatsApp</label>
                <input 
                  type="text" 
                  placeholder="(11) 99999-9999" 
                  value={avisePhone} 
                  onChange={(e) => setAvisePhone(formatPhone(e.target.value))} 
                  className="w-full border border-gray-300 p-3 text-xs rounded-lg focus:outline-none focus:border-black"
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmittingAvise}
                className="w-full bg-black text-white text-xs font-bold uppercase py-4 rounded-lg hover:bg-zinc-800 transition-colors mt-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmittingAvise ? 'Registrando...' : 'Me avise no WhatsApp'}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}