import Catalog from '@/components/Catalog';
import FloatingActions from '@/components/FloatingActions';
import FloatingCart from '@/components/FloatingCart';
import FloatingFavorites from '@/components/FloatingFavorites';
import Footer from '@/components/Footer';
import { getProducts } from '@/lib/products';

export default async function Home() {
  const products = await getProducts();

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col">
      {/* Container principal que empurra o conteúdo */}
      <div className="flex-1">
        <Catalog initialProducts={products} />
        
        {/* Botões flutuantes */}
        <FloatingActions />
        
        {/* Painéis laterais */}
        <FloatingCart />
        <FloatingFavorites />
      </div>

      {/* O rodapé agora é forçado a aparecer no final da página */}
      <Footer />
    </main>
  );
}