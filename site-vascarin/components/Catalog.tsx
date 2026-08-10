"use client";

import { useState, useMemo } from 'react';
import ProductCard from './ProductCard';

interface CatalogProps {
  initialProducts: any[];
}

export default function Catalog({ initialProducts = [] }: CatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Extrai as categorias únicas dos produtos
  const categories = useMemo(() => {
    const cats = initialProducts.map((p) => p.categoria).filter(Boolean);
    return Array.from(new Set(cats)) as string[];
  }, [initialProducts]);

  // Filtra os produtos com base na categoria e busca
  const filteredProducts = useMemo(() => {
    return initialProducts.filter((product) => {
      const matchesCategory = selectedCategory === 'Todos' || product.categoria === selectedCategory;
      const matchesSearch = !searchQuery || 
        product.nome?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.categoria?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [initialProducts, selectedCategory, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row gap-8">
      
      {/* Barra Lateral de Filtros e Categorias */}
      <aside className="w-full md:w-64 shrink-0 flex flex-col gap-6">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider mb-4 text-black">Filtros</h2>
          
          {/* Campo de Busca */}
          <div className="mb-6">
            <label className="block text-xs uppercase text-gray-500 mb-2 font-semibold">Busca</label>
            <input 
              type="text"
              placeholder="Buscar perfume..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full border border-gray-200 px-3 py-2 text-xs focus:outline-none focus:border-black"
            />
          </div>
        </div>

        {/* Lista de Categorias com Quantidade Próxima */}
        <div>
          <h3 className="text-xs uppercase font-bold text-gray-500 mb-3 tracking-wider">Categorias</h3>
          <div className="flex flex-col gap-1.5">
            
            {/* Opção Todos */}
            <button 
              onClick={() => setSelectedCategory('Todos')}
              className={`flex items-center gap-1.5 text-xs py-1 text-left transition-colors ${selectedCategory === 'Todos' ? 'font-bold text-black' : 'text-gray-600 hover:text-black'}`}
            >
              <span>Todos os Produtos</span>
              <span className="text-gray-400 text-[11px]">({initialProducts.length})</span>
            </button>

            {/* Mapeamento das Categorias */}
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

      {/* Grade de Produtos */}
      <main className="flex-1">
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
          <span className="text-xs text-gray-500 font-medium">
            Exibindo <strong className="text-black">{filteredProducts.length}</strong> produtos
          </span>
        </div>

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            Nenhum produto encontrado nesta categoria.
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