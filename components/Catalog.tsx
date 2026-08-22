"use client";

import { useState, useMemo, Suspense } from 'react';
import ProductCard from './ProductCard';
import { useSearchParams, useRouter } from 'next/navigation';

interface CatalogProps {
  initialProducts: any[];
}

function CatalogContent({ initialProducts }: CatalogProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const queryParam = searchParams.get('q') || '';

  const [selectedCategory, setSelectedCategory] = useState<string>('TODOS');
  const [sortBy, setSortBy] = useState<string>('default');

  // LIMPEZA ABSOLUTA DE CATEGORIA
  const getCategoriaPadronizada = (p: any) => {
    const raw = String(p.categoria || p.marca || 'DIVERSOS');
    return raw.trim().toUpperCase();
  };

  const categories = useMemo(() => {
    const cats = initialProducts.map(getCategoriaPadronizada);
    return Array.from(new Set(cats)).filter(c => c !== '').sort(); 
  }, [initialProducts]);

  const filteredProducts = useMemo(() => {
    let result = initialProducts.filter((product) => {
      if (!product || !product.nome) return false;
      
      const catProduto = getCategoriaPadronizada(product);
      const matchesCategory = selectedCategory === 'TODOS' || catProduto === selectedCategory;
      const matchesSearch = !queryParam || String(product.nome).toLowerCase().includes(queryParam.toLowerCase());
      
      return matchesCategory && matchesSearch;
    });

    // 🔴 CONVERSOR INTELIGENTE DE PREÇOS (Lê vírgulas sem travar o site)
    const parsePreco = (val: any) => {
      if (!val) return 0;
      return Number(String(val).replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;
    };

    result.sort((a, b) => {
      const estoqueA = Number(a.estoque ?? a.quantidade ?? 0);
      const estoqueB = Number(b.estoque ?? b.quantidade ?? 0);
      
      const isEsgotadoA = estoqueA <= 0;
      const isEsgotadoB = estoqueB <= 0;

      if (isEsgotadoA !== isEsgotadoB) {
        return isEsgotadoA ? 1 : -1;
      }

      if (sortBy === 'price-asc') return parsePreco(a.preco) - parsePreco(b.preco);
      if (sortBy === 'price-desc') return parsePreco(b.preco) - parsePreco(a.preco);
      if (sortBy === 'name-asc') return String(a.nome || '').localeCompare(String(b.nome || ''));

      return 0; // Padrão
    });

    return result;
  }, [initialProducts, selectedCategory, queryParam, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
      
      {/* ABAS DE CATEGORIAS NO TOPO */}
      <div>
        <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Categorias</h2>
        <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
          <button 
            onClick={() => setSelectedCategory('TODOS')}
            className={`whitespace-nowrap px-4 py-2 text-[11px] font-bold uppercase rounded-full transition-all cursor-pointer ${selectedCategory === 'TODOS' ? 'bg-black text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Todos ({initialProducts.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 text-[11px] font-bold uppercase rounded-full transition-all cursor-pointer ${selectedCategory === cat ? 'bg-black text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {cat} ({initialProducts.filter((p: any) => getCategoriaPadronizada(p) === cat).length})
            </button>
          ))}
        </div>
      </div>

      {/* CONTAGEM E ORDENAÇÃO */}
      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
        <span className="text-[11px] text-gray-500 font-medium">
          Exibindo <strong className="text-black">{filteredProducts.length}</strong> produtos
          {queryParam && (
            <span> para &ldquo;<strong>{queryParam}</strong>&rdquo; 
              <button 
                onClick={() => router.push('/')} 
                className="ml-2 text-blue-600 hover:underline text-[10px] uppercase font-bold cursor-pointer"
              >
                (Limpar busca)
              </button>
            </span>
          )}
        </span>

        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-400 uppercase font-bold hidden sm:inline">Ordenar:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-transparent text-xs font-bold text-black focus:outline-none cursor-pointer"
          >
            <option value="default">Padrão</option>
            <option value="price-asc">Menor Preço</option>
            <option value="price-desc">Maior Preço</option>
            <option value="name-asc">A-Z</option>
          </select>
        </div>
      </div>

      {/* GRADE DE PRODUTOS */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center gap-3">
          <p className="text-gray-400 text-xs">Nenhum produto encontrado.</p>
          <button 
            onClick={() => router.push('/')}
            className="bg-black text-white text-[10px] font-bold uppercase px-6 py-2.5 rounded-full hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Ver todos os produtos
          </button>
        </div>
      ) : (
        // 🔴 TRAVA ANTI-FANTASMA: O "key" com a categoria destrói a tela e recria limpa toda vez que você clica!
        <div key={selectedCategory} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product, index) => (
            <ProductCard key={`${product.id || 'prod'}-${index}`} product={product} />
          ))}
        </div>
      )}

    </div>
  );
}

export default function Catalog({ initialProducts = [] }: CatalogProps) {
  return (
    <Suspense fallback={<div className="text-center py-20 text-xs text-gray-400">Carregando catálogo...</div>}>
      <CatalogContent initialProducts={initialProducts} />
    </Suspense>
  );
}