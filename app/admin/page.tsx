"use client";

import { useState, useEffect, useRef } from 'react';

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const [activeTab, setActiveTab] = useState<'pedidos' | 'abandonados' | 'favoritos' | 'novo'>('pedidos');
  
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [abandonados, setAbandonados] = useState<any[]>([]);
  const [favoritos, setFavoritos] = useState<any[]>([]);
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
      fetchAbandonados();
      fetchFavoritos();
    }
    const savedPedidos = JSON.parse(localStorage.getItem('admin_pedidos') || '[]');
    setPedidos(savedPedidos);
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/produtos');
      if (res.ok) setStoreProducts(await res.json());
    } catch (error) {}
  };

  const fetchAbandonados = async () => {
    try {
      const res = await fetch('/api/carrinho-abandonado');
      if (res.ok) setAbandonados(await res.json());
    } catch (error) {}
  };

  const fetchFavoritos = async () => {
    try {
      const res = await fetch('/api/favoritos');
      if (res.ok) setFavoritos(await res.json());
    } catch (error) {}
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
        fetchProducts(); fetchAbandonados(); fetchFavoritos();
      } else {
        setLoginError('E-mail ou senha incorretos.');
      }
    } catch (err) {
      setLoginError('Erro de conexão.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('vascarin_admin_auth');
    setIsLoggedIn(false);
  };

  const handleAddManualOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const lastNum = localStorage.getItem('lastOrderNumber') ? parseInt(localStorage.getItem('lastOrderNumber')!) : 69;
    const newNum = lastNum + 1;
    localStorage.setItem('lastOrderNumber', newNum.toString());

    const newOrder = { id: `VASC-${newNum}`, name: manualName, phone: manualPhone, items: manualItems, total: manualTotal, status: 'Entregue / Concluído', type: 'Manual' };
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
    setSelectedProduct(''); setSelectedQty(1);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-xl shadow-xl w-full max-w-sm flex flex-col gap-5">
          <div className="text-center mb-2">
            <h1 className="text-xs font-black uppercase tracking-widest block">Vascarin Beauty</h1>
            <p className="text-gray-500 text-[11px] uppercase mt-1">Acesso Restrito</p>
          </div>
          {loginError && <div className="p-3 bg-red-50 text-red-700 text-xs font-bold rounded">{loginError}</div>}
          <div className="flex flex-col gap-3">
            <input type="email" placeholder="E-mail admin" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className="border p-3 text-xs rounded outline-none focus:border-black" required />
            <input type="password" placeholder="Senha" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className="border p-3 text-xs rounded outline-none focus:border-black" required />
          </div>
          <button type="submit" disabled={isAuthenticating} className="w-full bg-black text-white text-xs font-bold uppercase py-3.5 rounded hover:bg-zinc-800 disabled:opacity-50">
            {isAuthenticating ? 'Autenticando...' : 'Entrar'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
        
        <div className="p-6 border-b flex flex-col sm:flex-row justify-between sm:items-center bg-black text-white gap-4">
          <h1 className="text-xs font-black uppercase tracking-widest">Painel Admin</h1>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setActiveTab('pedidos')} className={`px-4 py-2 text-[10px] font-bold uppercase rounded ${activeTab === 'pedidos' ? 'bg-white text-black' : 'bg-zinc-800 text-white'}`}>Pedidos</button>
            <button onClick={() => setActiveTab('abandonados')} className={`px-4 py-2 text-[10px] font-bold uppercase rounded ${activeTab === 'abandonados' ? 'bg-white text-black' : 'bg-zinc-800 text-white'}`}>Abandonados</button>
            <button onClick={() => setActiveTab('favoritos')} className={`px-4 py-2 text-[10px] font-bold uppercase rounded ${activeTab === 'favoritos' ? 'bg-white text-black' : 'bg-zinc-800 text-white'}`}>Favoritos</button>
            <button onClick={() => setActiveTab('novo')} className={`px-4 py-2 text-[10px] font-bold uppercase rounded ${activeTab === 'novo' ? 'bg-white text-black' : 'bg-zinc-800 text-white'}`}>+ Adicionar</button>
            <button onClick={handleLogout} className="px-4 py-2 text-[10px] font-bold uppercase rounded bg-red-600 text-white ml-auto">Sair</button>
          </div>
        </div>

        <div className="p-6">
          
          {/* ABA PEDIDOS OCULTADA POR BREVIDADE (Mantive o código exato anterior) */}
          {activeTab === 'pedidos' && (
            <div>
              <h2 className="text-xs font-bold uppercase text-gray-500 mb-4">Todos os Pedidos</h2>
              {pedidos.length === 0 ? <p className="text-xs text-gray-400">Nenhum pedido registrado.</p> : (
                <div className="space-y-3">
                  {pedidos.map((p, i) => (
                    <div key={i} className="border p-4 rounded flex justify-between items-center text-xs">
                      <div><strong>{p.id}</strong> — {p.name} <br/><span className="text-gray-500">{p.items} | R$ {p.total}</span></div>
                      <span className="px-3 py-1 bg-green-100 text-green-800 font-bold rounded-full">{p.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'abandonados' && (
            <div>
              <h2 className="text-xs font-bold uppercase text-gray-500 mb-4">Monitoramento de Carrinhos</h2>
              <button onClick={fetchAbandonados} className="mb-4 text-[10px] bg-gray-100 px-3 py-1 rounded font-bold hover:bg-gray-200">🔄 Atualizar Lista</button>
              
              {abandonados.length === 0 ? <p className="text-xs text-gray-400">Nenhum registro encontrado.</p> : (
                <div className="space-y-3">
                  {abandonados.map((a, i) => (
                    <div key={i} className={`border p-4 rounded flex flex-col sm:flex-row justify-between sm:items-center text-xs gap-3 ${a.status?.includes('Esvaziou') ? 'bg-gray-50' : 'bg-amber-50'}`}>
                      <div>
                        <strong>{a.nome}</strong> ({a.telefone})<br/>
                        <span className="text-gray-600">Histórico de itens: {a.itens_summary}</span><br/>
                        <span className={`text-[10px] font-bold uppercase ${a.status?.includes('Esvaziou') ? 'text-red-500' : 'text-amber-600'}`}>{a.status || 'Abandonado'}</span>
                      </div>
                      <a href={`https://wa.me/55${a.telefone}?text=Olá ${a.nome}! Vi que você estava olhando o ${a.itens_summary} na Vascarin Beauty. Posso tirar alguma dúvida?`} target="_blank" className="bg-green-600 text-white px-4 py-2 font-bold rounded text-center">
                        Chamar no WhatsApp
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'favoritos' && (
            <div>
              <h2 className="text-xs font-bold uppercase text-gray-500 mb-4">Produtos Favoritados (Desejos das Clientes)</h2>
              <button onClick={fetchFavoritos} className="mb-4 text-[10px] bg-gray-100 px-3 py-1 rounded font-bold hover:bg-gray-200">🔄 Atualizar Lista</button>
              
              {favoritos.length === 0 ? <p className="text-xs text-gray-400">Ninguém favoritou produtos ainda.</p> : (
                <div className="space-y-3">
                  {favoritos.map((f, i) => (
                    <div key={i} className="border p-4 rounded flex flex-col sm:flex-row justify-between sm:items-center text-xs bg-pink-50 gap-3">
                      <div>
                        <strong>{f.nome}</strong> ({f.telefone})<br/>
                        <span className="text-gray-600">💖 Favoritou: {f.produtos}</span>
                      </div>
                      <a href={`https://wa.me/55${f.telefone}?text=Olá ${f.nome}! Vimos que você favoritou o ${f.produtos} na Vascarin Beauty. Que tal fechar o pedido hoje?`} target="_blank" className="bg-green-600 text-white px-4 py-2 font-bold rounded text-center">
                        Chamar no WhatsApp
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ABA NOVO OCULTADA POR BREVIDADE (Mantive o código exato anterior do construtor de itens) */}
          {activeTab === 'novo' && (
            <form onSubmit={handleAddManualOrder} className="max-w-lg flex flex-col gap-5">
              <h2 className="text-xs font-bold uppercase text-gray-500">Cadastrar Pedido Manual</h2>
              <div className="flex flex-col gap-2">
                <input type="text" placeholder="Nome da Cliente" value={manualName} onChange={(e) => setManualName(e.target.value)} className="border p-2.5 text-xs rounded outline-none" required />
                <input type="text" placeholder="Telefone / WhatsApp" value={manualPhone} onChange={(e) => setManualPhone(e.target.value)} className="border p-2.5 text-xs rounded outline-none" required />
              </div>
              <div className="border p-4 rounded bg-gray-50 flex flex-col gap-3">
                <h3 className="text-[11px] font-bold uppercase text-gray-600">Adicionar Produtos</h3>
                <div className="flex gap-2">
                  <select value={selectedProduct} onChange={(e) => setSelectedProduct(e.target.value)} className="flex-1 border p-2.5 text-xs rounded bg-white">
                    <option value="">Selecione...</option>
                    {storeProducts.map((p: any) => <option key={p.id} value={p.nome}>{p.nome} — R$ {p.preco}</option>)}
                  </select>
                  <input type="number" min="1" value={selectedQty} onChange={(e) => setSelectedQty(Number(e.target.value))} className="w-16 border p-2.5 text-xs rounded text-center" />
                  <button type="button" onClick={handleAddItemToOrder} className="bg-black text-white text-xs font-bold px-4 rounded">+ Add</button>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <input type="text" placeholder="Itens" value={manualItems} onChange={(e) => setManualItems(e.target.value)} className="border p-2.5 text-xs rounded" required />
                <input type="number" placeholder="Total (R$)" value={manualTotal} onChange={(e) => setManualTotal(e.target.value)} className="border p-2.5 text-xs rounded" required />
              </div>
              <button type="submit" className="bg-green-600 text-white text-xs font-bold py-3.5 rounded">Salvar</button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}