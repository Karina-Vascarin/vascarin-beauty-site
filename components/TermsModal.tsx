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
          <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            
            {/* Cabeçalho */}
            <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-xs font-bold uppercase tracking-wider text-black">
                Política de Trocas e Devoluções – Vascarin Beauty
              </h3>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-black font-bold text-base w-7 h-7 flex items-center justify-center rounded-full bg-gray-200 transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Conteúdo */}
            <div className="p-6 overflow-y-auto text-xs text-gray-800 space-y-4 leading-relaxed text-justify">
              <p>
                A <strong>Vascarin Beauty</strong> preza pela transparência, qualidade e respeito aos nossos clientes. Nossa política de trocas e devoluções foi desenvolvida com base na legislação vigente e em entendimentos jurídicos recentes que asseguram o equilíbrio nas relações de consumo virtuais.
              </p>

              <div>
                <strong className="text-black block mb-1">1. Condições Gerais para Devolução por Arrependimento</strong>
                <p>Conforme o Código de Defesa do Consumidor, o cliente possui o prazo de até 7 (sete) dias corridos, contados a partir da data de recebimento do produto, para manifestar o arrependimento de compras realizadas pela internet.</p>
                <p className="mt-1">No entanto, o direito de arrependimento não confere ao consumidor a prerrogativa de teste ou uso do produto, servindo exclusivamente para a reflexão sobre a aquisição à distância.</p>
              </div>

              <div>
                <strong className="text-black block mb-1">2. Requisitos Obrigatórios para Aceitação de Devolução</strong>
                <p>Para que a devolução de qualquer item seja aceita e o reembolso processado, o produto deve obrigatoriamente atender aos seguintes critérios:</p>
                <p className="mt-1">• <strong>Perfumes Importados e Nacionais:</strong> Devem estar estritamente lacrados, na embalagem original intacta, com o invólucro de plástico (cellophane) original sem nenhuma violação, sem sinais de uso, borrifação ou manuseio. Perfumes com lacre rompido, caixa amassada por mau uso ou abertos não serão aceitos para devolução ou troca.</p>
                <p className="mt-1">• <strong>Body Splashes e Cremes (Itens sem lacre plástico externo):</strong> Devem retornar na embalagem original, perfeitamente lacrados de fábrica (quando aplicável), sem indícios de abertura, violação ou teste de uso. Produtos de higiene e cosméticos cujo lacre interno ou externo tenha sido violado tornam inviável a sua revenda e, portanto, não são passíveis de devolução por simples insatisfação.</p>
                <p className="mt-2 bg-gray-50 p-3 border-l-2 border-black text-[11px]">
                  <strong>Aviso Importante:</strong> Conforme jurisprudência aplicável ao comércio eletrônico, o ato de romper o lacre de um produto cosmético/perfumaria descaracteriza a sua condição de novo, equiparando-se ao uso e inviabilizando o retorno do bem ao estoque para comercialização subsequente. Compras &quot;às cegas&quot; não justificam a quebra de lacres para teste. Recomendamos a aquisição prévia de decantes ou amostras quando houver dúvida sobre a fragrância.
                </p>
              </div>

              <div>
                <strong className="text-black block mb-1">3. Produtos com Defeito ou Avariados</strong>
                <p>Caso você receba um produto que apresente avaria de transporte, embalagem violada antes da entrega ou defeito de fabricação:</p>
                <p className="mt-1">• A ocorrência deve ser comunicada à nossa central de atendimento em até 7 (sete) dias corridos após o recebimento.</p>
                <p className="mt-1">• O produto passará por uma análise técnica para verificação do problema relatado. Constatado o defeito, a Vascarin Beauty providenciará a substituição do item ou o reembolso integral dos valores pagos.</p>
              </div>

              <div>
                <strong className="text-black block mb-1">4. Como Solicitar a Devolução</strong>
                <p>Para iniciar o processo de devolução dentro do prazo legal e elegível:</p>
                <p className="mt-1">• Entre em contato conosco pelos canais oficiais de atendimento da Vascarin Beauty informando o número do pedido e o motivo da solicitação.</p>
                <p className="mt-1">• Enviei fotos nítidas do produto mostrando que ele se encontra totalmente lacrado e na embalagem original.</p>
                <p className="mt-1">• Nossa equipe fornecerá as instruções de postagem reversa.</p>
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button 
                onClick={() => setIsOpen(false)} 
                className="bg-black text-white text-xs font-bold px-6 py-2.5 uppercase hover:bg-zinc-800 transition-colors cursor-pointer"
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