"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'pedidos' | 'historico'>('pedidos');
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);

  useEffect(() => {
    if (localStorage.getItem('vascarin_admin_auth') === 'true') {
      setIsLoggedIn(true);
      carregarTudo();
    }
  }, []);

  const carregarTudo = async () => {
    const { data: ped } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false });
    if (ped) setPedidos(ped);
    const { data: hist } = await supabase.from('historico_acessos').select('*').order('acessado_em', { ascending: false });
    if (hist) setHistorico(hist);
  };

  if (!isLoggedIn) return <div className="p-20 text-center">Acesso restrito.</div>;

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto bg-white p-6 rounded-2xl shadow">
        <div className="flex gap-2 mb-6">
          <button onClick={() => setActiveTab('pedidos')} className="bg-black text-white p-3 text-xs font-bold uppercase rounded">Pedidos</button>
          <button onClick={() => setActiveTab('historico')} className="bg-purple-600 text-white p-3 text-xs font-bold uppercase rounded">Histórico de Acessos</button>
        </div>

        {activeTab === 'pedidos' && pedidos.map((p, i) => (
          <div key={i} className="border-b py-4 flex justify-between items-center text-xs">
            <div><strong>{p.id}</strong> - {p.nome} - {p.status}</div>
            <div className="flex gap-2">
              <button onClick={async() => { await supabase.from('pedidos').delete().eq('id', p.id); carregarTudo(); }} className="bg-red-600 text-white px-2 py-1 rounded">Excluir</button>
            </div>
          </div>
        ))}

        {activeTab === 'historico' && historico.map((h, i) => (
          <div key={i} className="border-b py-3 text-xs flex justify-between">
            <span><strong>{h.nome}</strong> - {h.telefone}</span>
            <span className="text-gray-500">
              {new Date(h.acessado_em).toLocaleDateString('pt-BR')} às {new Date(h.acessado_em).toLocaleTimeString('pt-BR')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}