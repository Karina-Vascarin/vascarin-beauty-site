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

  // Extrai as categorias únicas dos produtos
  const categories = useMemo(() => {
    const cats = initialProducts.map((p) => p.categoria).filter(Boolean);
    return Array.from(new Set(cats)) as string[];
  }, [initialProducts]);

  // Filtra e Ordena os produtos
  const filteredProducts = useMemo(() => {
    let result = initialProducts.filter((product) => {
      const matchesCategory = selectedCategory === 'Todos' || product.categoria === selectedCategory;
      const matchesSearch = !searchQuery || 
        product.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.categoria?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const price = Number(product.preco || 0);
      const matchesMin = minPrice === '' || price >= Number(minPrice);
      const matchesMax = maxPrice === '' || price <= Number(maxPrice);

      return matchesCategory && matchesSearch && matchesMin && matchesMax;
    });

    // Aplicação da Ordenação
    if (sortBy === 'price-asc') {
      result.sort((a, b) => Number(a.preco) - Number(b.preco));
    } else if (sortBy === 'price-desc') {
      result.sort((a, b) => Number(b.preco) - Number(a.preco));
    } else if (sortBy === 'name-asc') {
      result.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));
    }

    return result;
  }, [initialProducts, selectedCategory, searchQuery, minPrice, maxPrice, sortBy]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
      
      {/* Barra Lateral de Filtros */}
      <aside className="w-full md:w-64 shrink-0 flex flex-col gap-6">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider mb-4 text-black">Filtros</h2>
          
          {/* Campo de Busca */}
          <div className="mb-4">
            <label className="block text-xs uppercase text-gray-500 mb-1.5 font-semibold">Busca</label>
            <input 
              type="text"
              placeholder="Buscar perfume..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-black"
            />
          </div>

          {/* Filtro de Faixa de Preço (Mínimo e Máximo) */}
          <div className="mb-4">
            <label className="block text-xs uppercase text-gray-500 mb-1.5 font-semibold">Preço (R$)</label>
            <div className="flex gap-2">
              <input 
                type="number"
                placeholder="Mín"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-1/2 border border-gray-200 px-2 py-2 text-xs focus:outline-none focus:border-black"
              />
              <input 
                type="number"
                placeholder="Máx"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-1/2 border border-gray-200 px-2 py-2 text-xs focus:outline-none focus:border-black"
              />
            </div>
          </div>
        </div>

        {/* Lista de Categorias */}
        <div>
          <h3 className="text-xs uppercase font-bold text-gray-500 mb-3 tracking-wider">Categorias</h3>
          <div className="flex flex-col gap-1.5">
            <button 
              onClick={() => setSelectedCategory('Todos')}
              className={`flex items-center gap-1.5 text-xs py-1 text-left transition-colors ${selectedCategory === 'Todos' ? 'font-bold text-black' : 'text-gray-600 hover:text-black'}`}
            >
              <span>Todos os Produtos</span>
              <span className="text-gray-400 text-[11px]">({initialProducts.length})</span>
            </button>

            {categories.map((cat) => {
              const count = initialProducts.filter((p: any) => p.categoria === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`flex items-center gap-1.5 text-xs py-1 text-left transition-colors ${selectedCategory === cat ? 'font-bold text-black' : 'text-gray-600 hover:text-black'}`}
                >
                  <span>{cat}</span>
                  <span className="text-gray-400 text-[11px]">({count})</span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Grade de Produtos e Ordenação */}
      <main className="flex-1">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-gray-100 pb-4 gap-4">
          <span className="text-xs text-gray-500 font-medium">
            Exibindo <strong className="text-black">{filteredProducts.length}</strong> produtos
          </span>

          {/* Seletor de Ordenação */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 uppercase font-semibold">Ordenar por:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-200 px-3 py-1.5 text-xs bg-white text-black focus:outline-none focus:border-black"
            >
              <option value="default">Padrão</option>
              <option value="price-asc">Menor Preço</option>
              <option value="price-desc">Maior Preço</option>
              <option value="name-asc">Ordem Alfabética (A-Z)</option>
            </select>
          </div>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            Nenhum produto encontrado com esses filtros.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
              <ProductCard key={product.id || index} product={product} />
            ))}
          </div>
        )}
      </main>

    </div>
  );
}