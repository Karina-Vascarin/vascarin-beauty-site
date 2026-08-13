"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'abandonados' | 'favoritos'>('abandonados');
  const [abandonados, setAbandonados] = useState<any[]>([]);
  const [favoritos, setFavoritos] = useState<any[]>([]);

  useEffect(() => {
    if (localStorage.getItem('vascarin_admin_auth') === 'true') {
      setIsLoggedIn(true);
      fetchData();
    }
  }, []);

  const fetchData = async () => {
    const { data: aban } = await supabase.from('carrinhos_abandonados').select('*').order('created_at', { ascending: false });
    const { data: fav } = await supabase.from('favoritos').select('*').order('created_at', { ascending: false });
    if (aban) setAbandonados(aban);
    if (fav) setFavoritos(fav);
  };

  if (!isLoggedIn) return <div className="p-10 text-center">Login necessário.</div>;

  return (
    <div className="p-10 bg-gray-100 min-h-screen">
      <div className="flex gap-4 mb-6">
        <button onClick={() => setActiveTab('abandonados')} className="bg-black text-white p-3 font-bold text-xs uppercase">Leads (Carrinhos)</button>
        <button onClick={() => setActiveTab('favoritos')} className="bg-pink-600 text-white p-3 font-bold text-xs uppercase">Favoritos</button>
      </div>

      {activeTab === 'abandonados' && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white p-6 rounded shadow">Total Leads: {abandonados.length}</div>
          <div className="bg-white p-6 rounded shadow">Visitas Totais: {abandonados.reduce((a, b) => a + (b.visitas || 1), 0)}</div>
          <div className="bg-white p-6 rounded shadow">Ativos: {abandonados.filter(a => !a.status?.includes('Esvaziou')).length}</div>
        </div>
      )}

      {activeTab === 'abandonados' && abandonados.map((a, i) => (
        <div key={i} className="bg-white p-4 mb-2 shadow rounded flex justify-between items-center text-xs">
          <div>{a.nome} - {a.telefone} - <span className="font-bold text-gray-500">{a.status} ({a.visitas} visitas)</span></div>
          <a href={`https://wa.me/55${a.telefone}`} target="_blank" className="bg-green-600 text-white p-2 rounded">Chamar</a>
        </div>
      ))}
      
      {activeTab === 'favoritos' && favoritos.map((f, i) => (
        <div key={i} className="bg-white p-4 mb-2 shadow rounded flex justify-between items-center text-xs">
          <div>{f.nome} - {f.produtos}</div>
          <a href={`https://wa.me/55${f.telefone}`} target="_blank" className="bg-green-600 text-white p-2 rounded">Chamar</a>
        </div>
      ))}
    </div>
  );
}