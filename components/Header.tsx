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
    if (data) setClientData(JSON.parse(data));
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    await supabase.from('buscas_site').insert([{
      termo: searchTerm.trim(),
      nome: clientData?.name || null,
      telefone: clientData?.phone || null,
      resultados: 0 
    }]);

    router.push(`/?q=${encodeURIComponent(searchTerm)}`);
  };

  return (
    <header className="w-full bg-white border-b border-gray-200 py-3 px-6 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
        <Link href="/" className="shrink-0">
          <Image src="/logo/logo_site.png" alt="Vascarin Beauty" width={160} height={55} priority className="h-10 w-auto object-contain" />
        </Link>

        {/* Barra de busca garantida */}
        <form onSubmit={handleSearch} className="flex-1 max-w-xl relative flex items-center">
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Pesquisar perfumes..." 
            className="w-full bg-gray-50 border border-gray-300 text-sm rounded-full py-2.5 pl-4 pr-12 focus:outline-none focus:border-black"
          />
          <button type="submit" className="absolute right-4 text-black font-bold">
            🔍
          </button>
        </form>
      </div>
    </header>
  );
}