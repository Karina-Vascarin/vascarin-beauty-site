"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Navegação das Abas
  const [activeTab, setActiveTab] = useState<'pedidos' | 'abandonados' | 'favoritos' | 'clientes' | 'novo'>('pedidos');

  // Estados dos Dados do Banco
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [abandonados, setAbandonados] = useState<any[]>([]);
  const [favoritos, setFavoritos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [storeProducts, setStoreProducts] = useState<any[]>([]);

  // Estados para Venda Manual
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualItems, setManualItems] = useState('');
  const [manualTotal, setManualTotal] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);

  useEffect(() => {
    if (localStorage.getItem('vascarin_admin_auth') === 'true') {
      setIsLoggedIn(true);
      carregarTudo();
    }
  }, []);

  const carregarTudo = async () => {
    const { data: ped } = await supabase.from('pedidos').select('*').order('created_at', { ascending: false });
    if (ped) setPedidos(ped);
    const { data: aban } = await supabase.from('carrinhos_abandonados').select('*').order('updated_at', { ascending: false });
    if (aban) setAbandonados(aban);
    const { data: fav } = await supabase.from('favoritos').select('*').order('updated_at', { ascending: false });
    if (fav) setFavoritos(fav);
    const { data: cli } = await supabase.from('clientes').select('*').order('updated_at', { ascending: false });
    if (cli) setClientes(cli);
    try {
      const res = await fetch('/api/produtos');
      if (res.ok) setStoreProducts(await res.json());
    } catch (e) {}
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    try {
      const res = await fetch('/api/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPassword })
      });
      if (res.ok) {
        localStorage.setItem('vascarin_admin_auth', 'true');
        setIsLoggedIn(true);
        carregarTudo();
      } else {
        setLoginError('E-mail ou senha incorretos.');
      }
    } catch (err) {
      setLoginError('Erro de conexão ao autenticar.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vascarin_admin_auth');
    setIsLoggedIn(false);
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    const { error } = await supabase.from('pedidos').update({ status: newStatus }).eq('id', orderId);
    if (!error) {
      setPedidos(pedidos.map(p => p.id === orderId ? { ...p, status: newStatus } : p));
    }
  };

  const handleSaveManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const orderId = `VASC-MANUAL-${Date.now().toString().slice(-4)}`;
    const { error } = await supabase.from('pedidos').insert([{
      id: orderId,
      nome: manualName,
      telefone: manualPhone.replace(/\D/g, ''),
      items: manualItems,
      total: Number(manualTotal),
      forma_pagamento: 'Venda Manual',
      status: 'Separado',
      tipo: 'Manual'
    }]);

    if (error) {
      alert("Erro ao salvar: " + error.message);
    } else {
      alert(`Pedido manual #${orderId} cadastrado com sucesso!`);
      setManualName(''); setManualPhone(''); setManualItems(''); setManualTotal('');
      carregarTudo();
      setActiveTab('pedidos');
    }
  };

  const handleAddItemToOrder = () => {
    if (!selectedProduct) return;
    const product = storeProducts.find((p: any) => p.nome === selectedProduct);
    const itemString = `${selectedQty}x ${selectedProduct}`;
    setManualItems(prev => prev ? `${prev}, ${itemString}` : itemString);
    if (product && product.preco) {
      const totalAtual = Number(manualTotal) || 0;
      setManualTotal((totalAtual + (Number(product.preco) * selectedQty)).toFixed(2));
    }
    setSelectedProduct(''); setSelectedQty(1);
  };

  const handleExportCSV = () => {
    if (pedidos.length === 0) return alert("Nenhum pedido.");
    const headers = ['ID', 'Nome', 'Telefone', 'Itens', 'Total (R$)', 'Status', 'Origem'];
    const rows = pedidos.map(p => [p.id, p.nome, p.telefone, `"${p.items}"`, p.total, p.status, p.tipo]);
    const csv = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(';'), ...rows.map(e => e.join(';'))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = 'pedidos.csv';
    link.click();
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm flex flex-col gap-5">
          <h1 className="text-xs font-black uppercase text-center">Vascarin Beauty</h1>
          <input type="email" placeholder="E-mail" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="border p-3 text-xs rounded-lg outline-none" required />
          <input type="password" placeholder="Senha" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="border p-3 text-xs rounded-lg outline-none" required />
          <button type="submit" className="w-full bg-black text-white text-xs font-bold uppercase py-3 rounded-lg">Entrar</button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      {/* O SEU LAYOUT ORIGINAL SEGUE AQUI... */}
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow border">
        <div className="p-6 border-b bg-black text-white flex flex-wrap gap-2 rounded-t-2xl">
          <button onClick={() => setActiveTab('pedidos')} className={`px-4 py-2 text-xs font-bold uppercase rounded ${activeTab === 'pedidos' ? 'bg-white text-black' : 'bg-zinc-800'}`}>📦 Pedidos</button>
          <button onClick={() => setActiveTab('abandonados')} className={`px-4 py-2 text-xs font-bold uppercase rounded ${activeTab === 'abandonados' ? 'bg-white text-black' : 'bg-zinc-800'}`}>🛒 Abandonados</button>
          <button onClick={() => setActiveTab('favoritos')} className={`px-4 py-2 text-xs font-bold uppercase rounded ${activeTab === 'favoritos' ? 'bg-white text-black' : 'bg-zinc-800'}`}>💖 Favoritos</button>
          <button onClick={() => setActiveTab('clientes')} className={`px-4 py-2 text-xs font-bold uppercase rounded ${activeTab === 'clientes' ? 'bg-white text-black' : 'bg-zinc-800'}`}>👥 Clientes</button>
          <button onClick={() => setActiveTab('novo')} className={`px-4 py-2 text-xs font-bold uppercase rounded ${activeTab === 'novo' ? 'bg-white text-black' : 'bg-green-600'}`}>+ Venda Manual</button>
          <button onClick={handleLogout} className="px-4 py-2 text-xs font-bold uppercase rounded bg-red-600 ml-auto">Sair</button>
        </div>

        <div className="p-8">
           {/* Aqui entram as renderizações de cada aba (como você tinha no seu arquivo) */}
           {/* Certifique-se de que cada aba chame handleUpdateStatus ou handleDelete conforme necessário */}
        </div>
      </div>
    </div>
  );
}