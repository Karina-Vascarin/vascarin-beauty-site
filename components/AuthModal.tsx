"use client";

import { useState, useEffect } from 'react';

export default function AuthModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    // Verifica se o cliente já se cadastrou antes
    const savedClient = localStorage.getItem('vascarin_client');
    if (!savedClient) {
      setIsOpen(true); // Se não, mostra o bloqueio
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) {
      alert("Por favor, preencha seu nome e telefone para entrar.");
      return;
    }

    const clientData = { name, phone };
    localStorage.setItem('vascarin_client', JSON.stringify(clientData));
    setIsOpen(false);
    
    // Atualiza a página para o carrinho reconhecer o novo cliente imediatamente
    window.location.reload();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-2xl p-6 flex flex-col gap-4 animate-in fade-in zoom-in duration-300">
        <div className="text-center">
          <span className="text-xs font-bold uppercase tracking-widest text-black block mb-1">Vascarin Beauty</span>
          <h2 className="text-sm font-bold text-gray-800">Bem-vindo(a)! Identifique-se para ver os preços e o catálogo.</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2">
          <input 
            type="text" 
            placeholder="Seu Nome" 
            value={name} 
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-gray-200 p-3 text-xs rounded focus:outline-none focus:border-black"
          />
          <input 
            type="text" 
            placeholder="Seu WhatsApp / Telefone" 
            value={phone} 
            onChange={(e) => setPhone(e.target.value)}
            className="w-full border border-gray-200 p-3 text-xs rounded focus:outline-none focus:border-black"
          />
          <button 
            type="submit" 
            className="w-full bg-black text-white text-xs font-bold uppercase py-3.5 rounded hover:bg-zinc-800 transition-colors mt-2 cursor-pointer"
          >
            Acessar Catálogo
          </button>
        </form>
      </div>
    </div>
  );
}