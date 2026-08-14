"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const formatPhone = (value: string) => {
    return value.replace(/\D/g, "").replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2").slice(0, 15);
  };

  useEffect(() => {
    if (!localStorage.getItem('vascarin_client')) setIsOpen(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    localStorage.setItem('vascarin_client', JSON.stringify({ name, phone: cleanPhone }));

    await supabase.from('historico_acessos').insert([{ nome: name, telefone: cleanPhone }]);
    setIsOpen(false);
    window.location.reload();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8 flex flex-col gap-5 animate-in fade-in zoom-in duration-300">
        <div className="text-center">
          <span className="text-xs font-black uppercase tracking-widest text-black block mb-1">Vascarin Beauty</span>
          <h2 className="text-sm font-bold text-gray-800">Identifique-se para ver os preços exclusivos e catálogo.</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2">
          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Seu Nome</label>
            <input type="text" placeholder="Digite seu nome" value={name} onChange={e => setName(e.target.value)} className="w-full border border-gray-300 p-3 text-xs rounded-lg focus:outline-none focus:border-black" required />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Seu WhatsApp</label>
            <input type="text" placeholder="(11) 99999-9999" value={formatPhone(phone)} onChange={e => setPhone(e.target.value)} className="w-full border border-gray-300 p-3 text-xs rounded-lg focus:outline-none focus:border-black" required />
          </div>

          <button type="submit" className="w-full bg-black text-white text-xs font-bold uppercase py-4 rounded-lg hover:bg-zinc-800 transition-colors mt-2 cursor-pointer">
            Acessar Catálogo
          </button>
        </form>
      </div>
    </div>
  );
}