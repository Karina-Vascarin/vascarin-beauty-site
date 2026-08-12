// Substitua o seu componente atual por este:
"use client";

import { useState } from 'react';

export default function TermsModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        type="button"
        onClick={() => setIsOpen(true)} 
        className="text-black font-bold underline cursor-pointer hover:text-red-700 transition-colors"
      >
        Termos de Troca e Devolução
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
          <div className="bg-white w-full max-w-lg rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-xs font-bold uppercase tracking-widest text-black">Política de Segurança</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-black font-bold text-lg">✕</button>
            </div>
            <div className="p-6 overflow-y-auto text-xs text-gray-700 space-y-3 leading-relaxed text-justify">
               {/* [Mantenha o seu texto de termos aqui] */}
            </div>
            <div className="p-4 border-t bg-gray-50 text-right">
              <button onClick={() => setIsOpen(false)} className="bg-black text-white text-[10px] font-bold px-6 py-2.5 uppercase hover:bg-zinc-800">Entendido</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}