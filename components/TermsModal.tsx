"use client";

import { useState } from 'react';

export default function TermsModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Link que o cliente clica para abrir os termos */}
      <button 
        onClick={() => setIsOpen(true)} 
        className="text-gray-500 hover:text-black underline text-xs transition-colors cursor-pointer"
      >
        Política de Trocas, Devoluções e Segurança
      </button>

      {/* Janela Pop-up */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-xl rounded-lg shadow-2xl overflow-hidden relative flex flex-col max-h-[85vh]">
            
            {/* Cabeçalho do Pop-up */}
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-black">
                Política de Trocas, Devoluções e Lacres
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-black text-lg font-bold w-7 h-7 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
              >
                &times;
              </button>
            </div>

            {/* Conteúdo dos Termos */}
            <div className="p-6 overflow-y-auto text-xs text-gray-600 leading-relaxed flex flex-col gap-4">
              <p>
                Na <strong>Vascarin Beauty</strong>, prezamos pela qualidade e segurança de todos os produtos enviados. Como trabalhamos com itens de perfumaria e cosméticos, seguimos rigorosos padrões de higiene.
              </p>

              <div className="flex flex-col gap-1">
                <strong className="text-black uppercase text-[11px]">1. Embalagens e Lacres Invioláveis</strong>
                <p>• <strong>Perfumes com celofane (plástico externo):</strong> Só serão aceitos para devolução se o lacre plástico original estiver totalmente inviolado, sem cortes, rasgos ou sinais de abertura.</p>
                <p>• <strong>Body Splash e itens sem plástico:</strong> Devem estar rigorosamente sem nenhum sinal de uso, borrifadas ou violação.</p>
                <p>• <strong>Cremes e Loções:</strong> Itens sem lacre interno de alumínio ainda assim <strong>não poderão ter sido testados ou usados</strong>.</p>
              </div>

              <div className="flex flex-col gap-1">
                <strong className="text-black uppercase text-[11px]">2. Produtos Usados ou Violados</strong>
                <p>Conforme o Código de Defesa do Consumidor e normas sanitárias para cosméticos, <strong>não realizamos trocas ou estornos de produtos que já tenham sido experimentados, testados, usados ou que estejam com os lacres rompidos</strong>.</p>
              </div>

              <div className="flex flex-col gap-1">
                <strong className="text-black uppercase text-[11px]">3. Defeitos ou Avarias</strong>
                <p>Caso receba algum item com avaria de transporte ou defeito comprovado, entre em contato pelo nosso WhatsApp oficial em até 7 dias corridos após o recebimento.</p>
              </div>
            </div>

            {/* Rodapé do Pop-up */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setIsOpen(false)}
                className="bg-black text-white text-xs font-bold uppercase px-6 py-2.5 hover:bg-zinc-800 transition-colors"
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