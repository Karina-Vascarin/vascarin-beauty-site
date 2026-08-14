import { Suspense } from 'react';
import Catalog from '@/components/Catalog';
import FloatingActions from '@/components/FloatingActions';
import FloatingCart from '@/components/FloatingCart';
import FloatingFavorites from '@/components/FloatingFavorites';
import Footer from '@/components/Footer';
import { getProducts } from '@/lib/products';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const products = await getProducts();

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col pb-20"> 
      <div className="flex-1">
        <Suspense fallback={<div className="text-center py-20 text-xs text-gray-400">Carregando catálogo...</div>}>
          <Catalog initialProducts={products} />
        </Suspense>
        
        <FloatingActions />
        <FloatingCart />
        <FloatingFavorites />
      </div>

      <Footer />
    </main>
  );
}