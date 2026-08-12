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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-2xl rounded shadow-2xl max-h-[80vh] flex flex-col">
            <div className="p-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-black">Política de Trocas, Devoluções e Inviolabilidade</h3>
              <button onClick={() => setIsOpen(false)} className="text-gray-500 hover:text-black font-bold text-xl">×</button>
            </div>
            
            <div className="p-6 overflow-y-auto text-[11px] text-gray-700 space-y-4 leading-relaxed text-justify">
              <p><strong>1. DA INVIOLABILIDADE:</strong> A Vascarin Beauty preza pela integridade sanitária dos produtos comercializados. Perfumes e cosméticos são itens de uso pessoal e íntimo.</p>
              <p><strong>2. PERFUMES COM CELOFANE:</strong> Aceitamos a devolução apenas de produtos cujas embalagens externas (celofane/plástico) não tenham sido violadas, rasgadas ou abertas.</p>
              <p><strong>3. PRODUTOS SEM LACRE EXTERNO (BODY SPLASH E CREMES):</strong> Body splashes e cremes que não possuem lacre plástico devem ser devolvidos rigorosamente sem indícios de uso. O produto deve apresentar peso, volume e consistência originais.</p>
              <p><strong>4. PRODUTOS VIOLADOS OU TESTADOS:</strong> É terminantemente proibida a troca ou devolução de qualquer item que apresente sinais de teste, uso ou cuja embalagem tenha sido danificada pelo consumidor.</p>
              <p><strong>5. DO ARREPENDIMENTO E DEFEITO:</strong> Prazo legal de 7 dias para arrependimento, mediante preservação total do lacre. Defeitos de fabricação devem ser reportados com evidências (vídeos/fotos) no ato do recebimento.</p>
              <p><strong>6. REENVIO:</strong> A Vascarin Beauty se reserva o direito de não aceitar a devolução de itens que não cumpram estes critérios, sendo o custo de reenvio ao consumidor de responsabilidade deste último.</p>
            </div>

            <div className="p-4 border-t flex justify-end">
              <button onClick={() => setIsOpen(false)} className="bg-black text-white text-[10px] font-bold px-6 py-2 uppercase hover:bg-zinc-800">Fechar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}