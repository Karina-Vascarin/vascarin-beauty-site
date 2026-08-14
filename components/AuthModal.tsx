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
    
    // Salva identificação local
    localStorage.setItem('vascarin_client', JSON.stringify({ name, phone: cleanPhone }));

    // Registra no histórico com data e hora exata
    await supabase.from('historico_acessos').insert([{
      nome: name,
      telefone: cleanPhone
    }]);

    setIsOpen(false);
    window.location.reload();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 p-4">
      <form onSubmit={handleSubmit} className="bg-white w-full max-w-sm rounded-2xl p-8 flex flex-col gap-4">
        <h2 className="text-xs font-black uppercase text-center">Acesse a Vascarin Beauty</h2>
        <input type="text" placeholder="Nome" value={name} onChange={e => setName(e.target.value)} className="border p-3 text-xs rounded-lg" required />
        <input type="text" placeholder="(00) 00000-0000" value={formatPhone(phone)} onChange={e => setPhone(e.target.value)} className="border p-3 text-xs rounded-lg" required />
        <button className="bg-black text-white p-3 rounded-lg text-xs font-bold uppercase">Acessar Catálogo</button>
      </form>
    </div>
  );
}