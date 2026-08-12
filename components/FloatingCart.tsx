"use client";

import { useCartStore } from '@/store/cart';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import TermsModal from './TermsModal';

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
  const [customerEmail, setCustomerEmail] = useState('');

  useEffect(() => { setIsMounted(true); }, []);

  const totalProducts = items.reduce((acc: number, item: any) => acc + (Number(item.preco) * (item.quantity || item.amount || 1)), 0);
  const formatPrice = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const handleCheckoutUnificado = async () => {
    if (!hasAcceptedTerms) {
      alert("Para prosseguir, você deve ler e marcar o aceite dos nossos Termos de Troca e Devolução.");
      return;
    }
    if (!customerName || !customerPhone || !customerEmail) {
      alert("Por favor, preencha todos os seus dados.");
      return;
    }

    setIsProcessing(true);
    // [Aqui entra sua lógica de envio que já existia]
    setIsProcessing(false);
  };

  if (!isMounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-[11px] font-black uppercase tracking-widest text-black">Sacola ({items.length})</h2>
          <button onClick={toggleCart} className="text-gray-400 hover:text-black">X</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 'checkout' && (
            <div className="flex flex-col gap-4">
              <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Dados para Entrega</h3>
              <input type="text" placeholder="Nome Completo" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full border p-2 text-xs" />
              <input type="text" placeholder="WhatsApp" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full border p-2 text-xs" />
              <input type="email" placeholder="E-mail" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="w-full border p-2 text-xs" />

              {/* CHECKBOX OBRIGATÓRIO */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded flex items-start gap-3 mt-4">
                <input 
                  type="checkbox" 
                  id="acceptTerms" 
                  checked={hasAcceptedTerms}
                  onChange={(e) => setHasAcceptedTerms(e.target.checked)}
                  className="mt-0.5 cursor-pointer"
                />
                <label htmlFor="acceptTerms" className="text-[10px] text-gray-700 leading-tight">
                   Declaro que li e aceito rigorosamente os <TermsModal /> antes de finalizar esta compra.
                </label>
              </div>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t bg-gray-50">
          <button 
            onClick={step === 'cart' ? () => setStep('checkout') : handleCheckoutUnificado}
            disabled={step === 'checkout' && !hasAcceptedTerms}
            className={`w-full py-4 text-[11px] font-bold uppercase transition-colors ${
              (step === 'checkout' && !hasAcceptedTerms) 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-black text-white hover:bg-zinc-800'
            }`}
          >
            {step === 'cart' ? 'Avançar para Pagamento' : 'Finalizar Pedido'}
          </button>
        </div>
      </div>
    </div>
  );
}