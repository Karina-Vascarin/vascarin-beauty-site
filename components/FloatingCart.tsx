"use client";

import { useCartStore } from '@/store/cart';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import TermsModal from './TermsModal';
import { supabase } from '@/lib/supabase';

export default function FloatingCart() {
  const [isMounted, setIsMounted] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  
  const [deliveryMethod, setDeliveryMethod] = useState<'envio' | 'combinar'>('envio');
  const FRETE_FIXO = 15.00;

  const cartStore = useCartStore() as any;
  const items = cartStore.items || [];
  const isOpen = cartStore.isOpen;
  const toggleCart = cartStore.toggleCart;
  const removeItem = cartStore.removeItem;
  const updateQuantity = cartStore.updateQuantity || cartStore.updateAmount || (() => {});

  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit'>('pix');
  const [selectedInstallment, setSelectedInstallment] = useState<number>(1);
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Máscara
  const formatPhone = (value: string) => {
    return value.replace(/\D/g, "").replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2").slice(0, 15);
  };

  useEffect(() => {
    setIsMounted(true);
    const clientData = localStorage.getItem('vascarin_client');
    if (clientData) {
      try {
        const parsed = JSON.parse(clientData);
        if (parsed.name) setCustomerName(parsed.name);
        if (parsed.phone) setCustomerPhone(parsed.phone);
      } catch (err) {}
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const syncCartWithSupabase = async () => {
      const clientData = localStorage.getItem('vascarin_client');
      if (!clientData) return;

      const client = JSON.parse(clientData);
      const cleanPhone = client.phone.replace(/\D/g, '');

      try {
        if (items.length > 0) {
          const itensSummary = items.map((i: any) => `${i.quantity || 1}x ${i.nome}`).join(', ');

          await supabase.from('carrinhos_abandonados').upsert({
            telefone: cleanPhone,
            nome: client.name,
            itens_summary: itensSummary,
            status: 'Com itens na sacola',
            updated_at: new Date().toISOString()
          }, { onConflict: 'telefone' });
        } else {
          await supabase.from('carrinhos_abandonados').update({
            status: 'Esvaziou a sacola',
            updated_at: new Date().toISOString()
          }).eq('telefone', cleanPhone);
        }
      } catch (error) {
        console.error("Erro ao sincronizar sacola:", error);
      }
    };

    syncCartWithSupabase();
  }, [items, isMounted]);

  const getInfinitePayRate = (installments: number) => {
    switch (installments) {
      case 1: return 0.0420; case 2: return 0.0609; case 3: return 0.0701;
      case 4: return 0.0791; case 5: return 0.0880; case 6: return 0.0967;
      case 7: return 0.1259; case 8: return 0.1342; case 9: return 0.1425;
      case 10: return 0.1506; case 11: return 0.1587; case 12: return 0.1666;
      default: return 0.0420;
    }
  };

  const frete = (step === 'checkout' && deliveryMethod === 'envio') ? FRETE_FIXO : 0;
  const totalProducts = items.reduce((acc: number, item: any) => acc + (Number(item.preco) * (item.quantity || item.amount || 1)), 0);
  const baseTotal = totalProducts + frete; 
  const taxRate = (step === 'checkout' && paymentMethod === 'credit') ? getInfinitePayRate(selectedInstallment) : 0;
  const simulatedTotalWithTax = taxRate > 0 ? (totalProducts / (1 - taxRate)) + frete : baseTotal;

  const formatPrice = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const handleCheckout = async () => {
    if (!hasAcceptedTerms) {
      alert("Por favor, leia e aceite os Termos de Troca e Devolução para prosseguir.");
      return;
    }
    if (!customerName || !customerPhone) {
      alert("Por favor, preencha seus dados de Nome e WhatsApp.");
      return;
    }

    setIsProcessing(true);

    try {
      const cleanPhone = customerPhone.replace(/\D/g, '');
      const orderId = `VASC-${Date.now().toString().slice(-5)}`;
      const itemsSummary = items.map((i: any) => `${i.quantity || 1}x ${i.nome}`).join(', ');

      let paymentUrl = "";
      try {
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: items.map((item: any) => ({
              nome: item.nome,
              quantity: item.quantity || 1,
              preco: Number(item.preco)
            })),
            customer: { name: customerName, phone: cleanPhone, email: "cliente@vascarinbeauty.com" }
          })
        });
        const data = await response.json();
        paymentUrl = data.url || "";
      } catch (e) {
        console.error("Erro ao gerar InfinitePay:", e);
      }

      await supabase.from('pedidos').insert([{
        id: orderId,
        nome: customerName,
        telefone: cleanPhone,
        items: itemsSummary,
        total: Number(baseTotal.toFixed(2)),
        forma_pagamento: paymentMethod === 'pix' ? 'PIX' : `Cartão (${selectedInstallment}x)`,
        link_pagamento: paymentUrl || 'Link via WhatsApp',
        status: 'Pendente / A Separar',
        tipo: 'Site'
      }]);

      await supabase.from('carrinhos_abandonados').delete().eq('telefone', cleanPhone);

      let msg = `✨ NOVO PEDIDO #${orderId} ✨\n\n`;
      msg += `👤 Cliente: ${customerName}\n📱 WhatsApp: ${customerPhone}\n\n`;
      msg += `🛒 ITENS:\n`;
      items.forEach((item: any) => {
        const qty = item.quantity || 1;
        msg += `• ${qty}x ${item.nome} — ${formatPrice(Number(item.preco) * qty)}\n`;
      });
      msg += `\n🚚 Entrega: ${deliveryMethod === 'envio' ? `Envio (R$ ${FRETE_FIXO.toFixed(2)})` : 'A Combinar'}`;
      msg += `\n💰 Total: *${formatPrice(baseTotal)}*\n`;
      if (paymentUrl) msg += `\n🔗 Link InfinitePay: ${paymentUrl}\n`;
      msg += `\n⚠️ *Atenção:* Se o pagamento não for realizado, o pedido será desconsiderado.`;

      window.open(`https://wa.me/5511992465042?text=${encodeURIComponent(msg)}`, '_blank');

      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        alert(`Pedido #${orderId} gerado com sucesso!`);
      }

    } catch (error) {
      console.error("Erro ao finalizar:", error);
      alert("Houve um erro ao processar o pedido. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isMounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        
        {/* Cabeçalho */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-sm font-black uppercase tracking-wider text-black">
            Sua Sacola ({items.length})
          </h2>
          <button onClick={toggleCart} className="text-gray-400 hover:text-black transition-colors cursor-pointer text-lg font-bold">
            ✕
          </button>
        </div>

        {/* Lista de Itens */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <p className="text-gray-400 text-sm mb-4">Sua sacola está vazia.</p>
              <button onClick={toggleCart} className="bg-black text-white text-xs font-bold uppercase px-6 py-3 hover:bg-zinc-800 transition-colors cursor-pointer rounded-lg">
                Ver Catálogo
              </button>
            </div>
          ) : (
            <>
              {step === 'cart' ? (
                <div className="flex flex-col gap-4">
                  {items.map((item: any, index: number) => {
                    const qty = item.quantity || item.amount || 1;
                    let imageSrc = "";
                    const semImagem = !item.imagem || String(item.imagem).includes('default-image');
                    if (!semImagem) {
                      let rawPath = String(item.imagem).replace(/[\r\n]+/g, '').trim();
                      if (rawPath.startsWith('/produtos/')) rawPath = rawPath.replace('/produtos/', '');
                      else if (rawPath.startsWith('produtos/')) rawPath = rawPath.replace('produtos/', '');
                      const hasExtension = /\.(png|jpe?g|webp)$/i.test(rawPath);
                      imageSrc = encodeURI(`/produtos/${rawPath}${hasExtension ? '' : '.png'}`);
                    }

                    return (
                      <div key={`${item.id || item.nome}-${index}`} className="flex gap-4 items-center border-b border-gray-100 pb-4">
                        <div className="relative w-16 h-16 bg-gray-50 flex-shrink-0 border border-gray-100 rounded-lg overflow-hidden">
                          {imageSrc && <Image src={imageSrc} alt={item.nome} fill unoptimized className="object-contain p-1" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-gray-800 truncate">{item.nome}</h4>
                          <span className="text-xs font-bold text-black mt-1 block">{formatPrice(Number(item.preco))}</span>
                          
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center border border-gray-200 rounded">
                              <button onClick={() => updateQuantity(item.id || item.nome, qty - 1)} className="px-2 py-0.5 text-gray-500 hover:bg-gray-100 cursor-pointer">-</button>
                              <span className="px-2 text-xs font-bold">{qty}</span>
                              <button onClick={() => updateQuantity(item.id || item.nome, qty + 1)} className="px-2 py-0.5 text-gray-500 hover:bg-gray-100 cursor-pointer">+</button>
                            </div>
                            <button onClick={() => removeItem(item.id || item.nome)} className="text-[10px] uppercase font-bold text-red-500 hover:underline cursor-pointer">
                              Remover
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Dados para Envio</h3>
                    <input 
                      type="text" 
                      placeholder="Nome Completo" 
                      value={customerName} 
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full border border-gray-300 p-3 text-xs rounded-lg focus:outline-none focus:border-black"
                    />
                    <input 
                      type="text" 
                      placeholder="WhatsApp" 
                      value={customerPhone} 
                      onChange={(e) => setCustomerPhone(formatPhone(e.target.value))}
                      className="w-full border border-gray-300 p-3 text-xs rounded-lg focus:outline-none focus:border-black"
                    />
                  </div>

                  {/* CAIXINHA LARANJINHA COM O CAMINHÃOZINHO E PRAZO */}
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
                    <span className="text-xl">🚚</span>
                    <div className="text-[11px] text-amber-900 leading-tight">
                      <span className="font-bold block">Prazo de Entrega</span>
                      <span>Envio estimado de 2 a 3 dias úteis.</span>
                    </div>
                  </div>

                  {/* OPÇÃO DE FRETE / ENTREGA */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Forma de Entrega</h3>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <button 
                        type="button" 
                        onClick={() => setDeliveryMethod('envio')} 
                        className={`p-3 text-[11px] font-bold uppercase border rounded-lg transition-colors cursor-pointer ${deliveryMethod === 'envio' ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-700 bg-white'}`}
                      >
                        Envio (+R$ 15,00)
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setDeliveryMethod('combinar')} 
                        className={`p-3 text-[11px] font-bold uppercase border rounded-lg transition-colors cursor-pointer ${deliveryMethod === 'combinar' ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-700 bg-white'}`}
                      >
                        A Combinar
                      </button>
                    </div>
                  </div>

                  <div className="mt-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Forma de Pagamento</h3>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <button 
                        type="button" 
                        onClick={() => setPaymentMethod('pix')} 
                        className={`p-3 text-xs font-bold uppercase border rounded-lg transition-colors cursor-pointer ${paymentMethod === 'pix' ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-700 bg-white'}`}
                      >
                        PIX
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setPaymentMethod('credit')} 
                        className={`p-3 text-xs font-bold uppercase border rounded-lg transition-colors cursor-pointer ${paymentMethod === 'credit' ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-700 bg-white'}`}
                      >
                        Cartão
                      </button>
                    </div>

                    {paymentMethod === 'credit' && (
                      <select 
                        value={selectedInstallment} 
                        onChange={(e) => setSelectedInstallment(Number(e.target.value))}
                        className="w-full border border-gray-300 p-3 text-xs font-bold rounded-lg bg-white focus:outline-none focus:border-black"
                      >
                        <option value={1}>1x de {formatPrice((totalProducts / (1 - 0.0420)) + frete)}</option>
                        <option value={2}>2x de {formatPrice(((totalProducts / (1 - 0.0609)) + frete) / 2)}</option>
                        <option value={3}>3x de {formatPrice(((totalProducts / (1 - 0.0701)) + frete) / 3)}</option>
                        <option value={4}>4x de {formatPrice(((totalProducts / (1 - 0.0791)) + frete) / 4)}</option>
                        <option value={5}>5x de {formatPrice(((totalProducts / (1 - 0.0880)) + frete) / 5)}</option>
                        <option value={6}>6x de {formatPrice(((totalProducts / (1 - 0.0967)) + frete) / 6)}</option>
                      </select>
                    )}
                  </div>

                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg flex items-start gap-3 mt-2">
                    <input 
                      type="checkbox" 
                      id="acceptTerms" 
                      checked={hasAcceptedTerms} 
                      onChange={(e) => setHasAcceptedTerms(e.target.checked)} 
                      className="mt-0.5 cursor-pointer"
                    />
                    <label htmlFor="acceptTerms" className="text-[10px] text-gray-700 leading-tight">
                        Declaro que li e aceito os <TermsModal /> antes de finalizar a compra.
                    </label>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Rodapé */}
        {items.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col gap-3">
            {step === 'checkout' && deliveryMethod === 'envio' && (
              <div className="flex justify-between items-center text-xs text-gray-500 border-b border-gray-200 pb-2">
                <span>Frete Fixo:</span>
                <span className="font-bold text-black">{formatPrice(FRETE_FIXO)}</span>
              </div>
            )}
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium">Total:</span>
              <span className="text-xl font-black text-black">
                {formatPrice(step === 'checkout' ? simulatedTotalWithTax : baseTotal)}
              </span>
            </div>

            {step === 'cart' ? (
              <button 
                onClick={() => setStep('checkout')} 
                className="w-full bg-black text-white text-xs font-bold uppercase py-4 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Avançar para Pagamento
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <button 
                  onClick={handleCheckout} 
                  disabled={isProcessing || !hasAcceptedTerms} 
                  className="w-full bg-green-600 text-white text-xs font-bold uppercase py-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 cursor-pointer shadow-md"
                >
                  {isProcessing ? "GERANDO PEDIDO..." : "IR PARA PAGAMENTO E WHATSAPP"}
                </button>
                <button 
                  onClick={() => setStep('cart')} 
                  className="w-full text-gray-500 text-[10px] font-bold uppercase py-2 hover:text-black transition-colors cursor-pointer"
                >
                  Voltar para sacola
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}