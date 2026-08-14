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
        }
      } catch (error) { console.error("Erro ao sincronizar sacola:", error); }
    };
    syncCartWithSupabase();
  }, [items, isMounted]);

  const getInfinitePayRate = (installments: number) => {
    switch (installments) {
      case 1: return 0.0420; case 2: return 0.0609; case 3: return 0.0701;
      case 4: return 0.0791; case 5: return 0.0880; case 6: return 0.0967;
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
    if (!hasAcceptedTerms) { alert("Por favor, aceite os Termos de Troca e Devolução."); return; }
    if (!customerName || !customerPhone) { alert("Preencha Nome e WhatsApp."); return; }

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
            items: items.map((item: any) => ({ nome: item.nome, quantity: item.quantity || 1, preco: Number(item.preco) })),
            customer: { name: customerName, phone: cleanPhone, email: "cliente@vascarinbeauty.com" }
          })
        });
        const data = await response.json();
        paymentUrl = data.url || "";
      } catch (e) { console.error("Erro InfinitePay:", e); }

      await supabase.from('pedidos').insert([{
        id: orderId, nome: customerName, telefone: cleanPhone, items: itemsSummary,
        total: Number(baseTotal.toFixed(2)),
        forma_pagamento: paymentMethod === 'pix' ? 'PIX' : `Cartão (${selectedInstallment}x)`,
        link_pagamento: paymentUrl || 'Link via WhatsApp',
        status: 'Pendente', tipo: 'Site'
      }]);

      let msg = `✨ NOVO PEDIDO #${orderId} ✨\n\n👤 ${customerName}\n📱 ${customerPhone}\n\n🛒 ITENS:\n`;
      items.forEach((item: any) => {
        const qty = item.quantity || 1;
        msg += `• ${qty}x ${item.nome} — ${formatPrice(Number(item.preco) * qty)}\n`;
      });
      msg += `\n🚚 Entrega: ${deliveryMethod === 'envio' ? `Envio (R$ ${FRETE_FIXO.toFixed(2)})` : 'A Combinar'}`;
      msg += `\n💰 Total: *${formatPrice(baseTotal)}*\n`;
      if (paymentUrl) msg += `\n🔗 Pagamento: ${paymentUrl}\n`;
      msg += `\n⚠️ Pedido sujeito a cancelamento se não houver pagamento.`;

      window.open(`https://wa.me/5511992465042?text=${encodeURIComponent(msg)}`, '_blank');
      if (paymentUrl) window.location.href = paymentUrl;
      else alert(`Pedido #${orderId} gerado!`);

    } catch (error) {
      alert("Erro ao processar.");
    } finally { setIsProcessing(false); }
  };

  if (!isMounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-sm font-black uppercase tracking-wider text-black">Sua Sacola ({items.length})</h2>
          <button onClick={toggleCart} className="text-gray-400 cursor-pointer text-lg font-bold">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <p className="text-gray-400 text-sm mb-4">Sua sacola está vazia.</p>
              <button onClick={toggleCart} className="bg-black text-white text-xs font-bold uppercase px-6 py-3 rounded-lg">Ver Catálogo</button>
            </div>
          ) : (
            <>
              {step === 'cart' ? (
                items.map((item: any, idx: number) => (
                  <div key={idx} className="flex gap-4 items-center border-b border-gray-100 pb-4">
                    <div className="flex-1">
                      <h4 className="text-xs font-semibold text-gray-800">{item.nome}</h4>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center border border-gray-200 rounded">
                          <button onClick={() => updateQuantity(item.id || item.nome, (item.quantity || 1) - 1)} className="px-2 py-0.5">-</button>
                          <span className="px-2 text-xs font-bold">{item.quantity || 1}</span>
                          <button onClick={() => updateQuantity(item.id || item.nome, (item.quantity || 1) + 1)} className="px-2 py-0.5">+</button>
                        </div>
                        <button onClick={() => removeItem(item.id || item.nome)} className="text-[10px] text-red-500 uppercase font-bold">Remover</button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col gap-4">
                  <input type="text" placeholder="Nome Completo" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full border p-3 text-xs rounded-lg" />
                  <input type="text" placeholder="WhatsApp" value={customerPhone} onChange={(e) => setCustomerPhone(formatPhone(e.target.value))} className="w-full border p-3 text-xs rounded-lg" />
                  
                  <div>
                    <h3 className="text-xs font-bold uppercase text-gray-500 mb-2">Forma de Entrega</h3>
                    <p className="text-[10px] text-gray-400 mb-2 italic">Prazo: 2 a 3 dias úteis.</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setDeliveryMethod('envio')} className={`p-3 text-[10px] font-bold border rounded ${deliveryMethod === 'envio' ? 'bg-black text-white' : 'bg-white'}`}>Envio (R$ {FRETE_FIXO.toFixed(2)})</button>
                      <button onClick={() => setDeliveryMethod('combinar')} className={`p-3 text-[10px] font-bold border rounded ${deliveryMethod === 'combinar' ? 'bg-black text-white' : 'bg-white'}`}>A Combinar</button>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-gray-50 border rounded-lg flex items-start gap-3">
                    <input type="checkbox" id="acceptTerms" checked={hasAcceptedTerms} onChange={(e) => setHasAcceptedTerms(e.target.checked)} />
                    <label htmlFor="acceptTerms" className="text-[10px] text-gray-700">Declaro que li e aceito os <TermsModal />.</label>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t bg-gray-50">
            <div className="flex justify-between mb-4">
              <span className="text-gray-500 font-medium">Total:</span>
              <span className="text-xl font-black">{formatPrice(step === 'checkout' ? simulatedTotalWithTax : baseTotal)}</span>
            </div>
            {step === 'cart' ? (
              <button onClick={() => setStep('checkout')} className="w-full bg-black text-white py-4 rounded-lg font-bold uppercase text-xs">Avançar</button>
            ) : (
              <button onClick={handleCheckout} disabled={isProcessing} className="w-full bg-green-600 text-white py-4 rounded-lg font-bold uppercase text-xs">{isProcessing ? "PROCESSANDO..." : "Finalizar no WhatsApp"}</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}