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

    const saveToSupabase = async () => {
      let totalVisitas = parseInt(localStorage.getItem('vascarin_visits') || '0');
      if (!sessionStorage.getItem('vascarin_session')) {
        totalVisitas += 1;
        localStorage.setItem('vascarin_visits', totalVisitas.toString());
        sessionStorage.setItem('vascarin_session', 'true');
      }

      const clientData = localStorage.getItem('vascarin_client');
      if (!clientData) return;

      const client = JSON.parse(clientData);
      const itensSummary = items.map((i: any) => `${i.quantity || 1}x ${i.nome}`).join(', ');

      try {
        const { data: existing } = await supabase.from('carrinhos_abandonados').select('id').eq('telefone', client.phone).maybeSingle();

        if (items.length > 0) {
          if (existing) {
            await supabase.from('carrinhos_abandonados').update({ itens_summary: itensSummary, nome: client.name, status: 'Com itens na sacola', visitas: totalVisitas }).eq('telefone', client.phone);
          } else {
            await supabase.from('carrinhos_abandonados').insert([{ telefone: client.phone, nome: client.name, itens_summary: itensSummary, status: 'Com itens na sacola', visitas: totalVisitas }]);
          }
        } else if (existing) {
          await supabase.from('carrinhos_abandonados').update({ status: 'Esvaziou a sacola', visitas: totalVisitas }).eq('telefone', client.phone);
        }
      } catch (err) { console.error("Erro Supabase:", err); }
    };

    saveToSupabase();
  }, [items, isMounted]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomerPhone(e.target.value);
    const clean = e.target.value.replace(/\D/g, '');
    if (clean.length >= 8) {
      const saved = localStorage.getItem(`client_${clean}`);
      if (saved) setCustomerName(JSON.parse(saved).name || '');
    }
  };

  const formatPrice = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const handleCheckoutUnificado = async () => {
    if (!hasAcceptedTerms) { alert("Aceite os termos."); return; }
    if (!customerName || !customerPhone) { alert("Preencha os dados."); return; }

    setIsProcessing(true);
    try {
      const orderNumber = localStorage.getItem('lastOrderNumber') ? parseInt(localStorage.getItem('lastOrderNumber')!) + 1 : 70;
      localStorage.setItem('lastOrderNumber', orderNumber.toString());

      const itemsToPay = items.map((item: any) => ({ nome: item.nome, quantity: item.quantity || 1, preco: Number(item.preco) }));
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: itemsToPay, customer: { name: customerName, phone: customerPhone } })
      });
      const data = await response.json();
      
      let msg = `✨ NOVO PEDIDO #VASC-${orderNumber} ✨\nNome: ${customerName}\nTotal: ${formatPrice(items.reduce((a:any, b:any) => a + Number(b.preco)*(b.quantity||1), 0))}`;
      if (data.url) msg += `\n\nLink: ${data.url}`;
      
      window.open(`https://wa.me/5511992465042?text=${encodeURIComponent(msg)}`, '_blank');
      if (data.url) window.location.href = data.url;
    } catch (e) { alert("Erro ao processar."); } finally { setIsProcessing(false); }
  };

  if (!isMounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl p-6">
        <h2 className="text-sm font-black uppercase mb-4">Sua Sacola ({items.length})</h2>
        <div className="flex-1 overflow-y-auto">
          {items.map((item: any, i: number) => (
            <div key={i} className="flex gap-4 border-b pb-4 mb-4 items-center">
              <div className="flex-1 text-xs font-semibold">{item.nome} - {formatPrice(item.preco)}</div>
              <button onClick={() => removeItem(item.id)} className="text-red-500 font-bold text-[10px]">REMOVER</button>
            </div>
          ))}
        </div>
        {items.length > 0 && (
          <div className="pt-4 border-t">
            {step === 'cart' ? (
              <button onClick={() => setStep('checkout')} className="w-full bg-black text-white p-4 font-bold uppercase text-xs">Avançar para Pagamento</button>
            ) : (
              <div className="flex flex-col gap-2">
                <input type="text" placeholder="Nome" value={customerName} onChange={e => setCustomerName(e.target.value)} className="border p-2 w-full text-xs" />
                <input type="text" placeholder="WhatsApp" value={customerPhone} onChange={handlePhoneChange} className="border p-2 w-full text-xs" />
                <label className="flex items-center text-[10px]"><input type="checkbox" onChange={e => setHasAcceptedTerms(e.target.checked)} className="mr-2" /> Aceito os termos.</label>
                <button onClick={handleCheckoutUnificado} disabled={isProcessing} className="w-full bg-black text-white p-4 font-bold uppercase text-xs">FINALIZAR</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}