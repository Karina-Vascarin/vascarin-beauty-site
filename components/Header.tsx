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
    const query = searchTerm.trim();
    if (!query) return;

    try {
      await supabase.from('buscas_site').insert([{
        termo: query,
        nome: clientData?.name || null,
        telefone: clientData?.phone ? clientData.phone.replace(/\D/g, '') : null,
        resultados: 0 
      }]);
    } catch (error) {
      console.error("Erro ao registrar busca:", error);
    }

    router.push(`/?q=${encodeURIComponent(query)}`);
  };

  return (
    <header className="w-full bg-white border-b border-gray-200 py-3 px-6 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
        
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

        {/* ÚNICA BARRA DE PESQUISA COM LUPA EM ÍCONE SVG */}
        <div className="flex-1 max-w-xl">
          <form onSubmit={handleSearch} className="relative flex items-center">
            <input 
              type="text" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar perfumes, marcas..." 
              className="w-full bg-gray-50 border border-gray-200 text-xs text-gray-800 rounded-full py-2.5 pl-4 pr-10 focus:outline-none focus:border-black transition-colors shadow-sm"
            />
            <button type="submit" className="absolute right-3 text-gray-400 hover:text-black transition-colors cursor-pointer flex items-center justify-center" title="Buscar">
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