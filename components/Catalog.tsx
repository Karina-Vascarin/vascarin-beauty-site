"use client";

import { useState, useMemo } from 'react';
import ProductCard from './ProductCard';

interface CatalogProps {
  initialProducts: any[];
}

export default function Catalog({ initialProducts = [] }: CatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('default');

  const categories = useMemo(() => {
    const cats = initialProducts.map((p) => p.categoria).filter(Boolean);
    return Array.from(new Set(cats)) as string[];
  }, [initialProducts]);

  const filteredProducts = useMemo(() => {
    let result = initialProducts.filter((product) => {
      const matchesCategory = selectedCategory === 'Todos' || product.categoria === selectedCategory;
      const matchesSearch = !searchQuery || product.nome?.toLowerCase().includes(searchQuery.toLowerCase());
      const price = Number(product.preco || 0);
      return matchesCategory && matchesSearch && (minPrice === '' || price >= Number(minPrice)) && (maxPrice === '' || price <= Number(maxPrice));
    });
    if (sortBy === 'price-asc') result.sort((a, b) => Number(a.preco) - Number(b.preco));
    else if (sortBy === 'price-desc') result.sort((a, b) => Number(b.preco) - Number(a.preco));
    return result;
  }, [initialProducts, selectedCategory, searchQuery, minPrice, maxPrice, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* 1. ABA HORIZONTAL (Mobile: Rola para o lado | Desktop: Grade de botões) */}
      <div className="mb-8">
        <h2 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Categorias</h2>
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 md:flex-wrap">
          <button 
            onClick={() => setSelectedCategory('Todos')}
            className={`whitespace-nowrap px-4 py-2 text-[11px] font-bold uppercase rounded-full transition-all ${selectedCategory === 'Todos' ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >
            Todos ({initialProducts.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`whitespace-nowrap px-4 py-2 text-[11px] font-bold uppercase rounded-full transition-all ${selectedCategory === cat ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              {cat} ({initialProducts.filter((p: any) => p.categoria === cat).length})
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Filtros em Desktop, escondidos/compactos em mobile */}
        <aside className="hidden md:flex w-64 shrink-0 flex-col gap-6 sticky top-20 h-fit">
          <div>
            <h2 className="text-xs font-bold uppercase mb-4">Filtros</h2>
            <input type="text" placeholder="Buscar..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full border p-2 text-xs mb-3" />
            <div className="flex gap-2">
              <input type="number" placeholder="Mín" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="w-1/2 border p-2 text-xs" />
              <input type="number" placeholder="Máx" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="w-1/2 border p-2 text-xs" />
            </div>
          </div>
        </aside>

        {/* Grade de Produtos */}
        <main className="flex-1">
          <div className="flex justify-between items-center mb-6 border-b pb-4">
            <span className="text-[11px] font-bold uppercase text-gray-500">{filteredProducts.length} itens</span>
            <select onChange={(e) => setSortBy(e.target.value)} className="text-[11px] uppercase font-bold bg-transparent border-none focus:ring-0">
              <option value="default">Ordenação Padrão</option>
              <option value="price-asc">Menor Preço</option>
              <option value="price-desc">Maior Preço</option>
            </select>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product, index) => (
              <ProductCard key={product.id || index} product={product} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}