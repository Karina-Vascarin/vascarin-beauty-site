"use client";

import { Product } from '@/lib/products';
import { useCartStore } from '@/store/cart';

interface AddToCartButtonProps {
  product: Product;
}

export default function AddToCartButton({ product }: AddToCartButtonProps) {
  // Puxa a função de adicionar item do gerenciador do carrinho
  const addItem = useCartStore((state) => state.addItem);

  return (
    <button 
      onClick={() => addItem(product)}
      className="w-full bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-zinc-100 dark:hover:bg-zinc-200 dark:text-zinc-900 py-4 rounded-md uppercase tracking-widest text-sm transition-colors font-medium mt-4"
    >
      Adicionar ao Carrinho
    </button>
  );
}