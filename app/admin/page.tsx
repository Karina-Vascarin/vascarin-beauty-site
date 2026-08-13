"use client";

import { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'pedidos' | 'abandonados' | 'novo'>('pedidos');
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [abandonados, setAbandonados] = useState<any[]>([]);

  // Estados para pedido manual
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualItems, setManualItems] = useState('');
  const [manualTotal, setManualTotal] = useState('');

  useEffect(() => {
    // Carregar dados salvos ou do Supabase
    const savedPedidos = JSON.parse(localStorage.getItem('admin_pedidos') || '[]');
    setPedidos(savedPedidos);
    
    const savedAbandonados = JSON.parse(localStorage.getItem('admin_abandonados') || '[]');
    setAbandonados(savedAbandonados);
  }, []);

  const handleAddManualOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const lastNum = localStorage.getItem('lastOrderNumber') ? parseInt(localStorage.getItem('lastOrderNumber')!) : 69;
    const newNum = lastNum + 1;
    localStorage.setItem('lastOrderNumber', newNum.toString());

    const newOrder = {
      id: `VASC-${newNum}`,
      name: manualName,
      phone: manualPhone,
      items: manualItems,
      total: manualTotal,
      status: 'Entregue / Concluído',
      type: 'Manual'
    };

    const updated = [newOrder, ...pedidos];
    setPedidos(updated);
    localStorage.setItem('admin_pedidos', JSON.stringify(updated));

    alert(`Pedido manual #${newOrder.id} cadastrado com sucesso!`);
    setManualName(''); setManualPhone(''); setManualItems(''); setManualTotal('');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        
        {/* Cabeçalho Admin */}
        <div className="p-6 border-b flex justify-between items-center bg-black text-white">
          <h1 className="text-xs font-black uppercase tracking-widest">Painel Administrativo — Vascarin Beauty</h1>
          <div className="flex gap-2">
            <button onClick={() => setActiveTab('pedidos')} className={`px-4 py-2 text-xs font-bold uppercase rounded ${activeTab === 'pedidos' ? 'bg-white text-black' : 'bg-zinc-800 text-white'}`}>Pedidos</button>
            <button onClick={() => setActiveTab('abandonados')} className={`px-4 py-2 text-xs font-bold uppercase rounded ${activeTab === 'abandonados' ? 'bg-white text-black' : 'bg-zinc-800 text-white'}`}>Carrinhos Abandonados</button>
            <button onClick={() => setActiveTab('novo')} className={`px-4 py-2 text-xs font-bold uppercase rounded ${activeTab === 'novo' ? 'bg-white text-black' : 'bg-zinc-800 text-white'}`}>+ Adicionar Pedido Manual</button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'pedidos' && (
            <div>
              <h2 className="text-xs font-bold uppercase text-gray-500 mb-4">Todos os Pedidos (Site e Manuais)</h2>
              {pedidos.length === 0 ? <p className="text-xs text-gray-400">Nenhum pedido registrado ainda.</p> : (
                <div className="space-y-3">
                  {pedidos.map((p, i) => (
                    <div key={i} className="border p-4 rounded flex justify-between items-center text-xs">
                      <div>
                        <strong className="text-black">{p.id}</strong> — {p.name} ({p.phone}) <br/>
                        <span className="text-gray-500">Itens: {p.items} | Total: R$ {p.total}</span>
                      </div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 font-bold rounded-full">{p.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'abandonados' && (
            <div>
              <h2 className="text-xs font-bold uppercase text-gray-500 mb-4">Carrinhos Abandonados (Oportunidades de Venda)</h2>
              {abandonados.length === 0 ? <p className="text-xs text-gray-400">Nenhum carrinho abandonado recentemente.</p> : (
                <div className="space-y-3">
                  {abandonados.map((a, i) => (
                    <div key={i} className="border p-4 rounded flex justify-between items-center text-xs bg-amber-50">
                      <div>
                        <strong>{a.name}</strong> ({a.phone}) deixou itens na sacola.<br/>
                        <span className="text-gray-500">Itens: {a.itemsSummary}</span>
                      </div>
                      <a href={`https://wa.me/55${a.phone}?text=Olá ${a.name}, vimos que você deixou itens na sacola da Vascarin Beauty!`} target="_blank" className="bg-green-600 text-white px-4 py-2 font-bold rounded">
                        Recuperar no WhatsApp
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'novo' && (
            <form onSubmit={handleAddManualOrder} className="max-w-lg flex flex-col gap-4">
              <h2 className="text-xs font-bold uppercase text-gray-500">Cadastrar Pedido Manual (Entregue ou Externo)</h2>
              <input type="text" placeholder="Nome da Cliente" value={manualName} onChange={(e) => setManualName(e.target.value)} className="border p-2.5 text-xs rounded" required />
              <input type="text" placeholder="Telefone / WhatsApp" value={manualPhone} onChange={(e) => setManualPhone(e.target.value)} className="border p-2.5 text-xs rounded" required />
              <input type="text" placeholder="Descrição dos Itens (ex: 2x Brand Collection 001)" value={manualItems} onChange={(e) => setManualItems(e.target.value)} className="border p-2.5 text-xs rounded" required />
              <input type="number" placeholder="Valor Total (R$)" value={manualTotal} onChange={(e) => setManualTotal(e.target.value)} className="border p-2.5 text-xs rounded" required />
              <button type="submit" className="bg-black text-white text-xs font-bold uppercase py-3 rounded">Salvar Pedido Manual</button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}