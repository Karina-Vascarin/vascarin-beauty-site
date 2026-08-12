import Catalog from '@/components/Catalog';
import FloatingActions from '@/components/FloatingActions';
import FloatingCart from '@/components/FloatingCart';
import FloatingFavorites from '@/components/FloatingFavorites';
import Footer from '@/components/Footer';
import { getProducts } from '@/lib/products';

export default async function Home() {
  const products = await getProducts();

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col pb-20"> 
      {/* O pb-20 adiciona um espaço no final da página para o Footer fixo não cobrir o conteúdo */}
      <div className="flex-1">
        <Catalog initialProducts={products} />
        
        <FloatingActions />
        <FloatingCart />
        <FloatingFavorites />
      </div>

      <Footer />
    </main>
  );
}