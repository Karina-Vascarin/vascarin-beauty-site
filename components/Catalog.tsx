"use client";

import { useState, useMemo, useEffect } from 'react';
import ProductCard from './ProductCard';
import { supabase } from '@/lib/supabase';

interface CatalogProps {
  initialProducts: any[];
}

export default function Catalog({ initialProducts = [] }: CatalogProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('default');
  const [clientData, setClientData] = useState<{name: string, phone: string} | null>(null);

  useEffect(() => {
    const data = localStorage.getItem('vascarin_client');
    if (data) {
      try {
        setClientData(JSON.parse(data));
      } catch (e) {}
    }
  }, []);

  const categories = useMemo(() => {
    const cats = initialProducts.map((p) => p.categoria).filter(Boolean);
    return Array.from(new Set(cats)) as string[];
  }, [initialProducts]);

  const filteredProducts = useMemo(() => {
    let result = initialProducts.filter((product) => {
      const matchesCategory = selectedCategory === 'Todos' || product.categoria === selectedCategory;
      const matchesSearch = !searchQuery || product.nome?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    if (sortBy === 'price-asc') result.sort((a, b) => Number(a.preco) - Number(b.preco));
    else if (sortBy === 'price-desc') result.sort((a, b) => Number(b.preco) - Number(a.preco));
    else if (sortBy === 'name-asc') result.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

    return result;
  }, [initialProducts, selectedCategory, searchQuery, sortBy]);

  // Registra no Supabase quando a pessoa pesquisa algo e não acha nenhum resultado
  useEffect(() => {
    const registrarBuscaVazia = async () => {
      if (searchQuery.trim().length > 2 && filteredProducts.length === 0) {
        try {
          await supabase.from('buscas_site').insert([{
            termo: searchQuery.trim(),
            nome: clientData?.name || null,
            telefone: clientData?.phone ? clientData.phone.replace(/\D/g, '') : null,
            resultados: 0
          }]);
        } catch (err) {}
      }
    };
    const timer = setTimeout(registrarBuscaVazia, 1500); // Espera o usuário terminar de digitar
    return () => clearTimeout(timer);
  }, [searchQuery, filteredProducts.length, clientData]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
      
      {/* TOPO: BUSCA CLEAN E CATEGORIAS EM ABAS */}
      <div className="flex flex-col gap-4">
        
        {/* Barra de Busca Minimalista */}
        <div className="relative w-full max-w-md">
          <input 
            type="text"
            placeholder="O que você está procurando?"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-full px-4 py-2.5 text-xs text-black focus:outline-none focus:border-black transition-all shadow-sm"
          />
        </div>

        {/* Abas de Categorias Roláveis */}
        <div>
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-2">Categorias</h2>
          <div className="flex overflow-x-auto gap-2 pb-1 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
            <button 
              onClick={() => setSelectedCategory('Todos')}
              className={`whitespace-nowrap px-4 py-2 text-[11px] font-bold uppercase rounded-full transition-all cursor-pointer ${selectedCategory === 'Todos' ? 'bg-black text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              Todos ({initialProducts.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-2 text-[11px] font-bold uppercase rounded-full transition-all cursor-pointer ${selectedCategory === cat ? 'bg-black text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                {cat} ({initialProducts.filter((p: any) => p.categoria === cat).length})
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* CONTAGEM E ORDENAÇÃO */}
      <div className="flex justify-between items-center border-b border-gray-100 pb-3">
        <span className="text-[11px] text-gray-500 font-medium">
          Exibindo <strong className="text-black">{filteredProducts.length}</strong> produtos
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
          <p className="text-gray-400 text-xs">Nenhum produto encontrado com "{searchQuery}".</p>
          <button 
            onClick={async () => {
              if (!searchQuery) return;
              const nomeCli = clientData?.name || prompt("Digite seu nome:");
              const telCli = clientData?.phone || prompt("Digite seu WhatsApp para avisarmos quando tivermos:");
              if (nomeCli && telCli) {
                await supabase.from('fila_espera').insert([{
                  nome: nomeCli,
                  telefone: telCli.replace(/\D/g, ''),
                  produto: searchQuery
                }]);
                alert("Pronto! Salvamos na nossa fila de espera. Assim que chegarem novidades, te avisaremos!");
              }
            }}
            className="bg-black text-white text-[10px] font-bold uppercase px-6 py-3 rounded-full hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Quero encomendar / Avise-me deste item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {filteredProducts.map((product, index) => (
            <ProductCard key={product.id || index} product={product} />
          ))}
        </div>
      )}

    </div>
  );
}