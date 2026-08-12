"use client";

import Image from 'next/image';

interface ProductModalProps {
  product: any;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: any) => void;
}

export default function ProductModal({ product, isOpen, onClose, onAddToCart }: ProductModalProps) {
  if (!isOpen || !product) return null;

  let imageSrc = "";
  const semImagem = !product.imagem || String(product.imagem).includes('default-image');
  if (!semImagem) {
    let rawPath = String(product.imagem).replace(/[\r\n]+/g, '').trim();
    if (rawPath.startsWith('/produtos/')) rawPath = rawPath.replace('/produtos/', '');
    else if (rawPath.startsWith('produtos/')) rawPath = rawPath.replace('produtos/', '');
    const hasExtension = /\.(png|jpe?g|webp)$/i.test(rawPath);
    imageSrc = encodeURI(`/produtos/${rawPath}${hasExtension ? '' : '.png'}`);
  }

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-2xl rounded-lg shadow-2xl overflow-hidden relative flex flex-col md:flex-row">
        
        {/* BOTÃO DE FECHAR */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-10 bg-gray-100 text-black w-8 h-8 rounded-full flex items-center justify-center font-bold hover:bg-black hover:text-white transition-colors"
        >
          &times;
        </button>

        {/* IMAGEM GRANDE */}
        <div className="relative w-full md:w-1/2 h-72 md:h-96 bg-gray-50 flex items-center justify-center p-6">
          {imageSrc ? (
            <Image src={imageSrc} alt={product.nome} fill className="object-contain p-4" unoptimized />
          ) : (
            <span className="text-xs text-gray-400 uppercase">Sem foto</span>
          )}
        </div>

        {/* DETALHES E DESCRIÇÃO EXCLUSIVA */}
        <div className="w-full md:w-1/2 p-6 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block mb-1">
              {product.marca || product.categoria || 'VASCARIN'}
            </span>
            <h2 className="text-base font-bold text-gray-900 leading-snug mb-2">
              {product.nome}
            </h2>
            <span className="text-lg font-black text-black block mb-4">
              {formatPrice(Number(product.preco || product.valor || 0))}
            </span>

            {/* DESCRIÇÃO MAIOR (Aparece apenas aqui) */}
            <div className="border-t border-gray-100 pt-3 mt-2">
              <h4 className="text-[11px] font-bold uppercase text-gray-500 mb-1">Sobre o produto:</h4>
              <p className="text-xs text-gray-600 leading-relaxed max-h-40 overflow-y-auto">
                {product.descricao_completa || product.descricao || "Fragrância de alta fixação e excelente qualidade, ideal para todas as ocasiões."}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              onAddToCart(product);
              onClose();
            }}
            className="w-full bg-black text-white text-xs font-bold uppercase py-3.5 hover:bg-[#b90000] transition-colors mt-6"
          >
            Adicionar à Sacola
          </button>
        </div>

      </div>
    </div>
  );
}