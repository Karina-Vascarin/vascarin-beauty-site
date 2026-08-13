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

  // Rastreamento em tempo real conectado direto no Supabase
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
          if (existing) await supabase.from('carrinhos_abandonados').update({ itens_summary: itensSummary, nome: client.name, status: 'Com itens na sacola', visitas: totalVisitas }).eq('telefone', client.phone);
          else await supabase.from('carrinhos_abandonados').insert([{ telefone: client.phone, nome: client.name, itens_summary: itensSummary, status: 'Com itens na sacola', visitas: totalVisitas }]);
        } else if (existing) {
          await supabase.from('carrinhos_abandonados').update({ status: 'Esvaziou a sacola', visitas: totalVisitas }).eq('telefone', client.phone);
        }
      } catch (err) { console.error(err); }
    };
    saveToSupabase();
  }, [items, isMounted]);

  const formatPrice = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  if (!isMounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        
        {/* CABEÇALHO */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-sm font-black uppercase tracking-wider text-black">Sua Sacola ({items.length})</h2>
          <button onClick={toggleCart} className="text-gray-400 hover:text-black cursor-pointer">X</button>
        </div>

        {/* LISTA DE PRODUTOS COM O DESIGN ORIGINAL */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-4">
          {items.map((item: any, index: number) => {
            const qty = item.quantity || item.amount || 1;
            let imageSrc = "";
            const semImagem = !item.imagem || String(item.imagem).includes('default-image');
            if (!semImagem) {
              let rawPath = String(item.imagem).replace(/[\r\n]+/g, '').trim();
              const hasExtension = /\.(png|jpe?g|webp)$/i.test(rawPath);
              imageSrc = encodeURI(`/produtos/${rawPath.replace('/produtos/', '').replace('produtos/', '')}${hasExtension ? '' : '.png'}`);
            }

            return (
              <div key={`${item.id}-${index}`} className="flex gap-4 items-center border-b pb-4">
                <div className="relative w-16 h-16 bg-gray-50 border border-gray-100">
                  {imageSrc && <Image src={imageSrc} alt={item.nome} fill unoptimized className="object-contain p-1" />}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-gray-800 truncate">{item.nome}</h4>
                  <span className="text-xs font-bold text-black block">{formatPrice(Number(item.preco))}</span>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex items-center border border-gray-200">
                      <button onClick={() => updateQuantity(item.id, qty - 1)} className="px-2 py-0.5">-</button>
                      <span className="px-2 text-xs font-bold">{qty}</span>
                      <button onClick={() => updateQuantity(item.id, qty + 1)} className="px-2 py-0.5">+</button>
                    </div>
                    <button onClick={() => removeItem(item.id)} className="text-[10px] uppercase font-bold text-red-500 underline cursor-pointer">Remover</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* RODAPÉ E CHECKOUT (Layout preservado) */}
        {items.length > 0 && (
          <div className="p-6 border-t bg-gray-50">
            <button onClick={() => setStep('checkout')} className="w-full bg-black text-white p-4 font-bold uppercase text-xs hover:bg-zinc-800 transition-colors">
              Ir para Pagamento
            </button>
          </div>
        )}
      </div>
    </div>
  );
}