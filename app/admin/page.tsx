"use client";

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminDashboard() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const [activeTab, setActiveTab] = useState<'pedidos' | 'abandonados' | 'favoritos' | 'clientes' | 'historico' | 'novo' | 'mensagens' | 'estoque' | 'espera' | 'buscas'>('pedidos');
  const [searchQuery, setSearchQuery] = useState('');
  const [estoqueSubTab, setEstoqueSubTab] = useState<'atual' | 'log'>('atual');

  const [pedidos, setPedidos] = useState<any[]>([]);
  const [abandonados, setAbandonados] = useState<any[]>([]);
  const [favoritos, setFavoritos] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);
  const [espera, setEspera] = useState<any[]>([]); 
  const [buscas, setBuscas] = useState<any[]>([]); 
  const [storeProducts, setStoreProducts] = useState<any[]>([]);
  const [estoqueLogs, setEstoqueLogs] = useState<any[]>([]);

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

    const { data: hist } = await supabase.from('historico_acessos').select('*').order('acessado_em', { ascending: false });
    if (hist) setHistorico(hist);

    const { data: esp } = await supabase.from('fila_espera').select('*').order('created_at', { ascending: false });
    if (esp) setEspera(esp);

    const { data: bsc } = await supabase.from('buscas_site').select('*').order('created_at', { ascending: false });
    if (bsc) setBuscas(bsc);

    try {
      const res = await fetch(`/api/produtos?nocache=${Date.now()}`, { cache: 'no-store' });
      if (res.ok) {
        const produtosNovos = await res.json();
        setStoreProducts(produtosNovos);

        const ultimoEstadoSalvo = localStorage.getItem('vascarin_last_estoque_state');
        const estadoAtualMap: Record<string, boolean> = {};
        
        produtosNovos.forEach((p: any) => {
          if (!p.nome) return;
          const nomeExato = p.nome;
          const temEstoque = Number(p.estoque ?? p.quantidade ?? 0) > 0;
          
          if (estadoAtualMap[nomeExato] !== true) {
            estadoAtualMap[nomeExato] = temEstoque;
          }
        });

        if (ultimoEstadoSalvo) {
          const estadoAnteriorMap = JSON.parse(ultimoEstadoSalvo);
          const logsAtuais = JSON.parse(localStorage.getItem('vascarin_estoque_logs') || '[]');
          let houveMudanca = false;

          Object.keys(estadoAtualMap).forEach((nomeExato) => {
            const disponivelAgora = estadoAtualMap[nomeExato];
            const estavaDisponivelAntes = estadoAnteriorMap[nomeExato];

            if (estavaDisponivelAntes !== undefined && estavaDisponivelAntes !== disponivelAgora) {
              
              const jaTemLogRecente = logsAtuais.slice(0, 3).some((log: any) => 
                log.produto === nomeExato && log.tipo === (disponivelAgora ? 'Chegou' : 'Esgotou')
              );
              
              if (!jaTemLogRecente) {
                const novoLog = {
                  produto: nomeExato,
                  tipo: disponivelAgora ? 'Chegou' : 'Esgotou',
                  data: new Date().toLocaleString('pt-BR')
                };
                logsAtuais.unshift(novoLog);
                houveMudanca = true;
              }
            }
          });

          if (houveMudanca) {
            const logsLimitados = logsAtuais.slice(0, 50);
            setEstoqueLogs(logsLimitados);
            localStorage.setItem('vascarin_estoque_logs', JSON.stringify(logsLimitados));
          } else {
            setEstoqueLogs(logsAtuais);
          }
        } else {
          setEstoqueLogs(JSON.parse(localStorage.getItem('vascarin_estoque_logs') || '[]'));
        }

        localStorage.setItem('vascarin_last_estoque_state', JSON.stringify(estadoAtualMap));
      }
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
    } else if (pedido.status === 'Problema de Estoque') {
      return `Olá ${pedido.nome}, tudo bem? Aqui é da Vascarin Beauty. Infelizmente, no momento da separação do seu pedido #${pedido.id}, notamos que um dos itens esgotou no nosso fornecedor e não temos em estoque.\n\nComo você prefere seguir? Podemos trocar por outro perfume ou fazer o estorno para você! Pedimos mil desculpas pelo transtorno. 😔`;
    } else if (pedido.status === 'Aguardando Pagamento') {
      return `Olá ${pedido.nome}! Tudo bem? Aqui é da Vascarin Beauty.\n\nRecebemos o seu pedido #${pedido.id}, mas notamos que o pagamento ainda não foi concluído no sistema.\n\nPrecisa de alguma ajuda com o link ou com a chave PIX? Estou aqui para te ajudar a garantir os seus produtos antes que esgotem! 💖`;
    }
    return `Olá ${pedido.nome}! Informamos sobre o seu pedido #${pedido.id} na Vascarin Beauty.`;
  };

  const temItemEsgotado = (itemsString: string) => {
    if (!storeProducts || storeProducts.length === 0) return false;
    return storeProducts.some((p: any) => {
      const qtd = Number(p.estoque ?? p.quantidade ?? 0);
      if (qtd <= 0) {
        return itemsString.toLowerCase().includes(String(p.nome).toLowerCase());
      }
      return false;
    });
  };

  const handleUpdateStatus = async (pedido: any, newStatus: string, isSilent: boolean = false) => {
    const { error } = await supabase.from('pedidos').update({ status: newStatus }).eq('id', pedido.id);
    if (!error) {
      setPedidos(pedidos.map(p => p.id === pedido.id ? { ...p, status: newStatus } : p));
      if (!isSilent) {
        if (newStatus === 'Separado' || newStatus === 'Entregue / Concluído' || newStatus === 'Problema de Estoque' || newStatus === 'Aguardando Pagamento') {
          const msg = getWhatsAppMessage({ ...pedido, status: newStatus });
          window.open(`https://wa.me/55${pedido.telefone}?text=${encodeURIComponent(msg)}`, '_blank');
        }
      }
    } else {
      alert("Erro ao atualizar status: " + error.message);
    }
  };

  const handleUpdateContato = async (tabela: string, telefone: string, novoStatus: string) => {
    const { error } = await supabase.from(tabela).update({ status_contato: novoStatus }).eq('telefone', telefone);
    if (!error) carregarTudo();
  };

  // EXCLUIR REGISTROS
  const handleDeleteBusca = async (id: string | number) => {
    if (confirm("Tem certeza que deseja excluir esta pesquisa do painel?")) {
      const { error } = await supabase.from('buscas_site').delete().eq('id', id);
      if (!error) carregarTudo();
    }
  };

  const handleDeleteCliente = async (telefone: string) => {
    if (confirm("Tem certeza que deseja excluir este cliente cadastrado?")) {
      const { error } = await supabase.from('clientes').delete().eq('telefone', telefone);
      if (!error) carregarTudo();
      else alert("Erro ao excluir: " + error.message);
    }
  };

  const handleDeleteHistorico = async (id: any) => {
    if (confirm("Tem certeza que deseja excluir este acesso do histórico?")) {
      const { error } = await supabase.from('historico_acessos').delete().eq('id', id);
      if (!error) carregarTudo();
      else alert("Erro ao excluir: " + error.message);
    }
  };

  const handleSaveManualOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const orderId = `VASC-MANUAL-${Date.now().toString().slice(-4)}`;
    const { error } = await supabase.from('pedidos').insert([{
      id: orderId, nome: manualName, telefone: manualPhone.replace(/\D/g, ''),
      items: manualItems, total: Number(manualTotal), forma_pagamento: 'Venda Manual / Externa',
      status: 'Separado', tipo: 'Manual'
    }]);

    if (!error) {
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

  const exportToCSV = (filename: string, rows: string[][]) => {
    const csv = "data:text/csv;charset=utf-8,\uFEFF" + rows.map(e => e.join(';')).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csv);
    link.download = `${filename}_Vascarin_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.csv`;
    link.click();
  };

  const handleExportPedidos = () => {
    if (pedidos.length === 0) return alert("Nenhum pedido para exportar.");
    const headers = ['ID', 'Nome', 'Telefone', 'Itens', 'Total (R$)', 'Status', 'Origem', 'Data'];
    const data = pedidos.map(p => [p.id, p.nome, p.telefone, `"${p.items}"`, p.total, p.status, p.tipo, new Date(p.created_at).toLocaleDateString('pt-BR')]);
    exportToCSV('Pedidos', [headers, ...data]);
  };

  const handleExportAbandonados = () => {
    if (abandonados.length === 0) return alert("Nenhum carrinho abandonado para exportar.");
    const headers = ['Nome', 'Telefone', 'Itens', 'Status da Sacola', 'Status de Contato', 'Data da Atualização'];
    const data = abandonados.map(itemAban => [itemAban.nome, itemAban.telefone, `"${itemAban.itens_summary}"`, itemAban.status, itemAban.status_contato || 'Pendente', new Date(itemAban.updated_at).toLocaleDateString('pt-BR')]);
    exportToCSV('Leads_Abandonados', [headers, ...data]);
  };

  const handleExportFavoritos = () => {
    if (favoritos.length === 0) return alert("Nenhum favorito para exportar.");
    const headers = ['Nome', 'Telefone', 'Produtos', 'Status de Contato', 'Data da Atualização'];
    const data = favoritos.map(f => [f.nome, f.telefone, `"${f.produtos}"`, f.status_contato || 'Pendente', new Date(f.updated_at).toLocaleDateString('pt-BR')]);
    exportToCSV('Favoritos', [headers, ...data]);
  };

  const handleExportClientes = () => {
    if (clientes.length === 0) return alert("Nenhum cliente para exportar.");
    const headers = ['Nome', 'Telefone', 'Qtd. Visitas', 'Status de Contato', 'Última Visita'];
    const data = clientes.map(c => [c.nome, c.telefone, c.visitas, c.status_contato || 'Pendente', new Date(c.updated_at).toLocaleDateString('pt-BR')]);
    exportToCSV('Clientes', [headers, ...data]);
  };

  const handleExportHistorico = () => {
    if (historico.length === 0) return alert("Nenhum histórico para exportar.");
    const headers = ['Nome', 'Telefone', 'Data do Acesso', 'Hora do Acesso'];
    const data = historico.map(h => [h.nome, h.telefone, new Date(h.acessado_em).toLocaleDateString('pt-BR'), new Date(h.acessado_em).toLocaleTimeString('pt-BR')]);
    exportToCSV('Historico_Acessos', [headers, ...data]);
  };

  const handleExportEspera = () => {
    if (espera.length === 0) return alert("Nenhuma fila de espera para exportar.");
    const headers = ['Nome', 'Telefone', 'Produto', 'Status', 'Data'];
    const data = espera.map(e => [e.nome, e.telefone, `"${e.produto}"`, e.status_contato || 'Pendente', new Date(e.created_at).toLocaleDateString('pt-BR')]);
    exportToCSV('Fila_de_Espera', [headers, ...data]);
  };

  const handleExportBuscas = () => {
    if (buscas.length === 0) return alert("Nenhuma busca para exportar.");
    const headers = ['Termo Pesquisado', 'Nome', 'Telefone', 'Encontrou Resultados?', 'Data', 'Hora'];
    const data = buscas.map(b => [b.termo, b.nome || 'Anônimo', b.telefone || '-', b.resultados > 0 ? 'Sim' : 'Não', new Date(b.created_at).toLocaleDateString('pt-BR'), new Date(b.created_at).toLocaleTimeString('pt-BR')]);
    exportToCSV('Termos_Pesquisados', [headers, ...data]);
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
            id, nome, telefone, items: items.replace(/"/g, ''), 
            total: Number(total), status: status || 'Separado', tipo: 'Importado' 
          }]);
        }
      }
      alert("Pedidos antigos importados com sucesso!");
      carregarTudo();
    };
    reader.readAsText(file);
  };

  const filterList = (list: any[], fields: string[]) => {
    if (!searchQuery) return list;
    const lowerQuery = searchQuery.toLowerCase();
    return list.filter(item => 
      fields.some(field => String(item[field] || '').toLowerCase().includes(lowerQuery))
    );
  };

  const filteredPedidos = filterList(pedidos, ['nome', 'telefone', 'id', 'items', 'status']);
  const filteredAbandonados = filterList(abandonados, ['nome', 'telefone', 'itens_summary']);
  const filteredFavoritos = filterList(favoritos, ['nome', 'telefone', 'produtos']);
  const filteredClientes = filterList(clientes, ['nome', 'telefone']);
  const filteredHistorico = filterList(historico, ['nome', 'telefone']);
  const filteredEspera = filterList(espera, ['nome', 'telefone', 'produto']); 
  const filteredBuscas = filterList(buscas, ['termo', 'nome', 'telefone']); 

  const produtosDisponiveis = storeProducts.filter(p => Number(p.estoque ?? p.quantidade ?? 0) > 0);
  const produtosEsgotados = storeProducts.filter(p => Number(p.estoque ?? p.quantidade ?? 0) <= 0);
  const filteredEstoque = filterList(storeProducts, ['nome', 'categoria']);

  const switchTab = (tab: any) => {
    setActiveTab(tab);
    setSearchQuery('');
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
  const visitantesAnonimos = historico.filter(h => h.nome === 'Visitante Anônimo').length;

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        
        <div className="p-6 border-b border-gray-200 bg-black text-white flex flex-col lg:flex-row justify-between lg:items-center gap-4">
          <div>
            <h1 className="text-sm font-black uppercase tracking-widest">Painel de Controle — Vascarin Beauty</h1>
            <p className="text-[10px] text-gray-400 mt-0.5">Gestão de Pedidos, Estoque e Relacionamento</p>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            <button onClick={() => switchTab('pedidos')} className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${activeTab === 'pedidos' ? 'bg-white text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}>📦 Pedidos ({pedidos.length})</button>
            <button onClick={() => switchTab('abandonados')} className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${activeTab === 'abandonados' ? 'bg-white text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}>🛒 Abandonados ({abandonados.length})</button>
            <button onClick={() => switchTab('favoritos')} className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${activeTab === 'favoritos' ? 'bg-white text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}>💖 Favoritos ({favoritos.length})</button>
            <button onClick={() => switchTab('clientes')} className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${activeTab === 'clientes' ? 'bg-white text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}>👥 Clientes ({clientes.length})</button>
            <button onClick={() => switchTab('espera')} className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${activeTab === 'espera' ? 'bg-white text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}>⏳ Fila ({espera.length})</button>
            <button onClick={() => switchTab('buscas')} className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${activeTab === 'buscas' ? 'bg-white text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}>🔍 Buscas</button>
            <button onClick={() => switchTab('historico')} className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${activeTab === 'historico' ? 'bg-white text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}>🕒 Histórico</button>
            <button onClick={() => switchTab('estoque')} className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${activeTab === 'estoque' ? 'bg-white text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}>📋 Estoque</button>
            <button onClick={() => switchTab('novo')} className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${activeTab === 'novo' ? 'bg-white text-black' : 'bg-zinc-800 text-white hover:bg-zinc-700'}`}>+ Venda Manual</button>
            <button onClick={() => switchTab('mensagens')} className={`px-4 py-2 text-xs font-bold uppercase rounded-lg transition-colors ${activeTab === 'mensagens' ? 'bg-white text-black' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>💬 Scripts</button>
            <button onClick={handleLogout} className="px-4 py-2 text-xs font-bold uppercase rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors cursor-pointer">Sair</button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 bg-gray-50 border-b border-gray-200">
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">A Separar</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{pendentesSeparar}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Separados / Prontos</span>
            <div className="text-2xl font-black text-blue-600 mt-1">{pedidosSeparados}</div>
          </div>
          
          {/* CARD ATUALIZADO: Cadastros e Anônimos */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 flex flex-col justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Acessos (Cadastros / Anônimos)</span>
            <div className="text-2xl font-black text-black mt-1">
              {clientes.length} <span className="text-base text-gray-400 font-medium">/ {visitantesAnonimos}</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <span className="text-[10px] font-bold uppercase tracking-wider text-green-600">Faturamento Total</span>
            <div className="text-2xl font-black text-green-600 mt-1">R$ {totalFaturado.toFixed(2)}</div>
          </div>
        </div>

        <div className="p-6 md:p-8">
          
          {activeTab === 'pedidos' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-sm font-black uppercase text-black">Separação de Pedidos e Vendas</h2>
                  <p className="text-xs text-gray-400">Controle o status de separação dos produtos vendidos.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={carregarTudo} className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold uppercase rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">🔄 Atualizar</button>
                  <button onClick={handleExportPedidos} className="px-4 py-2 bg-green-600 text-white text-xs font-bold uppercase rounded-lg hover:bg-green-700 transition-colors cursor-pointer">📊 Exportar Excel</button>
                  <label className="px-4 py-2 bg-blue-600 text-white text-xs font-bold uppercase rounded-lg hover:bg-blue-700 transition-colors cursor-pointer flex items-center justify-center">
                    📥 Importar CSV
                    <input type="file" accept=".csv" onChange={importarPedidos} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="mb-6">
                <input type="text" placeholder="🔍 Pesquisar por nome, WhatsApp ou ID do pedido..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full border border-gray-300 p-3 text-xs rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-black transition-colors" />
              </div>

              {filteredPedidos.length === 0 ? <p className="text-xs text-gray-400 py-8 text-center">Nenhum pedido encontrado com essa pesquisa.</p> : (
                <div className="flex flex-col gap-4">
                  {filteredPedidos.map((p, i) => {
                    const esgotado = temItemEsgotado(p.items);

                    return (
                      <div key={i} className="border border-gray-200 rounded-xl p-5 flex flex-col lg:flex-row justify-between lg:items-center gap-4 hover:border-black transition-all">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <strong className="text-sm text-black">{p.id}</strong>
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              p.status === 'Pendente / A Separar' ? 'bg-amber-100 text-amber-800' : 
                              p.status === 'Aguardando Pagamento' ? 'bg-purple-100 text-purple-800' :
                              p.status === 'Separado' ? 'bg-blue-100 text-blue-800' : 
                              p.status === 'Problema de Estoque' ? 'bg-red-100 text-red-800' : 
                              p.status === 'Cancelado' ? 'bg-gray-200 text-gray-800' : 
                              'bg-green-100 text-green-800'
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
                          
                          {(p.status === 'Pendente / A Separar' || p.status === 'Aguardando Pagamento') && (
                            <>
                              <button onClick={() => handleUpdateStatus(p, 'Separado')} className="w-full px-4 py-2 bg-blue-600 text-white text-xs font-bold uppercase rounded-lg hover:bg-blue-700 transition-colors cursor-pointer">
                                ✔ Marcar como Separado
                              </button>

                              {p.status === 'Pendente / A Separar' && (
                                <button onClick={() => handleUpdateStatus(p, 'Aguardando Pagamento')} className="w-full px-4 py-2 bg-purple-600 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-purple-700 transition-colors cursor-pointer text-center">
                                  💸 Cobrar Pagamento
                                </button>
                              )}
                              
                              {esgotado && (
                                <button onClick={() => handleUpdateStatus(p, 'Problema de Estoque')} className="w-full px-4 py-2 bg-red-600 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-red-700 transition-colors cursor-pointer text-center">
                                  ⚠️ Avisar Falta de Estoque
                                </button>
                              )}
                            </>
                          )}
                          
                          {(p.status === 'Separado' || p.status === 'Problema de Estoque' || p.status === 'Aguardando Pagamento') && (
                            <>
                              {p.status !== 'Problema de Estoque' && p.status !== 'Aguardando Pagamento' && (
                                <button onClick={() => handleUpdateStatus(p, 'Entregue / Concluído')} className="w-full px-4 py-2 bg-black text-white text-xs font-bold uppercase rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer">
                                  🚀 Marcar como Entregue
                                </button>
                              )}
                              <button onClick={() => handleUpdateStatus(p, 'Pendente / A Separar', true)} className="w-full px-4 py-2 bg-gray-200 text-gray-700 text-[10px] font-bold uppercase rounded-lg hover:bg-gray-300 transition-colors cursor-pointer text-center">
                                ↩ Desfazer Status
                              </button>
                            </>
                          )}

                          {p.status === 'Entregue / Concluído' && (
                            <button onClick={() => handleUpdateStatus(p, 'Separado', true)} className="w-full px-4 py-2 bg-gray-200 text-gray-700 text-[10px] font-bold uppercase rounded-lg hover:bg-gray-300 transition-colors cursor-pointer text-center">
                              ↩ Desfazer Entrega
                            </button>
                          )}
                          
                          <div className="w-full flex gap-2 mt-1">
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
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'abandonados' && (
            <div>
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-sm font-black uppercase text-black">Carrinhos Abandonados (Leads)</h2>
                  <p className="text-xs text-gray-400">Pessoas que colocaram perfumes na sacola e não finalizaram.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={carregarTudo} className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold uppercase rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">🔄 Atualizar</button>
                  <button onClick={handleExportAbandonados} className="px-4 py-2 bg-green-600 text-white text-xs font-bold uppercase rounded-lg hover:bg-green-700 transition-colors cursor-pointer">📊 Exportar</button>
                </div>
              </div>

              <div className="mb-6">
                <input type="text" placeholder="🔍 Pesquisar cliente, telefone ou produto da sacola..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full border border-gray-300 p-3 text-xs rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-black transition-colors" />
              </div>

              {filteredAbandonados.length === 0 ? <p className="text-xs text-gray-400 py-8 text-center">Nenhum carrinho encontrado com essa pesquisa.</p> : (
                <div className="flex flex-col gap-4">
                  {filteredAbandonados.map((itemAban, i) => (
                    <div key={i} className="border border-amber-200 bg-amber-50/50 rounded-xl p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div>
                        <strong className="text-sm text-black">{itemAban.nome}</strong> ({itemAban.telefone})<br/>
                        <span className="text-xs text-gray-700 font-medium mt-1 block">🛍️ Produtos: {itemAban.itens_summary}</span>
                        <span className="text-[10px] font-bold uppercase text-amber-700 mt-1 block">{itemAban.status}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <a href={`https://wa.me/55${itemAban.telefone}?text=Olá ${itemAban.nome}! Notamos que você deixou itens na sacola da Vascarin Beauty (${itemAban.itens_summary}). Posso te ajudar a finalizar seu pedido?`} target="_blank" className="px-5 py-3 bg-black text-white text-[10px] font-bold uppercase rounded-lg hover:bg-zinc-800 transition-colors text-center flex items-center justify-center">
                          📱 Chamar
                        </a>
                        <button onClick={() => handleUpdateContato('carrinhos_abandonados', itemAban.telefone, itemAban.status_contato === 'Enviado' ? 'Pendente' : 'Enviado')} className={`px-5 py-3 text-[10px] font-bold uppercase rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center border ${itemAban.status_contato === 'Enviado' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                          {itemAban.status_contato === 'Enviado' ? '✔ Contatado' : 'Marcar Contato'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'favoritos' && (
            <div>
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-sm font-black uppercase text-black">Produtos Mais Desejados (Favoritos)</h2>
                  <p className="text-xs text-gray-400">Descubra o perfume favorito de cada visitante da sua loja.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={carregarTudo} className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold uppercase rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">🔄 Atualizar</button>
                  <button onClick={handleExportFavoritos} className="px-4 py-2 bg-green-600 text-white text-xs font-bold uppercase rounded-lg hover:bg-green-700 transition-colors cursor-pointer">📊 Exportar</button>
                </div>
              </div>

              <div className="mb-6">
                <input type="text" placeholder="🔍 Pesquisar por cliente ou nome do perfume..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full border border-gray-300 p-3 text-xs rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-black transition-colors" />
              </div>

              {filteredFavoritos.length === 0 ? <p className="text-xs text-gray-400 py-8 text-center">Nenhum favorito encontrado com essa pesquisa.</p> : (
                <div className="flex flex-col gap-4">
                  {filteredFavoritos.map((f, i) => (
                    <div key={i} className="border border-pink-200 bg-pink-50/50 rounded-xl p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div>
                        <strong className="text-sm text-black">{f.nome}</strong> ({f.telefone})<br/>
                        <span className="text-xs text-pink-700 font-bold mt-1 block">💖 Favoritou: {f.produtos}</span>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <a href={`https://wa.me/55${f.telefone}?text=Olá ${f.nome}! Vimos que você se interessou pelo ${f.produtos} na Vascarin Beauty. Gostaria de garantir o seu antes que esgote?`} target="_blank" className="px-5 py-3 bg-pink-600 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-pink-700 transition-colors text-center flex items-center justify-center">
                          📱 Oferecer
                        </a>
                        <button onClick={() => handleUpdateContato('favoritos', f.telefone, f.status_contato === 'Enviado' ? 'Pendente' : 'Enviado')} className={`px-5 py-3 text-[10px] font-bold uppercase rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center border ${f.status_contato === 'Enviado' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                          {f.status_contato === 'Enviado' ? '✔ Oferecido' : 'Marcar Oferta'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'clientes' && (
            <div>
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-sm font-black uppercase text-black">Visitantes Cadastrados (Acessos)</h2>
                  <p className="text-xs text-gray-400">Todos os clientes que entraram na loja pelo modal inicial.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={carregarTudo} className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold uppercase rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">🔄 Atualizar</button>
                  <button onClick={handleExportClientes} className="px-4 py-2 bg-green-600 text-white text-xs font-bold uppercase rounded-lg hover:bg-green-700 transition-colors cursor-pointer">📊 Exportar</button>
                </div>
              </div>

              <div className="mb-6">
                <input type="text" placeholder="🔍 Pesquisar por nome ou telefone..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full border border-gray-300 p-3 text-xs rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-black transition-colors" />
              </div>

              {filteredClientes.length === 0 ? <p className="text-xs text-gray-400 py-8 text-center">Nenhum cliente encontrado com essa pesquisa.</p> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredClientes.map((c, i) => (
                    <div key={i} className="border border-gray-200 p-5 rounded-xl flex flex-col justify-between relative group hover:border-gray-300 transition-colors">
                      {/* BOTÃO EXCLUIR CLIENTE */}
                      <button 
                        onClick={() => handleDeleteCliente(c.telefone)} 
                        className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition-colors p-1"
                        title="Excluir Cliente"
                      >
                        ✕
                      </button>

                      <div className="mb-4 pr-6">
                        <strong className="text-sm text-black block">{c.nome}</strong>
                        <span className="text-xs text-gray-500">{c.telefone}</span>
                        <span className="mt-2 inline-block bg-gray-100 text-gray-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                          {c.visitas || 1} Visitas
                        </span>
                      </div>
                      <div className="flex gap-2 mt-auto">
                        <a href={`https://wa.me/55${c.telefone}?text=Olá ${c.nome}! Como posso te ajudar na Vascarin Beauty hoje?`} target="_blank" className="flex-1 px-3 py-2 bg-black text-white text-[10px] uppercase font-bold rounded-lg hover:bg-zinc-800 text-center flex items-center justify-center">
                          Conversar
                        </a>
                        <button onClick={() => handleUpdateContato('clientes', c.telefone, c.status_contato === 'Enviado' ? 'Pendente' : 'Enviado')} className={`flex-1 px-3 py-2 text-[10px] font-bold uppercase rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center border ${c.status_contato === 'Enviado' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                          {c.status_contato === 'Enviado' ? '✔ Falou' : 'Marcar'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'espera' && (
            <div>
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-sm font-black uppercase text-black">Fila de Espera (Avise-me)</h2>
                  <p className="text-xs text-gray-400">O sistema avisa automaticamente quando o perfume desejado voltar ao estoque da planilha.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={carregarTudo} className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold uppercase rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">🔄 Atualizar</button>
                  <button onClick={handleExportEspera} className="px-4 py-2 bg-green-600 text-white text-xs font-bold uppercase rounded-lg hover:bg-green-700 transition-colors cursor-pointer">📊 Exportar</button>
                </div>
              </div>

              <div className="mb-6">
                <input type="text" placeholder="🔍 Pesquisar por nome, WhatsApp ou produto..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full border border-gray-300 p-3 text-xs rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-black transition-colors" />
              </div>

              {filteredEspera.length === 0 ? <p className="text-xs text-gray-400 py-8 text-center">Não há clientes na fila de espera no momento.</p> : (
                <div className="flex flex-col gap-4">
                  {filteredEspera.map((e, i) => {
                    const normalizeName = (name: string) => {
                      return String(name || '')
                        .toLowerCase()
                        .normalize("NFD").replace(/[\u0300-\u036f]/g, "") 
                        .replace(/brand collection/g, "") 
                        .replace(/[^a-z0-9]/g, ""); 
                    };

                    const produtoNaLoja = storeProducts.find((p: any) => {
                      const nomeLoja = normalizeName(p.nome);
                      const nomeEspera = normalizeName(e.produto);
                      
                      if (!nomeLoja || !nomeEspera) return false;

                      if (nomeLoja === nomeEspera) return true;

                      if (nomeLoja.includes(nomeEspera) || nomeEspera.includes(nomeLoja)) {
                        const isKitLoja = String(p.nome).toLowerCase().includes('kit');
                        const isKitEspera = String(e.produto).toLowerCase().includes('kit');
                        return isKitLoja === isKitEspera;
                      }
                      
                      return false;
                    });

                    const estoqueAtual = produtoNaLoja ? Number(produtoNaLoja.estoque ?? produtoNaLoja.quantidade ?? 0) : 0;
                    const chegouNoEstoque = estoqueAtual > 0;

                    return (
                      <div key={i} className={`border rounded-xl p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${chegouNoEstoque ? 'border-green-400 bg-green-50/70 shadow-sm' : 'border-blue-200 bg-blue-50/50'}`}>
                        <div>
                          <strong className="text-sm text-black">{e.nome}</strong> ({e.telefone})<br/>
                          <span className="text-xs text-blue-900 font-bold mt-1 block">⏳ Aguardando: {e.produto}</span>
                          
                          {chegouNoEstoque ? (
                            <span className="inline-block mt-2 bg-green-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full animate-pulse">
                              ✨ O produto chegou na planilha! (Estoque: {estoqueAtual})
                            </span>
                          ) : (
                            <span className="inline-block mt-2 text-[10px] text-gray-500 font-medium">
                              Status atual na planilha: Esgotado (0)
                            </span>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row gap-2">
                          <a 
                            href={`https://wa.me/55${e.telefone}?text=${encodeURIComponent(`Oii ${e.nome}! O perfume ${e.produto} que você estava querendo acabou de voltar para o nosso estoque na Vascarin Beauty! 🎉 Posso reservar o seu?`)}`} 
                            target="_blank" 
                            className={`px-5 py-3 text-[10px] font-bold uppercase rounded-lg transition-colors text-center flex items-center justify-center ${chegouNoEstoque ? 'bg-green-600 hover:bg-green-700 text-white shadow-md' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                          >
                            📱 {chegouNoEstoque ? 'Avisar que Chegou (WhatsApp)' : 'Chamar Cliente'}
                          </a>
                          <button onClick={() => handleUpdateContato('fila_espera', e.telefone, e.status_contato === 'Enviado' ? 'Pendente' : 'Enviado')} className={`px-5 py-3 text-[10px] font-bold uppercase rounded-lg transition-colors cursor-pointer text-center flex items-center justify-center border ${e.status_contato === 'Enviado' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}>
                            {e.status_contato === 'Enviado' ? '✔ Avisado' : 'Marcar'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'buscas' && (
            <div>
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-sm font-black uppercase text-black">Termos Pesquisados no Site</h2>
                  <p className="text-xs text-gray-400">Descubra quais perfumes seus clientes estão procurando.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={carregarTudo} className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold uppercase rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">🔄 Atualizar</button>
                  <button onClick={handleExportBuscas} className="px-4 py-2 bg-green-600 text-white text-xs font-bold uppercase rounded-lg hover:bg-green-700 transition-colors cursor-pointer">📊 Exportar</button>
                </div>
              </div>

              <div className="mb-6">
                <input type="text" placeholder="🔍 Pesquisar por termo buscado ou nome do cliente..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full border border-gray-300 p-3 text-xs rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-black transition-colors" />
              </div>

              {filteredBuscas.length === 0 ? <p className="text-xs text-gray-400 py-8 text-center">Nenhuma pesquisa registrada no site ainda.</p> : (
                <div className="flex flex-col gap-4">
                  {filteredBuscas.map((b, i) => (
                    <div key={i} className="border border-purple-200 bg-purple-50/50 rounded-xl p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                      <div>
                        <strong className="text-sm text-purple-900 block">"{b.termo}"</strong>
                        <span className="text-[10px] font-bold text-gray-500 uppercase mt-1 block">
                          Pesquisado por: <span className="text-black">{b.nome || 'Visitante Anônimo'}</span> {b.telefone && `(${b.telefone})`}
                        </span>
                        <span className="text-[10px] text-gray-500 font-bold mt-1 block">
                          🕒 {new Date(b.created_at).toLocaleDateString('pt-BR')} às {new Date(b.created_at).toLocaleTimeString('pt-BR')}
                        </span>
                        {b.resultados > 0 ? (
                          <span className="text-[10px] text-green-600 font-bold block mt-1">✔ Encontrou produtos</span>
                        ) : (
                          <span className="text-[10px] text-red-500 font-bold block mt-1">❌ Não encontrou resultados</span>
                        )}
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-2">
                        {b.telefone && (
                          <a href={`https://wa.me/55${b.telefone}?text=Olá ${b.nome}! Vi que você procurou por "${b.termo}" no nosso site. Posso te ajudar a encontrar ou encomendar para você?`} target="_blank" className="px-5 py-3 bg-purple-600 text-white text-[10px] font-bold uppercase rounded-lg hover:bg-purple-700 transition-colors text-center flex items-center justify-center">
                            📱 Oferecer Encomenda
                          </a>
                        )}
                        <button onClick={() => handleDeleteBusca(b.id)} className="px-5 py-3 bg-red-100 text-red-700 text-[10px] font-bold uppercase rounded-lg hover:bg-red-200 transition-colors cursor-pointer text-center flex items-center justify-center border border-red-200">
                          🗑️ Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'historico' && (
            <div>
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-sm font-black uppercase text-black">Histórico de Acessos</h2>
                  <p className="text-xs text-gray-400">Acompanhe quem entrou na sua loja e o horário exato.</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={carregarTudo} className="px-4 py-2 bg-gray-100 text-gray-700 text-xs font-bold uppercase rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">🔄 Atualizar</button>
                  <button onClick={handleExportHistorico} className="px-4 py-2 bg-green-600 text-white text-xs font-bold uppercase rounded-lg hover:bg-green-700 transition-colors cursor-pointer">📊 Exportar</button>
                </div>
              </div>

              <div className="mb-6">
                <input type="text" placeholder="🔍 Pesquisar por nome ou WhatsApp..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full border border-gray-300 p-3 text-xs rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-black transition-colors" />
              </div>

              {filteredHistorico.length === 0 ? <p className="text-xs text-gray-400 py-8 text-center">Nenhum histórico encontrado com essa pesquisa.</p> : (
                <div className="flex flex-col gap-4">
                  {filteredHistorico.map((h, i) => (
                    <div key={i} className="border border-gray-200 p-5 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-gray-50 relative group">
                      <div>
                        <strong className="text-sm text-black block">{h.nome}</strong>
                        <span className="text-xs text-gray-500">{h.telefone}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono bg-white border border-gray-200 px-4 py-2 rounded-lg text-gray-600 font-bold">
                          {new Date(h.acessado_em).toLocaleDateString('pt-BR')} às {new Date(h.acessado_em).toLocaleTimeString('pt-BR')}
                        </span>
                        
                        {/* BOTÃO EXCLUIR HISTÓRICO */}
                        <button 
                          onClick={() => handleDeleteHistorico(h.id)} 
                          className="text-gray-300 hover:text-red-500 transition-colors p-2 text-lg leading-none cursor-pointer"
                          title="Excluir Histórico"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'estoque' && (
            <div>
              <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-sm font-black uppercase text-black">Gestão de Estoque (Planilha)</h2>
                  <p className="text-xs text-gray-400">Acompanhe a situação atual e o histórico de movimentações (Chegou / Esgotou).</p>
                </div>
                <div className="flex gap-2 items-center">
                  <div className="bg-gray-100 p-1 rounded-lg flex gap-1">
                    <button onClick={() => setEstoqueSubTab('atual')} className={`px-3 py-1.5 text-[11px] font-bold uppercase rounded-md transition-colors ${estoqueSubTab === 'atual' ? 'bg-black text-white' : 'text-gray-600 hover:text-black'}`}>📦 Estoque Atual</button>
                    <button onClick={() => setEstoqueSubTab('log')} className={`px-3 py-1.5 text-[11px] font-bold uppercase rounded-md transition-colors ${estoqueSubTab === 'log' ? 'bg-black text-white' : 'text-gray-600 hover:text-black'}`}>🕒 Histórico (Chegou/Esgotou)</button>
                  </div>
                  <button onClick={carregarTudo} className="px-3 py-2 bg-gray-100 text-gray-700 text-xs font-bold uppercase rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">🔄 Atualizar</button>
                </div>
              </div>

              {estoqueSubTab === 'atual' && (
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-green-700">Produtos Disponíveis (Estoque &gt; 0)</span>
                      <div className="text-2xl font-black text-green-700 mt-1">{produtosDisponiveis.length} itens</div>
                    </div>
                    <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-700">Produtos Esgotados (Estoque = 0)</span>
                      <div className="text-2xl font-black text-red-700 mt-1">{produtosEsgotados.length} itens</div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <input type="text" placeholder="🔍 Pesquisar produto no estoque..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full border border-gray-300 p-3 text-xs rounded-lg bg-gray-50 focus:bg-white outline-none focus:border-black transition-colors" />
                  </div>

                  {filteredEstoque.length === 0 ? <p className="text-xs text-gray-400 py-8 text-center">Nenhum produto encontrado na planilha.</p> : (
                    <div className="flex flex-col gap-3">
                      {filteredEstoque.map((p, i) => {
                        const qtd = Number(p.estoque ?? p.quantidade ?? 0);
                        const isEsgotado = qtd <= 0;
                        return (
                          <div key={i} className={`border p-4 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 ${isEsgotado ? 'bg-red-50/40 border-red-200' : 'bg-white border-gray-200'}`}>
                            <div>
                              <strong className="text-xs text-black block">{p.nome}</strong>
                              <span className="text-[10px] text-gray-500 uppercase mt-0.5 block">Categoria: {p.categoria || 'Geral'}</span>
                              <span className={`inline-block mt-1.5 text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${isEsgotado ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                {isEsgotado ? '❌ Esgotado na Planilha (0)' : `✔ Disponível (${qtd} un.)`}
                              </span>
                            </div>
                            <span className="text-xs font-bold text-black">
                              R$ {Number(p.preco || 0).toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {estoqueSubTab === 'log' && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <p className="text-xs text-gray-500">Este diário registra automaticamente todas as vezes que um produto mudou de status (quando chegou reposição ou quando esgotou).</p>
                    {estoqueLogs.length > 0 && (
                      <button 
                        onClick={() => {
                          if (confirm("Tem certeza que deseja apagar todo o histórico de Chegou/Esgotou?")) {
                            localStorage.removeItem('vascarin_estoque_logs');
                            setEstoqueLogs([]);
                          }
                        }}
                        className="px-3 py-1.5 bg-red-100 text-red-700 hover:bg-red-200 text-[10px] font-bold uppercase rounded-lg transition-colors cursor-pointer"
                      >
                        🗑️ Limpar Histórico
                      </button>
                    )}
                  </div>

                  {estoqueLogs.length === 0 ? (
                    <p className="text-xs text-gray-400 py-12 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                      Nenhuma alteração de estoque registrada ainda nesta sessão. Assim que houver atualização na planilha, o histórico aparecerá aqui.
                    </p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {estoqueLogs.map((log, idx) => (
                        <div key={idx} className={`border p-4 rounded-xl flex items-center justify-between gap-4 ${log.tipo === 'Chegou' ? 'bg-green-50/50 border-green-200' : 'bg-red-50/50 border-red-200'}`}>
                          <div>
                            <span className={`inline-block px-2.5 py-0.5 text-[9px] font-black uppercase rounded-full mb-1 ${log.tipo === 'Chegou' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}`}>
                              {log.tipo === 'Chegou' ? '✨ Chegou Reposição' : '❌ Esgotou'}
                            </span>
                            <strong className="text-xs text-black block">{log.produto}</strong>
                          </div>
                          <span className="text-[11px] font-mono text-gray-500 bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                            {log.data}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'mensagens' && (
            <div>
              <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                <div>
                  <h2 className="text-sm font-black uppercase text-black">Scripts de Venda (Templates)</h2>
                  <p className="text-xs text-gray-400">Modelos prontos para você copiar e prospectar clientes no WhatsApp.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="border border-gray-200 rounded-xl p-5 bg-gray-50 flex flex-col">
                  <h3 className="text-xs font-bold uppercase text-purple-700 mb-3">💸 Cobrança de Pagamento</h3>
                  <textarea readOnly className="flex-1 w-full p-3 text-xs border border-gray-300 rounded-lg bg-white outline-none resize-none min-h-[120px]" value={"Olá [Nome]! Tudo bem? Aqui é da Vascarin Beauty.\n\nRecebemos o seu pedido, mas notamos que o pagamento ainda não foi concluído no sistema.\n\nPrecisa de alguma ajuda com o link ou com a chave PIX? Estou aqui para te ajudar a garantir os seus produtos antes que esgotem! 💖"} />
                  <button onClick={(e) => { navigator.clipboard.writeText("Olá [Nome]! Tudo bem? Aqui é da Vascarin Beauty.\n\nRecebemos o seu pedido, mas notamos que o pagamento ainda não foi concluído no sistema.\n\nPrecisa de alguma ajuda com o link ou com a chave PIX? Estou aqui para te ajudar a garantir os seus produtos antes que esgotem! 💖"); (e.target as any).innerText = '✔ Copiado!'; setTimeout(() => (e.target as any).innerText = 'Copiar Script', 2000) }} className="mt-3 w-full bg-black text-white text-[10px] font-bold uppercase py-2 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer">Copiar Script</button>
                </div>

                <div className="border border-gray-200 rounded-xl p-5 bg-gray-50 flex flex-col">
                  <h3 className="text-xs font-bold uppercase text-blue-700 mb-3">🔔 Produto Chegou</h3>
                  <textarea readOnly className="flex-1 w-full p-3 text-xs border border-gray-300 rounded-lg bg-white outline-none resize-none min-h-[120px]" value={"Oii [Nome]! O perfume [Produto] que você estava querendo acabou de voltar para o nosso estoque na Vascarin Beauty! 🎉\n\nPosso reservar o seu?"} />
                  <button onClick={(e) => { navigator.clipboard.writeText("Oii [Nome]! O perfume [Produto] que você estava querendo acabou de voltar para o nosso estoque na Vascarin Beauty! 🎉\n\nPosso reservar o seu?"); (e.target as any).innerText = '✔ Copiado!'; setTimeout(() => (e.target as any).innerText = 'Copiar Script', 2000) }} className="mt-3 w-full bg-black text-white text-[10px] font-bold uppercase py-2 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer">Copiar Script</button>
                </div>

                <div className="border border-gray-200 rounded-xl p-5 bg-gray-50 flex flex-col">
                  <h3 className="text-xs font-bold uppercase text-amber-700 mb-3">🛒 Abordagem de Carrinho</h3>
                  <textarea readOnly className="flex-1 w-full p-3 text-xs border border-gray-300 rounded-lg bg-white outline-none resize-none min-h-[120px]" value={"Olá [Nome]! Tudo bem? Vi que você deixou produtos incríveis na sacola da Vascarin Beauty.\n\nPosso te ajudar a finalizar o pedido ou tirar alguma dúvida sobre a fragrância?"} />
                  <button onClick={(e) => { navigator.clipboard.writeText("Olá [Nome]! Tudo bem? Vi que você deixou produtos incríveis na sacola da Vascarin Beauty.\n\nPosso te ajudar a finalizar o pedido ou tirar alguma dúvida sobre a fragrância?"); (e.target as any).innerText = '✔ Copiado!'; setTimeout(() => (e.target as any).innerText = 'Copiar Script', 2000) }} className="mt-3 w-full bg-black text-white text-[10px] font-bold uppercase py-2 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer">Copiar Script</button>
                </div>

                <div className="border border-gray-200 rounded-xl p-5 bg-gray-50 flex flex-col">
                  <h3 className="text-xs font-bold uppercase text-pink-600 mb-3">💖 Abordagem de Favoritos</h3>
                  <textarea readOnly className="flex-1 w-full p-3 text-xs border border-gray-300 rounded-lg bg-white outline-none resize-none min-h-[120px]" value={"Oii [Nome]! Vi que você amou o [Produto] na nossa loja.\n\nEstou passando pra te avisar que o estoque dele está acabando! Quer que eu já reserve o seu antes que acabe?"} />
                  <button onClick={(e) => { navigator.clipboard.writeText("Oii [Nome]! Vi que você amou o [Produto] na nossa loja.\n\nEstou passando pra te avisar que o estoque dele está acabando! Quer que eu já reserve o seu antes que acabe?"); (e.target as any).innerText = '✔ Copiado!'; setTimeout(() => (e.target as any).innerText = 'Copiar Script', 2000) }} className="mt-3 w-full bg-black text-white text-[10px] font-bold uppercase py-2 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer">Copiar Script</button>
                </div>

                <div className="border border-gray-200 rounded-xl p-5 bg-gray-50 flex flex-col">
                  <h3 className="text-xs font-bold uppercase text-blue-600 mb-3">👥 Reativação de Cliente</h3>
                  <textarea readOnly className="flex-1 w-full p-3 text-xs border border-gray-300 rounded-lg bg-white outline-none resize-none min-h-[120px]" value={"Olá [Nome], tudo bem por aí? Faz um tempo que não nos falamos!\n\nChegaram umas novidades maravilhosas na Vascarin Beauty que são super o seu estilo. Posso te mandar algumas fotos?"} />
                  <button onClick={(e) => { navigator.clipboard.writeText("Olá [Nome], tudo bem por aí? Faz um tempo que não nos falamos!\n\nChegaram umas novidades maravilhosas na Vascarin Beauty que são super o seu estilo. Posso te mandar algumas fotos?"); (e.target as any).innerText = '✔ Copiado!'; setTimeout(() => (e.target as any).innerText = 'Copiar Script', 2000) }} className="mt-3 w-full bg-black text-white text-[10px] font-bold uppercase py-2 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer">Copiar Script</button>
                </div>

              </div>
            </div>
          )}

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