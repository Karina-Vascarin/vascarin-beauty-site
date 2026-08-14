"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Função da Máscara (Não altera o layout)
  const formatPhone = (value: string) => {
    return value.replace(/\D/g, "").replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2").slice(0, 15);
  };

  useEffect(() => {
    const savedClient = localStorage.getItem('vascarin_client');
    if (!savedClient) {
      setIsOpen(true);
    } else {
      try {
        const client = JSON.parse(savedClient);
        // Se a cliente já está salva, registra a nova entrada silenciosamente
        registrarAcesso(client.name, client.phone);
      } catch (e) {}
    }
  }, []);

  const registrarAcesso = async (clienteNome: string, clienteTelefone: string) => {
    try {
      const { data: existing } = await supabase.from('clientes').select('visitas').eq('telefone', clienteTelefone).maybeSingle();
      const totalVisitas = (existing?.visitas || 0) + 1;

      // 1. Atualiza a contagem geral de visitas na aba Clientes
      await supabase.from('clientes').upsert({
        telefone: clienteTelefone,
        nome: clienteNome,
        visitas: totalVisitas,
        updated_at: new Date().toISOString()
      }, { onConflict: 'telefone' });

      // 2. AGORA SIM: Grava sempre uma linha nova na aba Histórico com a data e hora de HOJE/AGORA
      await supabase.from('historico_acessos').insert([{ 
        nome: clienteNome, 
        telefone: clienteTelefone 
      }]);

    } catch (error) {
      console.error("Erro ao registrar acesso:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert("Por favor, preencha seu nome e WhatsApp.");
      return;
    }

    setIsSubmitting(true);
    const cleanPhone = phone.replace(/\D/g, '');
    const clientData = { name, phone: cleanPhone };
    localStorage.setItem('vascarin_client', JSON.stringify(clientData));

    // Chama a função que salva o cliente e também gera a linha no histórico
    await registrarAcesso(name, cleanPhone);

    setIsSubmitting(false);
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
            <input 
              type="text" 
              placeholder="Digite seu nome" 
              value={name} 
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 p-3 text-xs rounded-lg focus:outline-none focus:border-black"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Seu WhatsApp</label>
            <input 
              type="text" 
              placeholder="(11) 99999-9999" 
              value={phone} 
              onChange={(e) => setPhone(formatPhone(e.target.value))} 
              className="w-full border border-gray-300 p-3 text-xs rounded-lg focus:outline-none focus:border-black"
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-black text-white text-xs font-bold uppercase py-4 rounded-lg hover:bg-zinc-800 transition-colors mt-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? 'Acessando...' : 'Acessar Catálogo'}
          </button>
        </form>
      </div>
    </div>
  );
}