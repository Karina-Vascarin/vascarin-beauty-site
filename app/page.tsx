import Catalog from '@/components/Catalog';
import FloatingActions from '@/components/FloatingActions';
import FloatingCart from '@/components/FloatingCart';
import FloatingFavorites from '@/components/FloatingFavorites';
import Footer from '@/components/Footer';
import { getProducts } from '@/lib/products';

export default async function Home() {
  const products = await getProducts();

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 relative flex flex-col justify-between">
      <div>
        <Catalog initialProducts={products} />
        
        {/* Botões flutuantes no canto da tela */}
        <FloatingActions />
        
        {/* Painéis laterais da sacola e favoritos (controlados pelo Zustand) */}
        <FloatingCart />
        <FloatingFavorites />
      </div>

      {/* Rodapé fixo com a política de trocas, devoluções e pop-up */}
      <Footer />
    </main>
  );
}