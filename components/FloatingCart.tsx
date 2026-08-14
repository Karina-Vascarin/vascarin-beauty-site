"use client";

import { useCartStore } from '@/store/cart';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export default function FloatingCart() {
  const [isMounted, setIsMounted] = useState(false);
  const [customerPhone, setCustomerPhone] = useState('');
  const cartStore = useCartStore() as any;
  const items = cartStore.items || [];
  const isOpen = cartStore.isOpen;
  const toggleCart = cartStore.toggleCart;

  const formatPhone = (value: string) => {
    return value.replace(/\D/g, "").replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2").slice(0, 15);
  };

  useEffect(() => {
    setIsMounted(true);
    const saved = localStorage.getItem('vascarin_client');
    if (saved) setCustomerPhone(JSON.parse(saved).phone || '');
  }, []);

  if (!isMounted || !isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white h-full p-6 flex flex-col shadow-2xl">
        <h2 className="text-sm font-black uppercase mb-4">Finalizar Compra</h2>
        {/* ... (renderização dos itens) ... */}
        <input 
          type="text" 
          value={formatPhone(customerPhone)} 
          onChange={e => setCustomerPhone(e.target.value)} 
          className="border p-3 w-full text-xs rounded-lg mb-4" 
        />
        <button onClick={toggleCart} className="w-full bg-black text-white p-4 font-bold uppercase text-xs">Finalizar Pedido</button>
      </div>
    </div>
  );
}