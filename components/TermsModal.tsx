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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-xl rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Cabeçalho */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-black">
                Política de Trocas, Devoluções e Lacres
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-black font-bold text-base w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Conteúdo Rigoroso */}
            <div className="p-6 overflow-y-auto text-xs text-gray-700 space-y-3 leading-relaxed text-justify">
              <p><strong>1. DA INVIOLABILIDADE:</strong> A Vascarin Beauty preza pela integridade sanitária dos produtos comercializados. Perfumes e cosméticos são itens de uso pessoal e íntimo.</p>
              <p><strong>2. PERFUMES COM CELOFANE:</strong> Aceitamos a devolução apenas de produtos cujas embalagens externas (celofane/plástico) não tenham sido violadas, rasgadas ou abertas.</p>
              <p><strong>3. PRODUTOS SEM LACRE EXTERNO (BODY SPLASH E CREMES):</strong> Body splashes e cremes que não possuem lacre plástico devem ser devolvidos rigorosamente sem indícios de uso. O produto deve apresentar peso, volume e consistência originais.</p>
              <p><strong>4. PRODUTOS VIOLADOS OU TESTADOS:</strong> É terminantemente proibida a troca ou devolução de qualquer item que apresente sinais de teste, uso ou cuja embalagem tenha sido danificada pelo consumidor.</p>
              <p><strong>5. DO ARREPENDIMENTO E DEFEITO:</strong> Prazo legal de 7 dias para arrependimento, mediante preservação total do lacre. Defeitos de fabricação devem ser reportados com evidências (vídeos/fotos) no ato do recebimento.</p>
              <p><strong>6. REENVIO:</strong> A Vascarin Beauty se reserva o direito de não aceitar a devolução de itens que não cumpram estes critérios, sendo o custo de reenvio ao consumidor de responsabilidade deste último.</p>
            </div>

            {/* Rodapé do Modal */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setIsOpen(false)} 
                className="bg-black text-white text-xs font-bold px-6 py-2.5 uppercase hover:bg-zinc-800 transition-colors"
              >
                Entendido
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
}