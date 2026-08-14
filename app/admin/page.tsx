"use client";

import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Navegação das Abas
  const [activeTab, setActiveTab] = useState<'pedidos' | 'abandonados' | 'favoritos' | 'clientes' | 'historico' | 'novo'>('pedidos');

  // Estados dos Dados do Banco
  const [pedidos, setPedidos] = useState<any[]>([]);
  const [abandonados, setAbandonados] = useState<any[]>([]);
  const [favoritos, setFavoritos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);
  const [storeProducts, setStoreProducts] = useState<any[]>([]);

  // Estados para Venda Manual
  const [manualName, setManualName] = useState('');
  const [manualPhone, setManualPhone] = useState('');
  const [manualItems, setManualItems] = useState('');
  const [manualTotal, setManualTotal] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedQty, setSelectedQty] = useState(1);

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const getWhatsAppMessage = (pedido: any) => {
    if (pedido.status === 'Separado') {
      return `Olá ${pedido.nome}! Tudo bem? Passando para avisar que o seu pedido #${pedido.id} já foi separado e está sendo preparado para entrega/envio! 📦✨ Em breve ele chegará até você! Qualquer dúvida, estamos à disposição.`;
    } else if (pedido.status === 'Entregue / Concluído') {
      return `Olá ${pedido.nome}! 🎉 Vimos que o seu pedido #${pedido.id} foi entregue!\n\nEsperamos muito que você ame os seus produtos! Quando puder, nos mande um feedback contando o que achou ou poste uma foto e nos marque no Instagram *@vascarin.beauty* 📸💖\n\nMuito obrigada por escolher a Vascarin Beauty!`;
    }
    return `Olá ${pedido.nome}! Informamos sobre o seu pedido #${pedido.id} na Vascarin Beauty.`;
  };

  // Adicionamos 'pularMensagem' para não abrir o WhatsApp ao desfazer o status
  const handleUpdateStatus = async (pedido: any, newStatus: string, pularMensagem: boolean = false) => {
    const { error } = await supabase.from('pedidos').update({ status: newStatus }).eq('id', pedido.id);
    
    if (!error) {
      setPedidos(pedidos.map(p => p.id === pedido.id ? { ...p, status: newStatus } : p));

      if (!pularMensagem) {
        if (newStatus === 'Separado') {
          const msg = `Olá ${pedido.nome}! Tudo bem? Passando para avisar que o seu pedido #${pedido.id} já foi separado e está sendo preparado para entrega/envio! 📦✨ Em breve ele chegará até você! Qualquer dúvida, estamos à disposição.`;
          window.open(`https://wa.me/55${pedido.telefone}?text=${encodeURIComponent(msg)}`, '_blank');
        } else if (newStatus === 'Entregue / Concluído') {
          const msg = `Olá ${pedido.nome}! 🎉 Vimos que o seu pedido #${pedido.id} foi entregue!\n\nEsperamos muito que você ame os seus produtos! Quando puder, nos mande um feedback contando o que achou ou poste uma foto e nos marque no Instagram *@vascarin.beauty* 📸💖\n\nMuito obrigada por escolher a Vascarin Beauty!`;
          window.open(`https://wa.me/55${pedido.telefone}?text=${encodeURIComponent(msg)}`, '_blank');
        }
      }
    } else {
      alert("Erro ao atualizar status: " + error.message);
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
      forma_pagamento: 'Venda Manual / Externa',
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
    if (pedidos.length === 0) return alert("Nenhum pedido para exportar.");
    const headers = ['ID', 'Nome', 'Telefone', 'Itens', 'Total (R$)', 'Status', 'Origem', 'Data'];
    const rows = pedidos.map(p => [p.id, p.nome, p.telefone, `"${p.items}"`, p.total, p.status, p.tipo, new Date(p.created_at).toLocaleDateString('pt-BR')]);
    const csv = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(';'), ...rows.map(e => e.join(';'))].join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `Vendas_Vascarin_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`;
    link.click();
  };

  const importarPedidos = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const linhas = text.split('\n').slice(1);
      for (const linha of linhas) {
        const [id, nome, telefone, items, total, status] = linha.split(';');
        if (id && nome) {
          await supabase.from('pedidos').insert([{ 
            id, 
            nome, 
            telefone, 
            items: items.replace(/"/g, ''), 
            total: Number(total), 
            status: status || 'Separado', 
            tipo: 'Importado' 
          }]);
        }
      }
      alert("Pedidos antigos importados com sucesso!");
      carregarTudo();
    };
    reader.readAsText(file);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-sm flex flex-col gap-5">
          <div className="text-center">
            <h1 className="text-xs font-black uppercase tracking-widest text-black">Vascarin Beauty</h1>
            <p className="text-gray-500 text-[11px] uppercase tracking-wider mt-1">Acesso Administrativo</p>
          </div>
          {loginError && <div className="p-3 bg-red-50 text-red-700 text-xs text-center font-bold rounded-lg">{loginError}</div>}
          <input type="email" placeholder="E-mail" value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className="border p-3 text-xs rounded-lg outline-none focus:border-black" required />
          <input type="password" placeholder="Senha" value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className="border p-3 text-xs rounded-lg outline-none focus:border-black" required />
          <button type="submit" className="w-full bg-black text-white text-xs font-bold uppercase py-3.5 rounded-lg hover:bg-zinc-800 cursor-pointer">Entrar no Painel</button>
        </form>
      </div>
    );
  }

  const pendentesSeparar = pedidos.filter(p => p.status === 'Pendente / A Separar').length;
  const pedidosSeparados = pedidos.filter(p => p.status === 'Separado').length;
  const totalFaturado = pedidos.reduce((acc, curr) => acc + Number(curr.total || 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Cabeçalho */}
        <div className="p-6 border-b border-gray-200 bg-black text-white flex flex-col lg:flex-row justify-between lg:items-center gap-4">
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest">Painel de Controle — Vascarin Beauty</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">Gestão de Pedidos, Estoque e Relacionamento</p>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            <button onClick={() => setActiveTab('pedidos')} className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${activeTab === 'pedidos' ? 'bg-white text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}>📦 Pedidos ({pedidos.length})</button>
            <button onClick={() => setActiveTab('abandonados')} className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${activeTab === 'abandonados' ? 'bg-white text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}>🛒 Abandonados ({abandonados.length})</button>
            <button onClick={() => setActiveTab('favoritos')} className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${activeTab === 'favoritos' ? 'bg-white text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}>💖 Favoritos ({favoritos.length})</button>
            <button onClick={() => setActiveTab('clientes')} className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${activeTab === 'clientes' ? 'bg-white text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}>👥 Clientes ({clientes.length})</button>
            <button onClick={() => setActiveTab('historico')} className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${activeTab === 'historico' ? 'bg-white text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}>🕒 Histórico</button>
            <button onClick={() => setActiveTab('novo')} className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${activeTab === 'novo' ? 'bg-white text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}>+ Venda Manual</button>
            <button onClick={handleLogout} className="px-4 py-2 text-xs font-bold uppercase rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors ml-auto">Sair</button>
          </div>
        </div>

        {/* Dashboard de Métricas Rápidas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-gray-50 border-b border-gray-200">
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">A Separar</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{pendentesSeparar}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Separados / Prontos</span>
            <div className="text-2xl font-black text-blue-600 mt-1">{pedidosSeparados}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Visitantes na Loja</span>
            <div className="text-2xl font-black text-black mt-1">{clientes.length}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-green-600">Faturamento Total</span>
            <div className="text-2xl font-black text-green-600 mt-1">R$ {totalFaturado.toFixed(2)}</div>
          </div>
        </div>

        {/* Conteúdo das Abas */}
        <div className="p-6 md:p-8">
          
          {/* 1. ABA DE PEDIDOS */}
          {activeTab === 'pedidos' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-sm font-black uppercase text-black">Separação de Pedidos e Vendas</h2>
                  <p className="text-xs text-gray-400">Controle o status de separação dos produtos vendidos.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={carregarTudo} className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold uppercase rounded-lg hover:bg-gray-200 transition-colors">🔄 Atualizar</button>
                  <button onClick={handleExportCSV} className="px-4 py-2 bg-green-600 text-white text-xs font-bold uppercase rounded-lg hover:bg-green-700 transition-colors">📊 Exportar Excel</button>
                  <label className="px-4 py-2 bg-blue-600 text-white text-xs font-bold uppercase rounded-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center justify-center">
                    📥 Importar CSV
                    <input type="file" accept=".csv" onChange={importarPedidos} className="hidden" />
                  </label>
                </div>
              </div>

              {pedidos.length === 0 ? <p className="text-xs text-gray-400 py-8 text-center">Nenhum pedido registrado até o momento.</p> : (
                <div className="flex flex-col gap-4">
                  {pedidos.map((p, i) => (
                    <div key={i} className="border border-gray-200 rounded-xl p-5 flex flex-col lg:flex-row justify-between lg:items-center gap-4 hover:border-black transition-all">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <strong className="text-sm text-black">{p.id}</strong>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            p.status === 'Pendente / A Separar' ? 'bg-amber-100 text-amber-800' :
                            p.status === 'Separado' ? 'bg-blue-100 text-blue-800' : 
                            p.status === 'Cancelado' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {p.status}
                          </span>
                          <span className="text-[10px] text-gray-400 uppercase font-bold">({p.tipo})</span>
                        </div>
                        <p className="text-xs text-gray-800 font-semibold">{p.nome} — <span className="text-gray-500">{p.telefone}</span></p>
                        <p className="text-xs text-gray-600 mt-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100 font-mono">📦 {p.items}</p>
                        <p className="text-xs font-black text-black mt-2">Total: R$ {Number(p.total).toFixed(2)} ({p.forma_pagamento})</p>
                      </div>

                      <div className="flex flex-wrap lg:flex-col gap-2 items-end justify-center min-w-[200px]">
                        
                        <a href={`https://wa.me/55${p.telefone}?text=${encodeURIComponent(getWhatsAppMessage(p))}`} target="_blank" className="w-full text-center px-4 py-2 bg-green-600 text-white text-xs font-bold uppercase rounded-lg hover:bg-green-700 transition-colors">
                          WhatsApp
                        </a>
                        
                        {p.status === 'Pendente / A Separar' && (
                          <button onClick={() => handleUpdateStatus(p, 'Separado')} className="w-full px-4 py-2 bg-blue-600 text-white text-xs font-bold uppercase rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                            ✔ Marcar como Separado
                          </button>
                        )}

                        {p.status === 'Separado' && (
                          <>
                            <button onClick={() => handleUpdateStatus(p, 'Entregue / Concluído')} className="w-full px-4 py-2 bg-black text-white text-xs font-bold uppercase rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer">
                              🚀 Marcar como Entregue
                            </button>
                            <button onClick={() => handleUpdateStatus(p, 'Pendente / A Separar', true)} className="w-full px-4 py-2 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded-lg hover:bg-gray-200 transition-colors cursor-pointer border border-gray-200">
                              ⏪ Desfazer Separação
                            </button>
                          </>
                        )}

                        {p.status === 'Entregue / Concluído' && (
                          <button onClick={() => handleUpdateStatus(p, 'Separado', true)} className="w-full px-4 py-2 bg-gray-100 text-gray-600 text-[10px] font-bold uppercase rounded-lg hover:bg-gray-200 transition-colors cursor-pointer border border-gray-200">
                            ⏪ Desfazer Entrega
                          </button>
                        )}
                        
                        <div className="w-full flex gap-2">
                          <button onClick={() => handleUpdateStatus(p, p.status === 'Cancelado' ? 'Pendente / A Separar' : 'Cancelado', true)} className="flex-1 px-2 py-2 bg-orange-100 text-orange-700 text-[10px] font-bold uppercase rounded-lg hover:bg-orange-200 transition-colors cursor-pointer text-center">
                            {p.status === 'Cancelado' ? 'Restaurar' : 'Cancelar'}
                          </button>
                          <button onClick={async () => {
                            if(confirm("Tem certeza que deseja excluir este pedido permanentemente?")) {
                              const { error } = await supabase.from('pedidos').delete().eq('id', p.id);
                              if(!error) carregarTudo();
                            }
                          }} className="flex-1 px-2 py-2 bg-red-100 text-red-700 text-[10px] font-bold uppercase rounded-lg hover:bg-red-200 transition-colors cursor-pointer text-center">
                            Excluir
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 2. ABA DE CARRINHOS ABANDONADOS */}
          {activeTab === 'abandonados' && (
            <div>
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-sm font-black uppercase text-black">Carrinhos Abandonados (Leads)</h2>
                  <p className="text-xs text-gray-400">Pessoas que colocaram perfumes na sacola e não finalizaram.</p>
                </div>
                <button onClick={carregarTudo} className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold uppercase rounded-lg hover:bg-gray-200">🔄 Atualizar</button>
              </div>

              {abandonados.length === 0 ? <p className="text-xs text-gray-400 py-8 text-center">Nenhum carrinho abandonado recentemente.</p> : (
                <div className="flex flex-col gap-4">
                  {abandonados.map((a, i) => (
                    <div key={i} className="border border-amber-200 bg-amber-50/50 rounded-xl p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div>
                        <strong className="text-sm text-black">{a.nome}</strong> ({a.telefone})<br/>
                        <span className="text-xs text-gray-700 font-medium mt-1 block">🛍️ Produtos: {a.itens_summary}</span>
                        <span className="text-[10px] font-bold uppercase text-amber-700 mt-1 block">{a.status}</span>
                      </div>
                      <a href={`https://wa.me/55${a.telefone}?text=Olá ${a.nome}! Notamos que você deixou itens na sacola da Vascarin Beauty (${a.itens_summary}). Posso te ajudar a finalizar seu pedido?`} target="_blank" className="px-5 py-3 bg-black text-white text-xs font-bold uppercase rounded-lg hover:bg-zinc-800 transition-colors text-center">
                        Recuperar Venda
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 3. ABA DE FAVORITOS */}
          {activeTab === 'favoritos' && (
            <div>
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-sm font-black uppercase text-black">Produtos Mais Desejados (Favoritos)</h2>
                  <p className="text-xs text-gray-400">Descubra o perfume favorito de cada visitante da sua loja.</p>
                </div>
                <button onClick={carregarTudo} className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold uppercase rounded-lg hover:bg-gray-200">🔄 Atualizar</button>
              </div>

              {favoritos.length === 0 ? <p className="text-xs text-gray-400 py-8 text-center">Nenhum cliente favoritou produtos até o momento.</p> : (
                <div className="flex flex-col gap-4">
                  {favoritos.map((f, i) => (
                    <div key={i} className="border border-pink-200 bg-pink-50/50 rounded-xl p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div>
                        <strong className="text-sm text-black">{f.nome}</strong> ({f.telefone})<br/>
                        <span className="text-xs text-pink-700 font-bold mt-1 block">💖 Favoritou: {f.produtos}</span>
                      </div>
                      <a href={`https://wa.me/55${f.telefone}?text=Olá ${f.nome}! Vimos que você se interessou pelo ${f.produtos} na Vascarin Beauty. Gostaria de garantir o seu antes que esgote?`} target="_blank" className="px-5 py-3 bg-pink-600 text-white text-xs font-bold uppercase rounded-lg hover:bg-pink-700 transition-colors text-center">
                        Oferecer no WhatsApp
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 4. ABA DE CLIENTES (ACESSOS AO SITE) */}
          {activeTab === 'clientes' && (
            <div>
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-sm font-black uppercase text-black">Visitantes Cadastrados (Acessos)</h2>
                  <p className="text-xs text-gray-400">Todos os clientes que entraram na loja pelo modal inicial.</p>
                </div>
                <button onClick={carregarTudo} className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold uppercase rounded-lg hover:bg-gray-200">🔄 Atualizar</button>
              </div>

              {clientes.length === 0 ? <p className="text-xs text-gray-400 py-8 text-center">Nenhum cliente registrado.</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {clientes.map((c, i) => (
                    <div key={i} className="border border-gray-200 p-5 rounded-xl flex justify-between items-center">
                      <div>
                        <strong className="text-sm text-black block">{c.nome}</strong>
                        <span className="text-xs text-gray-500">{c.telefone}</span>
                        <span className="mt-2 inline-block bg-gray-100 text-gray-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          {c.visitas || 1} Visitas
                        </span>
                      </div>
                      <a href={`https://wa.me/55${c.telefone}?text=Olá ${c.nome}! Como posso te ajudar na Vascarin Beauty hoje?`} target="_blank" className="px-3 py-2 bg-black text-white text-xs font-bold rounded-lg hover:bg-zinc-800">
                        Conversar
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 5. ABA DE HISTÓRICO DE ENTRADAS COM DATA/HORA */}
          {activeTab === 'historico' && (
            <div>
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-sm font-black uppercase text-black">Histórico de Acessos</h2>
                  <p className="text-xs text-gray-400">Acompanhe quem entrou na sua loja e o horário exato.</p>
                </div>
                <button onClick={carregarTudo} className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold uppercase rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">🔄 Atualizar</button>
              </div>

              {historico.length === 0 ? <p className="text-xs text-gray-400 py-8 text-center">Nenhum histórico registrado.</p> : (
                <div className="flex flex-col gap-4">
                  {historico.map((h, i) => (
                    <div key={i} className="border border-gray-200 p-5 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-gray-50">
                      <div>
                        <strong className="text-sm text-black block">{h.nome}</strong>
                        <span className="text-xs text-gray-500">{h.telefone}</span>
                      </div>
                      <span className="text-xs font-mono bg-white border border-gray-200 px-4 py-2 rounded-lg text-gray-600 font-bold">
                        {new Date(h.acessado_em).toLocaleDateString('pt-BR')} às {new Date(h.acessado_em).toLocaleTimeString('pt-BR')}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 6. ABA DE NOVO PEDIDO MANUAL */}
          {activeTab === 'novo' && (
            <div className="max-w-4xl">
              <h2 className="text-sm font-black uppercase text-black mb-1">Lançamento de Venda Manual</h2>
              <p className="text-xs text-gray-400 mb-6">Cadastre vendas feitas no WhatsApp ou pessoalmente.</p>

              <form onSubmit={handleSaveManualOrder} className="flex flex-col lg:flex-row gap-8">
                <div className="flex-1 flex flex-col gap-5">
                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                    <h3 className="text-xs font-bold uppercase text-gray-700 mb-3">1. Dados do Cliente</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input type="text" placeholder="Nome Completo" value={manualName} onChange={e => setManualName(e.target.value)} className="border border-gray-300 p-3 text-xs rounded-lg bg-white outline-none focus:border-black" required />
                      <input type="text" placeholder="WhatsApp" value={manualPhone} onChange={e => setManualPhone(e.target.value)} className="border border-gray-300 p-3 text-xs rounded-lg bg-white outline-none focus:border-black" required />
                    </div>
                  </div>

                  <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                    <h3 className="text-xs font-bold uppercase text-gray-700 mb-3">2. Selecionar Perfumes</h3>
                    <div className="flex gap-2">
                      <select value={selectedProduct} onChange={e => setSelectedProduct(e.target.value)} className="flex-1 border border-gray-300 p-3 text-xs rounded-lg bg-white outline-none focus:border-black">
                        <option value="">Selecione um perfume...</option>
                        {storeProducts.map((p: any) => <option key={p.id} value={p.nome}>{p.nome} — R$ {p.preco.toFixed(2)}</option>)}
                      </select>
                      <input type="number" min="1" value={selectedQty} onChange={e => setSelectedQty(Number(e.target.value))} className="w-16 border border-gray-300 p-3 text-xs rounded-lg text-center bg-white outline-none" />
                      <button type="button" onClick={handleAddItemToOrder} className="bg-black text-white text-xs font-bold px-5 rounded-lg hover:bg-zinc-800 cursor-pointer">Incluir</button>
                    </div>
                  </div>
                </div>

                <div className="w-full lg:w-80 bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col gap-4">
                  <h3 className="text-xs font-bold uppercase text-gray-700">Resumo da Venda</h3>
                  <textarea value={manualItems} onChange={e => setManualItems(e.target.value)} placeholder="Os itens aparecerão aqui..." className="border border-gray-300 p-3 text-xs rounded-lg bg-gray-50 min-h-[120px] outline-none" required />
                  <div>
                    <label className="text-[10px] font-bold uppercase text-gray-500 block mb-1">Total da Venda (R$)</label>
                    <input type="number" step="0.01" value={manualTotal} onChange={e => setManualTotal(e.target.value)} placeholder="0.00" className="w-full border border-green-300 bg-green-50 text-green-700 p-3 text-lg font-black rounded-lg text-center outline-none" required />
                  </div>
                  <button type="submit" className="w-full bg-green-600 text-white text-xs font-bold uppercase py-4 rounded-lg hover:bg-green-700 transition-colors cursor-pointer shadow-md">
                    Salvar Pedido Manual
                  </button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}