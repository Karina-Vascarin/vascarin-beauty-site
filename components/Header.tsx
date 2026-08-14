"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export default function Header() {
  const [searchTerm, setSearchTerm] = useState('');
  const [clientData, setClientData] = useState<{name: string, phone: string} | null>(null);
  const router = useRouter();

  // Busca os dados da cliente salvos no navegador para registrar quem fez a pesquisa
  useEffect(() => {
    const data = localStorage.getItem('vascarin_client');
    if (data) {
      try {
        setClientData(JSON.parse(data));
      } catch (e) {}
    }
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    // 1. Salva a intenção de busca no painel da Vascarin Beauty (Supabase)
    try {
      await supabase.from('buscas_site').insert([{
        termo: searchTerm.trim(),
        nome: clientData?.name || null,
        telefone: clientData?.phone ? clientData.phone.replace(/\D/g, '') : null,
        resultados: 0 // O padrão é 0. Depois podemos vincular à página de produtos para atualizar isso!
      }]);
    } catch (error) {
      console.error("Erro ao registrar busca:", error);
    }

    // 2. Redireciona para a página principal filtrando pelo termo pesquisado
    router.push(`/?q=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <header className="w-full bg-white border-b border-gray-200 py-3 px-6 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
        
        {/* Logo alinhado no canto esquerdo */}
        <Link href="/" className="flex items-center shrink-0">
          <Image 
            src="/logo/logo_site.png" 
            alt="Vascarin Beauty" 
            width={160} 
            height={55} 
            priority
            className="object-contain h-10 w-auto"
          />
        </Link>

        {/* BARRA DE BUSCA GLOBAL INTEGRADA COM O SUPABASE */}
        <div className="flex-1 max-w-xl hidden md:block">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar perfumes, marcas..." 
              className="w-full bg-gray-50 border border-gray-200 text-xs text-gray-800 rounded-full py-2.5 pl-4 pr-10 focus:outline-none focus:border-black transition-colors"
            />
            <button type="submit" className="absolute right-3 text-gray-400 hover:text-black transition-colors cursor-pointer" title="Buscar">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
            </button>
          </form>
        </div>

      </div>
    </header>
  );
}