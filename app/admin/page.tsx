"use client";

import { useState, useEffect, useRef } from 'react';

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [activeTab, setActiveTab] = useState<'pedidos' | 'abandonados' | 'novo'>('pedidos');
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [abandonados, setAbandonados] = useState<any[]>([]);
  
  // Lista de produtos vindos do seu CSV
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualItems, setManualItems] = useState('');
  const [manualTotal, setManualTotal] = useState('');
  
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const authStatus = localStorage.getItem('vascarin_admin_auth');
    if (authStatus === 'true') {
      setIsLoggedIn(true);
      fetchProducts();
    }

    const savedPedidos = JSON.parse(localStorage.getItem('admin_pedidos') || '[]');
    setPedidos(savedPedidos);
    
    const savedAbandonados = JSON.parse(localStorage.getItem('admin_abandonados') || '[]');
    setAbandonados(savedAbandonados);
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/produtos');
      if (res.ok) {
        const data = await res.json();
        setStoreProducts(data);
      }
    } catch (error) {
      console.error("Erro ao buscar produtos da loja:", error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthenticating(true);
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
        fetchProducts(); // Busca os produtos assim que logar
      } else {
        setLoginError('E-mail ou senha incorretos.');
      }
    } catch (err) {
      setLoginError('Erro ao tentar acessar. Verifique sua conexão.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vascarin_admin_auth');
    setIsLoggedIn(false);
    setLoginEmail('');
    setLoginPassword('');
  };

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

  const handleAddItemToOrder = () => {
    if (!selectedProduct) return;
    
    const product = storeProducts.find((p: any) => p.nome === selectedProduct);
    const productString = `${selectedQty}x ${selectedProduct}`;
    setManualItems(prev => prev ? `${prev}, ${productString}` : productString);
    
    if (product && product.preco) {
      const additionalCost = Number(product.preco) * selectedQty;
      const currentTotal = Number(manualTotal) || 0;
      setManualTotal((currentTotal + additionalCost).toFixed(2));
    }
    
    setSelectedProduct('');
    setSelectedQty(1);
  };

  const handleExportCSV = () => {
    if (pedidos.length === 0) return alert("Não há pedidos para exportar.");

    const headers = ['ID', 'Nome', 'Telefone', 'Itens', 'Total (R$)', 'Status', 'Origem'];
    const rows = pedidos.map(p => [p.id, p.name, p.phone, `"${p.items}"`, p.total, p.status, p.type]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(';'), ...rows.map(e => e.join(';'))].join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Relatorio_Vendas_Vascarin_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const text = evt.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim() !== '');
        const importedOrders = [];
        
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i].split(';');
          if (row.length >= 5) {
            importedOrders.push({
              id: row[0]?.trim() || `VASC-IMP-${Date.now()}-${i}`,
              name: row[1]?.trim() || 'Cliente Importado',
              phone: row[2]?.trim() || '-',
              items: row[3]?.replace(/"/g, '').trim() || '-',
              total: row[4]?.trim() || '0',
              status: row[5]?.trim() || 'Importado / Antigo',
              type: row[6]?.trim() || 'Planilha'
            });
          }
        }
        if (importedOrders.length > 0) {
          const updated = [...importedOrders, ...pedidos];
          setPedidos(updated);
          localStorage.setItem('admin_pedidos', JSON.stringify(updated));
          alert(`${importedOrders.length} pedidos foram importados com sucesso!`);
        } else {
          alert("Nenhum pedido válido foi encontrado na planilha.");
        }
      } catch (error) {
        alert("Erro ao ler a planilha. Verifique se está em CSV com ponto e vírgula (;).");
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-xl w-full max-w-sm flex flex-col gap-5 animate-in fade-in zoom-in duration-300">
          <div className="text-center mb-2">
            <h1 className="text-xs font-black uppercase tracking-widest text-black block">Vascarin Beauty</h1>
            <p className="text-gray-500 text-[11px] uppercase tracking-wider mt-1">Acesso Restrito</p>
          </div>
          {loginError && <div className="p-3 bg-red-50 text-red-700 text-xs text-center font-bold rounded">{loginError}</div>}
          <div className="flex flex-col gap-3">
            <input type="email" placeholder="E-mail de administrador" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="border border-gray-200 p-3 text-xs rounded focus:outline-none focus:border-black" required />
            <input type="password" placeholder="Sua senha" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="border border-gray-200 p-3 text-xs rounded focus:outline-none focus:border-black" required />
          </div>
          <button type="submit" disabled={isAuthenticating} className="w-full bg-black text-white text-xs font-bold uppercase py-3.5 rounded hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50">
            {isAuthenticating ? 'Autenticando...' : 'Entrar no Painel'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        
        <div className="p-6 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center bg-black text-white gap-4">
          <h1 className="text-xs font-black uppercase tracking-widest">Painel Admin — Vascarin Beauty</h1>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setActiveTab('pedidos')} className={`px-4 py-2 text-[10px] font-bold uppercase rounded transition-colors cursor-pointer ${activeTab === 'pedidos' ? 'bg-white text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}>Pedidos</button>
            <button onClick={() => setActiveTab('abandonados')} className={`px-4 py-2 text-[10px] font-bold uppercase rounded transition-colors cursor-pointer ${activeTab === 'abandonados' ? 'bg-white text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}>Abandonados</button>
            <button onClick={() => setActiveTab('novo')} className={`px-4 py-2 text-[10px] font-bold uppercase rounded transition-colors cursor-pointer ${activeTab === 'novo' ? 'bg-white text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}>+ Adicionar</button>
            <button onClick={handleLogout} className="px-4 py-2 text-[10px] font-bold uppercase rounded bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer ml-auto sm:ml-2">Sair</button>
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'pedidos' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4 border-b pb-4">
                <h2 className="text-xs font-bold uppercase text-gray-500">Todos os Pedidos (Site e Manuais)</h2>
                <div className="flex gap-2">
                  <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 text-[10px] font-bold uppercase rounded transition-colors flex items-center gap-1 border border-gray-200 cursor-pointer">
                    📥 Importar
                  </button>
                  <input type="file" accept=".csv" ref={fileInputRef} onChange={handleImportCSV} className="hidden" />
                  <button onClick={handleExportCSV} className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 text-[10px] font-bold uppercase rounded transition-colors flex items-center gap-1 cursor-pointer">
                    📊 Exportar
                  </button>
                </div>
              </div>

              {pedidos.length === 0 ? <p className="text-xs text-gray-400">Nenhum pedido registrado ainda.</p> : (
                <div className="space-y-3">
                  {pedidos.map((p, i) => (
                    <div key={i} className="border p-4 rounded flex flex-col sm:flex-row justify-between sm:items-center text-xs gap-3 hover:bg-gray-50 transition-colors">
                      <div>
                        <strong className="text-black">{p.id}</strong> — {p.name} ({p.phone}) <br/>
                        <span className="text-gray-500">Itens: {p.items} | Total: R$ {p.total}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400 font-bold uppercase border px-2 py-1 rounded">{p.type}</span>
                        <span className="px-3 py-1 bg-green-100 text-green-800 font-bold rounded-full w-fit">{p.status}</span>
                      </div>
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
                    <div key={i} className="border p-4 rounded flex flex-col sm:flex-row justify-between sm:items-center text-xs bg-amber-50 gap-3">
                      <div>
                        <strong>{a.name}</strong> ({a.phone}) deixou itens na sacola.<br/>
                        <span className="text-gray-500">Itens: {a.itemsSummary}</span>
                      </div>
                      <a href={`https://wa.me/55${a.phone}?text=Olá ${a.name}, vimos que você deixou itens na sacola da Vascarin Beauty!`} target="_blank" className="bg-green-600 text-white px-4 py-2 font-bold rounded text-center">
                        Recuperar no WhatsApp
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'novo' && (
            <form onSubmit={handleAddManualOrder} className="max-w-lg flex flex-col gap-5">
              <h2 className="text-xs font-bold uppercase text-gray-500">Cadastrar Pedido Manual</h2>
              
              <div className="flex flex-col gap-2">
                <input type="text" placeholder="Nome da Cliente" value={manualName} onChange={(e) => setManualName(e.target.value)} className="border p-2.5 text-xs rounded focus:outline-none focus:border-black" required />
                <input type="text" placeholder="Telefone / WhatsApp" value={manualPhone} onChange={(e) => setManualPhone(e.target.value)} className="border p-2.5 text-xs rounded focus:outline-none focus:border-black" required />
              </div>

              {/* CONSTRUTOR DE ITENS (Agora puxando dinamicamente do CSV via API) */}
              <div className="border border-gray-200 p-4 rounded bg-gray-50 flex flex-col gap-3">
                <h3 className="text-[11px] font-bold uppercase text-gray-600">Adicionar Produtos</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select 
                    value={selectedProduct} 
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="flex-1 border p-2.5 text-xs rounded focus:outline-none focus:border-black cursor-pointer bg-white"
                  >
                    <option value="">Selecione um produto da loja...</option>
                    {storeProducts.map((p: any) => (
                      <option key={p.id} value={p.nome}>
                        {p.nome} — R$ {p.preco.toFixed(2)}
                      </option>
                    ))}
                  </select>
                  
                  <div className="flex gap-2">
                    <input 
                      type="number" 
                      min="1"
                      value={selectedQty} 
                      onChange={(e) => setSelectedQty(Number(e.target.value))}
                      className="w-16 border p-2.5 text-xs rounded focus:outline-none focus:border-black text-center" 
                    />
                    <button 
                      type="button" 
                      onClick={handleAddItemToOrder}
                      className="bg-black text-white text-xs font-bold px-4 rounded hover:bg-zinc-800 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold uppercase text-gray-500">Descrição Final dos Itens</label>
                <input type="text" placeholder="Itens da compra" value={manualItems} onChange={(e) => setManualItems(e.target.value)} className="border p-2.5 text-xs rounded focus:outline-none focus:border-black" required />
                
                <label className="text-[10px] font-bold uppercase text-gray-500 mt-2">Valor Total (R$)</label>
                <input type="number" step="0.01" placeholder="Valor Total" value={manualTotal} onChange={(e) => setManualTotal(e.target.value)} className="border p-2.5 text-xs rounded focus:outline-none focus:border-black" required />
              </div>

              <button type="submit" className="bg-green-600 text-white text-xs font-bold uppercase py-3.5 rounded hover:bg-green-700 transition-colors cursor-pointer mt-2">Salvar Pedido Manual</button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
}