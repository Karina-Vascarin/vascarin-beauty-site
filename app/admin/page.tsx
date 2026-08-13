"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'abandonados' | 'favoritos'>('abandonados');
  const [abandonados, setAbandonados] = useState<any[]>([]);
  const [favoritos, setFavoritos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Busca os dados do Supabase assim que o painel carrega
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    // Busca carrinhos e favoritos direto do banco
    const { data: aban } = await supabase.from('carrinhos_abandonados').select('*').order('created_at', { ascending: false });
    const { data: fav } = await supabase.from('favoritos').select('*').order('created_at', { ascending: false });
    
    if (aban) setAbandonados(aban);
    if (fav) setFavoritos(fav);
    setLoading(false);
  };

  const totalLeads = abandonados.length;
  const totalVisitas = abandonados.reduce((acc, curr) => acc + (curr.visitas || 1), 0);
  const ativos = abandonados.filter(a => a.status !== 'Esvaziou a sacola').length;

  return (
    <div className="p-10 bg-gray-100 min-h-screen">
      <div className="flex gap-4 mb-6">
        <button onClick={() => setActiveTab('abandonados')} className={`p-3 font-bold text-xs uppercase ${activeTab === 'abandonados' ? 'bg-black text-white' : 'bg-gray-300'}`}>Leads (Carrinhos)</button>
        <button onClick={() => setActiveTab('favoritos')} className={`p-3 font-bold text-xs uppercase ${activeTab === 'favoritos' ? 'bg-pink-600 text-white' : 'bg-gray-300'}`}>Favoritos</button>
        <button onClick={fetchData} className="ml-auto p-3 bg-blue-600 text-white font-bold text-xs uppercase">🔄 Atualizar Dados</button>
      </div>

      {activeTab === 'abandonados' && (
        <>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-6 rounded shadow">Total Leads: {totalLeads}</div>
            <div className="bg-white p-6 rounded shadow">Visitas Totais: {totalVisitas}</div>
            <div className="bg-white p-6 rounded shadow">Ativos: {ativos}</div>
          </div>
          {loading ? <p>Carregando...</p> : abandonados.map((a, i) => (
            <div key={i} className="bg-white p-4 mb-2 shadow rounded flex justify-between items-center text-xs">
              <div><strong>{a.nome}</strong> - {a.telefone} - <span className="font-bold text-gray-500">{a.status} ({a.visitas} visitas)</span></div>
              <a href={`https://wa.me/55${a.telefone}`} target="_blank" className="bg-green-600 text-white p-2 rounded">Chamar no Whats</a>
            </div>
          ))}
        </>
      )}

      {activeTab === 'favoritos' && (
        <div>
          {loading ? <p>Carregando...</p> : favoritos.map((f, i) => (
            <div key={i} className="bg-white p-4 mb-2 shadow rounded flex justify-between items-center text-xs">
              <div><strong>{f.nome}</strong> - {f.produtos}</div>
              <a href={`https://wa.me/55${f.telefone}`} target="_blank" className="bg-green-600 text-white p-2 rounded">Chamar no Whats</a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}