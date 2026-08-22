"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AuthModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [wantsUpdates, setWantsUpdates] = useState(true); // Checkbox ativado por padrão
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Função da Máscara
  const formatPhone = (value: string) => {
    return value.replace(/\D/g, "").replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2").slice(0, 15);
  };

  useEffect(() => {
    const savedClient = localStorage.getItem('vascarin_client');
    const closedModal = sessionStorage.getItem('vascarin_modal_closed'); 
    const visitLogged = sessionStorage.getItem('vascarin_visit_logged'); // Evita registrar a mesma visita duas vezes na mesma sessão
    
    if (!savedClient && !closedModal) {
      setIsOpen(true);
    } else if (savedClient && !visitLogged) {
      try {
        const client = JSON.parse(savedClient);
        registrarAcesso(client.name, client.phone);
        sessionStorage.setItem('vascarin_visit_logged', 'true');
      } catch (e) {}
    } else if (!savedClient && closedModal && !visitLogged) {
      // Caso a pessoa já tenha fechado o modal, mas abriu uma nova aba e a visita ainda não foi registrada
      registrarAcessoAnonimo();
      sessionStorage.setItem('vascarin_visit_logged', 'true');
    }
  }, []);

  // REGISTRA CLIENTE CADASTRADO
  const registrarAcesso = async (clienteNome: string, clienteTelefone: string) => {
    try {
      const { data: existing } = await supabase.from('clientes').select('visitas').eq('telefone', clienteTelefone).maybeSingle();
      const totalVisitas = (existing?.visitas || 0) + 1;

      // 1. Atualiza a contagem na aba Clientes
      await supabase.from('clientes').upsert({
        telefone: clienteTelefone,
        nome: clienteNome,
        visitas: totalVisitas,
        updated_at: new Date().toISOString()
      }, { onConflict: 'telefone' });

      // 2. Grava no Histórico
      await supabase.from('historico_acessos').insert([{ 
        nome: clienteNome, 
        telefone: clienteTelefone 
      }]);

    } catch (error) {
      console.error("Erro ao registrar acesso:", error);
    }
  };

  // REGISTRA VISITANTE ANÔNIMO (Só vai pro Histórico, não polui a aba Clientes)
  const registrarAcessoAnonimo = async () => {
    try {
      await supabase.from('historico_acessos').insert([{ 
        nome: 'Visitante Anônimo', 
        telefone: 'Não informado' 
      }]);
    } catch (error) {
      console.error("Erro ao registrar acesso anônimo:", error);
    }
  };

  // QUANDO A PESSOA CLICA NO "X"
  const handleClose = () => {
    sessionStorage.setItem('vascarin_modal_closed', 'true');
    setIsOpen(false);
    
    // Se a visita ainda não foi registrada nesta sessão, registra como anônima
    if (!sessionStorage.getItem('vascarin_visit_logged')) {
      registrarAcessoAnonimo();
      sessionStorage.setItem('vascarin_visit_logged', 'true');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert("Por favor, preencha seu nome e WhatsApp.");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, '');

    if (cleanPhone.length !== 11) {
      alert("Por favor, digite um número de WhatsApp válido contendo exatamente 11 dígitos (com DDD e o 9º dígito).");
      return;
    }

    setIsSubmitting(true);
    
    const clientData = { name, phone: cleanPhone, wantsUpdates };
    localStorage.setItem('vascarin_client', JSON.stringify(clientData));

    // Registra a pessoa e marca a sessão
    await registrarAcesso(name, cleanPhone);
    sessionStorage.setItem('vascarin_visit_logged', 'true');

    setIsSubmitting(false);
    setIsOpen(false);
    window.location.reload();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-white relative w-full max-w-md rounded-2xl shadow-2xl p-8 flex flex-col gap-5 animate-in fade-in zoom-in duration-300">
        
        {/* BOTÃO FECHAR (X) */}
        <button 
          onClick={handleClose}
          title="Fechar e ver catálogo"
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition-colors cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>

        <div className="text-center mt-2">
          <span className="text-xs font-black uppercase tracking-widest text-black block mb-1">Vascarin Beauty</span>
          <h2 className="text-sm font-bold text-gray-800 pr-4 pl-4">Identifique-se para ver os preços exclusivos e catálogo.</h2>
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

          {/* CHECKBOX DE ATUALIZAÇÕES */}
          <label className="flex items-center gap-2 mt-1 mb-1 cursor-pointer group">
            <input 
              type="checkbox" 
              checked={wantsUpdates} 
              onChange={(e) => setWantsUpdates(e.target.checked)} 
              className="w-4 h-4 accent-black cursor-pointer"
            />
            <span className="text-[10px] text-gray-600 font-bold uppercase group-hover:text-black transition-colors">
              Desejo receber promoções e novidades no WhatsApp
            </span>
          </label>

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