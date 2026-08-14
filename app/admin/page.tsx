"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState<'pedidos' | 'abandonados' | 'favoritos' | 'clientes' | 'historico' | 'novo'>('pedidos');

  const [pedidos, setPedidos] = useState<any[]>([]);
  const [abandonados, setAbandonados] = useState<any[]>([]);
  const [favoritos, setFavoritos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);
  const [storeProducts, setStoreProducts] = useState<any[]>([]);

  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualItems, setManualItems] = useState('');
  const [manualTotal, setManualTotal] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);

  const formatPhone = (value: string) => {
    return value.replace(/\D/g, "").replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2").slice(0, 15);
  };

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
    const { data: hist } = await supabase.from('historico_acessos').select('*').order('acessado_em', { ascending: false });
    if (hist) setHistorico(hist);

    try {
      const res = await fetch('/api/produtos');
      if (res.ok) setStoreProducts(await res.json());
    } catch (e) {}
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
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
      } else { setLoginError('Dados incorretos.'); }
    } catch (err) { setLoginError('Erro de conexão.'); }
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    await supabase.from('pedidos').update({ status: newStatus }).eq('id', orderId);
    carregarTudo();
  };

  const handleDelete = async (orderId: string) => {
    if (confirm("Excluir pedido permanentemente?")) {
      await supabase.from('pedidos').delete().eq('id', orderId);
      carregarTudo();
    }
  };

  const exportarCSV = () => {
    const headers = ["ID", "Nome", "WhatsApp", "Itens", "Total", "Status"];
    const csv = [headers.join(","), ...pedidos.map(p => [p.id, p.nome, p.telefone, `"${p.items}"`, p.total, p.status].join(","))].join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'pedidos_vascarin.csv'; a.click();
  };

  const importarPedidos = (e: any) => {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const linhas = text.split('\n').slice(1);
      for (const linha of linhas) {
        const [id, nome, telefone, items, total, status] = linha.split(',');
        if (id) await supabase.from('pedidos').insert([{ id, nome, telefone, items: items.replace(/"/g, ''), total: Number(total), status: status || 'Separado' }]);
      }
      alert("Importação concluída!");
      carregarTudo();
    };
    reader.readAsText(file);
  };

  const handleSaveManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const orderId = `VASC-MANUAL-${Date.now().toString().slice(-4)}`;
    await supabase.from('pedidos').insert([{
      id: orderId, nome: manualName, telefone: manualPhone.replace(/\D/g, ''),
      items: manualItems, total: Number(manualTotal), status: 'Separado', tipo: 'Manual'
    }]);
    alert("Venda cadastrada com sucesso!");
    setManualName(''); setManualPhone(''); setManualItems(''); setManualTotal('');
    carregarTudo();
    setActiveTab('pedidos');
  };

  const handleAddItemToOrder = () => {
    if (!selectedProduct) return;
    const product = storeProducts.find((p: any) => p.nome === selectedProduct);
    const itemString = `${selectedQty}x ${selectedProduct}`;
    setManualItems(prev => prev ? `${prev}, ${itemString}` : itemString);
    if (product && product.preco) {
      setManualTotal(prev => (Number(prev || 0) + (Number(product.preco) * selectedQty)).toFixed(2));
    }
    setSelectedProduct(''); setSelectedQty(1);
  };

  if (!isLoggedIn) return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm flex flex-col gap-4">
        <h1 className="text-xs font-black uppercase text-center">Login Admin Vascarin</h1>
        {loginError && <p className="text-red-500 text-[10px] text-center font-bold">{loginError}</p>}
        <input type="email" placeholder="E-mail" onChange={e => setLoginEmail(e.target.value)} className="border p-3 text-xs rounded-lg" required />
        <input type="password" placeholder="Senha" onChange={e => setLoginPassword(e.target.value)} className="border p-3 text-xs rounded-lg" required />
        <button className="bg-black text-white py-3 rounded-lg text-xs font-bold uppercase">Entrar</button>
      </form>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow border border-gray-200">
        
        {/* Cabeçalho e Abas */}
        <div className="p-6 border-b flex flex-wrap gap-2 bg-black text-white rounded-t-2xl items-center justify-between">
          <h1 className="text-xs font-black uppercase">Painel Administrativo</h1>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setActiveTab('pedidos')} className={`px-3 py-2 text-[10px] font-bold uppercase rounded ${activeTab === 'pedidos' ? 'bg-white text-black' : 'bg-zinc-800'}`}>📦 Pedidos</button>
            <button onClick={() => setActiveTab('abandonados')} className={`px-3 py-2 text-[10px] font-bold uppercase rounded ${activeTab === 'abandonados' ? 'bg-white text-black' : 'bg-zinc-800'}`}>🛒 Leads</button>
            <button onClick={() => setActiveTab('favoritos')} className={`px-3 py-2 text-[10px] font-bold uppercase rounded ${activeTab === 'favoritos' ? 'bg-white text-black' : 'bg-zinc-800'}`}>💖 Favoritos</button>
            <button onClick={() => setActiveTab('historico')} className={`px-3 py-2 text-[10px] font-bold uppercase rounded ${activeTab === 'historico' ? 'bg-white text-black' : 'bg-zinc-800'}`}>🕒 Histórico</button>
            <button onClick={() => setActiveTab('novo')} className={`px-3 py-2 text-[10px] font-bold uppercase rounded ${activeTab === 'novo' ? 'bg-white text-black' : 'bg-green-600'}`}>+ Venda Manual</button>
          </div>
        </div>

        <div className="p-8">
          
          {/* Aba Pedidos */}
          {activeTab === 'pedidos' && (
            <div>
              <div className="flex gap-2 mb-6">
                <button onClick={exportarCSV} className="bg-blue-600 text-white px-4 py-2 text-xs font-bold uppercase rounded">Exportar Relatório</button>
                <label className="bg-green-600 text-white px-4 py-2 text-xs font-bold uppercase rounded cursor-pointer">
                  Importar Vendas Antigas (CSV) <input type="file" onChange={importarPedidos} className="hidden" />
                </label>
              </div>

              {pedidos.map((p, i) => (
                <div key={i} className="border p-4 mb-3 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4 text-xs bg-gray-50">
                  <div>
                    <strong>{p.id}</strong> - {p.nome} ({p.telefone}) - <span className="font-bold text-amber-600">{p.status}</span>
                    <p className="text-gray-600 mt-1">{p.items} | <strong>R$ {Number(p.total).toFixed(2)}</strong></p>
                  </div>
                  <div className="flex gap-2">
                    {p.status === 'Pendente / A Separar' && <button onClick={() => handleUpdateStatus(p.id, 'Separado')} className="bg-blue-600 text-white px-3 py-1.5 rounded">✔ Separar</button>}
                    <button onClick={() => handleUpdateStatus(p.id, p.status === 'Cancelado' ? 'Pendente / A Separar' : 'Cancelado')} className="bg-orange-500 text-white px-3 py-1.5 rounded">Cancelar</button>
                    <button onClick={() => handleDelete(p.id)} className="bg-red-600 text-white px-3 py-1.5 rounded">Excluir</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Aba Leads */}
          {activeTab === 'abandonados' && abandonados.map((a, i) => (
            <div key={i} className="border p-4 mb-3 rounded-xl flex justify-between items-center text-xs">
              <div><strong>{a.nome}</strong> ({a.telefone}) - <span className="text-gray-500">{a.itens_summary}</span></div>
              <a href={`https://wa.me/55${a.telefone}`} target="_blank" className="bg-green-600 text-white px-3 py-2 rounded font-bold">WhatsApp</a>
            </div>
          ))}

          {/* Aba Favoritos */}
          {activeTab === 'favoritos' && favoritos.map((f, i) => (
            <div key={i} className="border p-4 mb-3 rounded-xl flex justify-between items-center text-xs">
              <div><strong>{f.nome}</strong> - <span className="text-pink-600 font-bold">{f.produtos}</span></div>
              <a href={`https://wa.me/55${f.telefone}`} target="_blank" className="bg-pink-600 text-white px-3 py-2 rounded font-bold">Oferecer</a>
            </div>
          ))}

          {/* Aba Histórico */}
          {activeTab === 'historico' && historico.map((h, i) => (
            <div key={i} className="border-b py-3 text-xs flex justify-between items-center">
              <span><strong>{h.nome}</strong> ({h.telefone})</span>
              <span className="text-gray-500 font-mono">
                {new Date(h.acessado_em).toLocaleDateString('pt-BR')} às {new Date(h.acessado_em).toLocaleTimeString('pt-BR')}
              </span>
            </div>
          ))}

          {/* Aba Venda Manual */}
          {activeTab === 'novo' && (
            <form onSubmit={handleSaveManualOrder} className="flex flex-col gap-4 max-w-lg">
              <input type="text" placeholder="Nome do Cliente" value={manualName} onChange={e => setManualName(e.target.value)} className="border p-3 text-xs rounded-lg" required />
              <input type="text" placeholder="WhatsApp" value={formatPhone(manualPhone)} onChange={e => setManualPhone(e.target.value)} className="border p-3 text-xs rounded-lg" required />
              
              <div className="flex gap-2">
                <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} className="flex-1 border p-3 text-xs rounded-lg bg-white">
                  <option value="">Selecione um perfume...</option>
                  {storeProducts.map((p: any) => <option key={p.id} value={p.nome}>{p.nome} - R$ {Number(p.preco).toFixed(2)}</option>)}
                </select>
                <input type="number" min="1" value={selectedQty} onChange={e => setSelectedQty(Number(e.target.value))} className="w-16 border p-3 text-xs rounded-lg text-center" />
                <button type="button" onClick={handleAddItemToOrder} className="bg-black text-white px-4 text-xs font-bold uppercase rounded-lg">Incluir</button>
              </div>

              <textarea placeholder="Itens selecionados" value={manualItems} onChange={e => setManualItems(e.target.value)} className="border p-3 text-xs rounded-lg bg-gray-50" required />
              <input type="number" step="0.01" placeholder="Total R$" value={manualTotal} onChange={e => setManualTotal(e.target.value)} className="border p-3 text-xs rounded-lg font-bold" required />
              
              <button className="bg-green-600 text-white p-4 uppercase font-bold text-xs rounded-lg">Salvar Venda Manual</button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}