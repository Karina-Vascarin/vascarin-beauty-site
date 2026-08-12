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

  const [step, setStep] = useState<'cart' | 'checkout'>('cart');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');

  useEffect(() => { setIsMounted(true); }, []);

  const totalProducts = items.reduce((acc: number, item: any) => acc + (Number(item.preco) * (item.quantity || item.amount || 1)), 0);
  const formatPrice = (value: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);

  const generateOrderNumber = () => {
    const saved = localStorage.getItem('lastOrderNumber');
    const newNumber = saved ? parseInt(saved) + 1 : 70;
    localStorage.setItem('lastOrderNumber', newNumber.toString());
    return newNumber;
  };

  const handleCheckoutUnificado = async () => {
    if (!hasAcceptedTerms) {
      alert("Por favor, leia e aceite os Termos de Troca e Devolução para prosseguir.");
      return;
    }
    if (!customerName || !customerPhone || !customerEmail) {
      alert("Por favor, preencha todos os seus dados.");
      return;
    }

    setIsProcessing(true);
    const orderNumber = generateOrderNumber();
    
    let message = `✨ NOVO PEDIDO #VASC-${orderNumber} ✨\n\n`;
    message += `👤 CLIENTE: ${customerName}\n`;
    message += `📱 TELEFONE: ${customerPhone}\n`;
    message += `📧 E-MAIL: ${customerEmail}\n\n`;
    message += `🛒 ITENS:\n`;
    items.forEach((item: any) => {
      message += `• ${item.quantity || item.amount || 1}x ${item.nome} - ${formatPrice(Number(item.preco))}\n`;
    });
    message += `\n💰 TOTAL: ${formatPrice(totalProducts)}`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/5511992465042?text=${encodedMessage}`, '_blank');
    
    alert(`Pedido finalizado! Seu número é VASC-${orderNumber}. Estamos te redirecionando para o WhatsApp.`);
    setIsProcessing(false);
    toggleCart();
  };

  if (!isMounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl">
        <div className="p-6 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-[11px] font-black uppercase tracking-widest text-black">Sua Sacola ({items.length})</h2>
          <button onClick={toggleCart} className="text-gray-400 hover:text-black">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {step === 'cart' ? (
            <div className="flex flex-col gap-4">
              {items.map((item: any, i: number) => (
                <div key={i} className="flex gap-4 border-b pb-4">
                  <div className="flex-1 text-xs">
                    <p className="font-bold">{item.nome}</p>
                    <p>{formatPrice(item.preco)}</p>
                  </div>
                  <button onClick={() => removeItem(item.id)} className="text-[10px] text-red-500 underline">Remover</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <input type="text" placeholder="Nome Completo" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full border p-2.5 text-xs" />
              <input type="text" placeholder="WhatsApp" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full border p-2.5 text-xs" />
              <input type="email" placeholder="E-mail" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className="w-full border p-2.5 text-xs" />
              
              <div className="p-4 bg-gray-50 border rounded flex items-start gap-3 mt-2">
                <input type="checkbox" id="terms" checked={hasAcceptedTerms} onChange={(e) => setHasAcceptedTerms(e.target.checked)} className="mt-1" />
                <label htmlFor="terms" className="text-[10px] text-gray-700 leading-tight">
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