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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const phone = e.target.value;
    setCustomerPhone(phone);

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length >= 8) {
      const savedData = localStorage.getItem(`client_${cleanPhone}`);
      if (savedData) {
        try {
          const parsed = JSON.parse(savedData);
          setCustomerName(parsed.name || '');
        } catch (err) {
          console.error("Erro ao recuperar dados salvos", err);
        }
      }
    }
  };

  const getInfinitePayRate = (installments: number) => {
    switch (installments) {
      case 1: return 0.0420;
      case 2: return 0.0609;
      case 3: return 0.0701;
      case 4: return 0.0791;
      case 5: return 0.0880;
      case 6: return 0.0967;
      case 7: return 0.1259;
      case 8: return 0.1342;
      case 9: return 0.1425;
      case 10: return 0.1506;
      case 11: return 0.1587;
      case 12: return 0.1666;
      default: return 0.0420;
    }
  };

  const totalProducts = items.reduce((acc: number, item: any) => {
    const qty = item.quantity || item.amount || 1;
    return acc + (Number(item.preco) * qty);
  }, 0);

  const baseTotal = totalProducts; 
  
  const taxRate = (step === 'checkout' && paymentMethod === 'credit') ? getInfinitePayRate(selectedInstallment) : 0;
  const simulatedTotalWithTax = taxRate > 0 ? (totalProducts / (1 - taxRate)) : baseTotal;
  const installmentValue = (step === 'checkout' && paymentMethod === 'credit' && selectedInstallment > 1) 
    ? simulatedTotalWithTax / selectedInstallment 
    : simulatedTotalWithTax;

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const telefoneLoja = "5511992465042"; 

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
    if (!customerName || !customerPhone) {
      alert("Por favor, preencha seus dados de Nome e Telefone.");
      return;
    }

    setIsProcessing(true);
    try {
      const cleanPhone = customerPhone.replace(/\D/g, '');
      if (cleanPhone) {
        localStorage.setItem(`client_${cleanPhone}`, JSON.stringify({
          name: customerName,
          phone: customerPhone
        }));
      }

      const orderNumber = generateOrderNumber();
      const itemsToPay = items.map((item: any) => ({
        nome: item.nome,
        quantity: item.quantity || item.amount || 1,
        preco: Number(item.preco) 
      }));

      let paymentUrl = "";
      try {
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            items: itemsToPay,
            customer: { name: customerName, phone: customerPhone, email: "cliente@vascarinbeauty.com" }
          })
        });
        const data = await response.json();
        paymentUrl = data.url || "";
      } catch (e) {
        console.error("Erro ao gerar link:", e);
      }

      let message = `✨ NOVO PEDIDO #VASC-${orderNumber} ✨\n\n`;
      message += "━━━━━━━━━━━━━━━━━━━━━\n";
      message += "👤 DADOS DO CLIENTE\n";
      message += `• Nome: ${customerName}\n`;
      message += `• Telefone: ${customerPhone}\n`;
      message += "━━━━━━━━━━━━━━━━━━━━━\n\n";

      message += "🛒 ITENS SELECIONADOS\n";
      items.forEach((item: any) => {
        const qty = item.quantity || item.amount || 1;
        message += `• ${qty}x ${item.nome} — ${formatPrice(Number(item.preco) * qty)}\n`;
      });
      
      message += "\n⏱️ Prazo de envio/entrega: De 2 a 3 dias úteis após a confirmação do pagamento.\n";
      message += "━━━━━━━━━━━━━━━━━━━━━\n";
      message += `💰 TOTAL DO PEDIDO: *${formatPrice(baseTotal)}*\n`;

      if (paymentMethod === 'credit' && selectedInstallment > 1) {
        message += `💳 Simulação no Cartão: ${selectedInstallment}x de ${formatPrice(installmentValue)} (Total com taxas: ${formatPrice(simulatedTotalWithTax)})\n`;
      }

      if (paymentUrl) {
        message += `\n🔗 Link de Pagamento Seguro (InfinitePay):\n${paymentUrl}\n`;
      }
      
      message += "\n⚠️ ATENÇÃO: Por favor, não se esqueça de realizar o pagamento pelo link acima. Caso contrário, o pedido será desconsiderado.\n";
      message += "━━━━━━━━━━━━━━━━━━━━━";

      const encodedMessage = encodeURIComponent(message);
      window.open(`https://wa.me/${telefoneLoja}?text=${encodedMessage}`, '_blank');

      if (paymentUrl) {
        setTimeout(() => {
          window.location.href = paymentUrl;
        }, 1000);
      } else {
        alert(`Pedido #${orderNumber} gerado! Conclua o atendimento pelo WhatsApp.`);
      }

    } catch (error) {
      alert("Erro ao processar. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isMounted) return null;
  if (!isOpen) return null;

  const totalItemsCount = items.reduce((acc: number, item: any) => acc + (item.quantity || item.amount || 1), 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-sm font-black uppercase tracking-wider text-black">
            Sua Sacola ({totalItemsCount})
          </h2>
          <button onClick={toggleCart} className="text-gray-400 hover:text-black transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {items.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <p className="text-gray-400 text-sm mb-4">Sua sacola está vazia.</p>
              <button onClick={toggleCart} className="bg-black text-white text-xs font-bold uppercase px-6 py-3 hover:bg-[#b90000] transition-colors">
                Escolher Perfumes
              </button>
            </div>
          ) : (
            <>
              {step === 'cart' ? (
                <div className="flex flex-col gap-4">
                  {items.map((item: any, index: number) => {
                    const qty = item.quantity || item.amount || 1;
                    let imageSrc = "";
                    const semImagem = !item.imagem || String(item.imagem).includes('default-image');
                    if (!semImagem) {
                      let rawPath = String(item.imagem).replace(/[\r\n]+/g, '').trim();
                      if (rawPath.startsWith('/produtos/')) rawPath = rawPath.replace('/produtos/', '');
                      else if (rawPath.startsWith('produtos/')) rawPath = rawPath.replace('produtos/', '');
                      const hasExtension = /\.(png|jpe?g|webp)$/i.test(rawPath);
                      imageSrc = encodeURI(`/produtos/${rawPath}${hasExtension ? '' : '.png'}`);
                    }

                    return (
                      <div key={`${item.id || item.nome}-${index}`} className="flex gap-4 items-center border-b border-gray-100 pb-4">
                        <div className="relative w-16 h-16 bg-gray-50 flex-shrink-0 border border-gray-100">
                          {imageSrc && <Image src={imageSrc} alt={item.nome} fill unoptimized className="object-contain p-1" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold text-gray-800 truncate">{item.nome}</h4>
                          <span className="text-xs font-bold text-black mt-1 block">{formatPrice(Number(item.preco))}</span>
                          
                          <div className="flex items-center gap-3 mt-2">
                            <div className="flex items-center border border-gray-200">
                              <button onClick={() => updateQuantity(item.id || item.nome, qty - 1)} className="px-2 py-0.5 text-gray-500 hover:bg-gray-100">-</button>
                              <span className="px-2 text-xs font-bold">{qty}</span>
                              <button onClick={() => updateQuantity(item.id || item.nome, qty + 1)} className="px-2 py-0.5 text-gray-500 hover:bg-gray-100">+</button>
                            </div>
                            <button onClick={() => removeItem(item.id || item.nome)} className="text-[10px] uppercase font-bold text-red-500 hover:underline">
                              Remover
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col gap-5">
                  
                  <div className="flex flex-col gap-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">Seus Dados</h3>
                    <input 
                      type="text" 
                      placeholder="Telefone" 
                      value={customerPhone}
                      onChange={handlePhoneChange}
                      className="w-full border border-gray-200 p-2.5 text-xs text-black focus:outline-none focus:border-black"
                    />
                    <input 
                      type="text" 
                      placeholder="Nome Completo" 
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full border border-gray-200 p-2.5 text-xs text-black focus:outline-none focus:border-black"
                    />
                  </div>

                  <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center gap-2 rounded">
                    <span>📦 Prazo de envio/entrega: De 2 a 3 dias úteis após a confirmação do pagamento.</span>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Forma de Pagamento</h3>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <button 
                        type="button"
                        onClick={() => setPaymentMethod('pix')}
                        className={`p-2.5 text-xs font-bold uppercase border transition-colors ${paymentMethod === 'pix' ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-700 bg-white'}`}
                      >
                        PIX
                      </button>
                      <button 
                        type="button"
                        onClick={() => setPaymentMethod('credit')}
                        className={`p-3 text-xs font-bold uppercase border transition-colors ${paymentMethod === 'credit' ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-700 bg-white'}`}
                      >
                        Cartão
                      </button>
                    </div>

                    {paymentMethod === 'credit' && (
                      <div className="mt-1">
                        <select 
                          value={selectedInstallment} 
                          onChange={(e) => setSelectedInstallment(Number(e.target.value))}
                          className="w-full border border-gray-200 p-2.5 text-xs font-bold text-black bg-white focus:outline-none focus:border-black"
                        >
                          <option value={1}>1x de {formatPrice((totalProducts / (1 - 0.0420)))} (Taxa 4,20%)</option>
                          <option value={2}>2x de {formatPrice(((totalProducts / (1 - 0.0609))) / 2)} (Taxa 6,09%)</option>
                          <option value={3}>3x de {formatPrice(((totalProducts / (1 - 0.0701))) / 3)} (Taxa 7,01%)</option>
                          <option value={4}>4x de {formatPrice(((totalProducts / (1 - 0.0791))) / 4)} (Taxa 7,91%)</option>
                          <option value={5}>5x de {formatPrice(((totalProducts / (1 - 0.0880))) / 5)} (Taxa 8,80%)</option>
                          <option value={6}>6x de {formatPrice(((totalProducts / (1 - 0.0967))) / 6)} (Taxa 9,67%)</option>
                          <option value={7}>7x de {formatPrice(((totalProducts / (1 - 0.1259))) / 7)} (Taxa 12,59%)</option>
                          <option value={8}>8x de {formatPrice(((totalProducts / (1 - 0.1342))) / 8)} (Taxa 13,42%)</option>
                          <option value={9}>9x de {formatPrice(((totalProducts / (1 - 0.1425))) / 9)} (Taxa 14,25%)</option>
                          <option value={10}>10x de {formatPrice(((totalProducts / (1 - 0.1506))) / 10)} (Taxa 15,06%)</option>
                          <option value={11}>11x de {formatPrice(((totalProducts / (1 - 0.1587))) / 11)} (Taxa 15,87%)</option>
                          <option value={12}>12x de {formatPrice(((totalProducts / (1 - 0.1666))) / 12)} (Taxa 16,66%)</option>
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="p-4 bg-gray-50 border border-gray-200 rounded flex items-start gap-3 mt-2">
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
            </>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col gap-3">
            
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium">
                {paymentMethod === 'credit' && step === 'checkout' ? 'Total (com taxas):' : 'Total Base:'}
              </span>
              <span className="text-lg font-black text-black">
                {formatPrice(step === 'checkout' ? simulatedTotalWithTax : baseTotal)}
              </span>
            </div>

            {step === 'cart' ? (
              <button 
                onClick={() => setStep('checkout')} 
                className="w-full bg-black text-white text-xs font-bold uppercase py-4 hover:bg-[#b90000] transition-colors"
              >
                Avançar para Identificação e Pagamento
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                
                <button 
                  onClick={handleCheckoutUnificado} 
                  disabled={isProcessing || !hasAcceptedTerms}
                  className="w-full bg-black text-white text-xs font-bold uppercase py-4 hover:bg-[#b90000] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? "GERANDO PAGAMENTO..." : "IR PARA PAGAMENTO"}
                </button>

                <button 
                  onClick={() => setStep('cart')} 
                  className="w-full text-gray-500 text-[10px] font-bold uppercase py-2 hover:text-black transition-colors"
                >
                  Voltar para sacola
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}