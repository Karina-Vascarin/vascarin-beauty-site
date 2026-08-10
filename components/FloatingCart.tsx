"use client";

import { useCartStore } from '@/store/cart';
import { useState } from 'react';
import Image from 'next/image';

export default function FloatingCart() {
  const cartStore = useCartStore() as any;
  const items = cartStore.items || [];
  const isOpen = cartStore.isOpen;
  const toggleCart = cartStore.toggleCart;
  const removeItem = cartStore.removeItem;
  const updateQuantity = cartStore.updateQuantity || cartStore.updateAmount || (() => {});

  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'credit'>('pix');
  const [selectedInstallment, setSelectedInstallment] = useState<number>(1);
  const [deliveryOption, setDeliveryOption] = useState<'fixed' | 'combine'>('fixed');
  const [step, setStep] = useState<'cart' | 'checkout'>('cart');

  // Taxas oficiais exatas da InfinitePay
  const getInfinitePayRate = (installments: number) => {
    switch (installments) {
      case 1: return 0.0420; // 4.20%
      case 2: return 0.0609; // 6.09%
      case 3: return 0.0701; // 7.01%
      case 4: return 0.0791; // 7.91%
      case 5: return 0.0880; // 8.80%
      case 6: return 0.0967; // 9.67%
      default: return 0.0420;
    }
  };

  // 1. Subtotais puros dos produtos
  const totalProducts = items.reduce((acc: number, item: any) => {
    const qty = item.quantity || item.amount || 1;
    return acc + (Number(item.preco) * qty);
  }, 0);

  // 2. Frete só é somado no checkout
  const deliveryFee = step === 'checkout' ? (deliveryOption === 'fixed' ? 15.00 : 0) : 0;
  
  // 3. Taxa da InfinitePay só é aplicada no checkout se escolher crédito
  const taxRate = (step === 'checkout' && paymentMethod === 'credit') ? getInfinitePayRate(selectedInstallment) : 0;
  const subtotalWithTax = taxRate > 0 ? (totalProducts / (1 - taxRate)) : totalProducts;
  
  const finalTotal = subtotalWithTax + deliveryFee;
  const installmentValue = (step === 'checkout' && paymentMethod === 'credit' && selectedInstallment > 1) 
    ? finalTotal / selectedInstallment 
    : finalTotal;

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  };

  const telefoneLoja = "5511999999999"; // Substitua pelo seu WhatsApp

  const handleCheckoutWhatsApp = () => {
    let message = `*Novo Pedido - Vascarin Beauty*\n\n`;
    items.forEach((item: any) => {
      const qty = item.quantity || item.amount || 1;
      message += `• ${qty}x ${item.nome} - ${formatPrice(Number(item.preco) * qty)}\n`;
    });
    
    const pagInfo = paymentMethod === 'pix' ? 'PIX' : `Cartão de Crédito (${selectedInstallment}x de ${formatPrice(installmentValue)})`;
    message += `\n*Pagamento (InfinitePay):* ${pagInfo}`;
    message += `\n*Frete:* ${deliveryOption === 'fixed' ? 'Fixo (R$ 15,00)' : 'A combinar'}`;
    message += `\n\n*Total Geral:* *${formatPrice(finalTotal)}*`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${telefoneLoja}?text=${encodedMessage}`, '_blank');
  };

  if (!isOpen) return null;

  const totalItemsCount = items.reduce((acc: number, item: any) => acc + (item.quantity || item.amount || 1), 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm transition-opacity">
      <div className="w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
        
        {/* CABEÇALHO */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h2 className="text-sm font-black uppercase tracking-wider text-black">
            Sua Sacola ({totalItemsCount})
          </h2>
          <button onClick={toggleCart} className="text-gray-400 hover:text-black transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>

        {/* CONTEÚDO */}
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
                <div className="flex flex-col gap-6">
                  {/* OPÇÕES DE PAGAMENTO INFINITEPAY */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Forma de Pagamento (InfinitePay)</h3>
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <button 
                        type="button"
                        onClick={() => setPaymentMethod('pix')}
                        className={`p-3 text-xs font-bold uppercase border transition-colors ${paymentMethod === 'pix' ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-700 bg-white'}`}
                      >
                        PIX
                      </button>
                      <button 
                        type="button"
                        onClick={() => setPaymentMethod('credit')}
                        className={`p-3 text-xs font-bold uppercase border transition-colors ${paymentMethod === 'credit' ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-700 bg-white'}`}
                      >
                        Cartão de Crédito
                      </button>
                    </div>

                    {paymentMethod === 'credit' && (
                      <div className="mt-2">
                        <label className="text-[11px] font-bold text-gray-500 uppercase block mb-1">Parcelamento:</label>
                        <select 
                          value={selectedInstallment} 
                          onChange={(e) => setSelectedInstallment(Number(e.target.value))}
                          className="w-full border border-gray-200 p-3 text-sm font-bold text-black bg-white focus:outline-none focus:border-black"
                        >
                          <option value={1}>1x de {formatPrice((totalProducts / (1 - 0.0420)) + (deliveryOption === 'fixed' ? 15 : 0))} (À vista - Taxa 4,20%)</option>
                          <option value={2}>2x de {formatPrice(((totalProducts / (1 - 0.0609)) + (deliveryOption === 'fixed' ? 15 : 0)) / 2)} (Taxa 6,09%)</option>
                          <option value={3}>3x de {formatPrice(((totalProducts / (1 - 0.0701)) + (deliveryOption === 'fixed' ? 15 : 0)) / 3)} (Taxa 7,01%)</option>
                          <option value={4}>4x de {formatPrice(((totalProducts / (1 - 0.0791)) + (deliveryOption === 'fixed' ? 15 : 0)) / 4)} (Taxa 7,91%)</option>
                          <option value={5}>5x de {formatPrice(((totalProducts / (1 - 0.0880)) + (deliveryOption === 'fixed' ? 15 : 0)) / 5)} (Taxa 8,80%)</option>
                          <option value={6}>6x de {formatPrice(((totalProducts / (1 - 0.0967)) + (deliveryOption === 'fixed' ? 15 : 0)) / 6)} (Taxa 9,67%)</option>
                        </select>
                      </div>
                    )}
                  </div>

                  {/* ESCOLHA DE FRETE */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-3">Opção de Entrega</h3>
                    <div className="flex flex-col gap-2">
                      <label className={`flex items-center justify-between border p-3 cursor-pointer transition-colors ${deliveryOption === 'fixed' ? 'border-black bg-gray-50 font-bold' : 'border-gray-200'}`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" name="delivery" checked={deliveryOption === 'fixed'} onChange={() => setDeliveryOption('fixed')} />
                          <span className="text-xs">Frete Fixo</span>
                        </div>
                        <span className="text-xs font-bold">R$ 15,00</span>
                      </label>

                      <label className={`flex items-center justify-between border p-3 cursor-pointer transition-colors ${deliveryOption === 'combine' ? 'border-black bg-gray-50 font-bold' : 'border-gray-200'}`}>
                        <div className="flex items-center gap-3">
                          <input type="radio" name="delivery" checked={deliveryOption === 'combine'} onChange={() => setDeliveryOption('combine')} />
                          <span className="text-xs">A combinar / Retirada</span>
                        </div>
                        <span className="text-xs font-bold">Grátis</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* RODAPÉ DO CARRINHO */}
        {items.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-gray-50 flex flex-col gap-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-500 font-medium">Total:</span>
              <span className="text-lg font-black text-black">{formatPrice(finalTotal)}</span>
            </div>
            
            {step === 'checkout' && paymentMethod === 'credit' && selectedInstallment > 1 && (
              <div className="text-[11px] font-bold text-gray-600 uppercase text-center bg-white p-2 border border-gray-200">
                Parcelado em {selectedInstallment}x de {formatPrice(installmentValue)}
              </div>
            )}

            {step === 'cart' ? (
              <button 
                onClick={() => setStep('checkout')} 
                className="w-full bg-black text-white text-xs font-bold uppercase py-4 hover:bg-[#b90000] transition-colors"
              >
                Avançar para Entrega e Pagamento
              </button>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={() => setStep('cart')} 
                  className="w-1/3 bg-gray-200 text-black text-xs font-bold uppercase py-4 hover:bg-gray-300 transition-colors"
                >
                  Voltar
                </button>
                <button 
                  onClick={handleCheckoutWhatsApp} 
                  className="w-2/3 bg-green-600 text-white text-xs font-bold uppercase py-4 hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                >
                  Enviar Pedido WhatsApp
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}