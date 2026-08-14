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
  const [submittedQuery, setSubmittedQuery] = useState<string>(''); // Só filtra ao dar Enter/Lupa
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

  // A filtragem agora só ocorre baseada no termo enviado (submittedQuery)
  const filteredProducts = useMemo(() => {
    let result = initialProducts.filter((product) => {
      const matchesCategory = selectedCategory === 'Todos' || product.categoria === selectedCategory;
      const matchesSearch = !submittedQuery || product.nome?.toLowerCase().includes(submittedQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });

    if (sortBy === 'price-asc') result.sort((a, b) => Number(a.preco) - Number(b.preco));
    else if (sortBy === 'price-desc') result.sort((a, b) => Number(b.preco) - Number(a.preco));
    else if (sortBy === 'name-asc') result.sort((a, b) => (a.nome || '').localeCompare(b.nome || ''));

    return result;
  }, [initialProducts, selectedCategory, submittedQuery, sortBy]);

  // Função disparada ao dar Enter ou clicar na lupa na página principal
  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    setSubmittedQuery(query);

    if (query) {
      // Faz o filtro e verifica se encontrou resultados
      const encontrou = initialProducts.some(p => p.nome?.toLowerCase().includes(query.toLowerCase()));
      
      try {
        await supabase.from('buscas_site').insert([{
          termo: query,
          nome: clientData?.name || null,
          telefone: clientData?.phone ? clientData.phone.replace(/\D/g, '') : null,
          resultados: encontrou ? 1 : 0
        }]);
      } catch (err) {
        console.error("Erro ao registrar busca:", err);
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
      
      {/* TOPO: BUSCA COM LUPA E CATEGORIAS EM ABAS */}
      <div className="flex flex-col gap-4">
        
        {/* Barra de Busca com Lupa Visível */}
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-md flex items-center">
          <input 
            type="text"
            placeholder="O que você está procurando? (Dê Enter)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-gray-50 border border-gray-300 rounded-full pl-4 pr-12 py-2.5 text-xs text-black focus:outline-none focus:border-black transition-all shadow-sm"
          />
          <button type="submit" className="absolute right-4 text-black font-bold text-sm cursor-pointer" title="Pesquisar">
            🔍
          </button>
        </form>

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

      {/* GRADE DE PRODUTOS OU BOTÃO DE Fila de Espera se não achar nada */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-16 flex flex-col items-center gap-3">
          <p className="text-gray-400 text-xs">Nenhum produto encontrado com "{submittedQuery || searchQuery}".</p>
          <button 
            onClick={async () => {
              const termoBusca = submittedQuery || searchQuery;
              if (!termoBusca) return;
              const nomeCli = clientData?.name || prompt("Digite seu nome:");
              const telCli = clientData?.phone || prompt("Digite seu WhatsApp para avisarmos quando chegar:");
              if (nomeCli && telCli) {
                await supabase.from('fila_espera').insert([{
                  nome: nomeCli,
                  telefone: telCli.replace(/\D/g, ''),
                  produto: termoBusca
                }]);
                alert("Pronto! Salvamos na nossa fila de espera. Assim que chegarem novidades, te avisaremos!");
              }
            }}
            className="bg-blue-600 text-white text-[10px] font-bold uppercase px-6 py-3 rounded-full hover:bg-blue-700 transition-colors cursor-pointer shadow-md"
          >
            ⏳ Avise-me quando chegar / Encomendar
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