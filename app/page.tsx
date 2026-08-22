/* 
======================================================================
CÓDIGO ORIGINAL DA LOJA (GUARDADO PARA QUANDO A MANUTENÇÃO ACABAR)
======================================================================

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
*/

// ======================================================================
// TELA DE MANUTENÇÃO ATIVA
// ======================================================================

export default function Home() {
  return (
    <main style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', fontFamily: 'sans-serif', textAlign: 'center', padding: '20px', backgroundColor: '#f9fafb', color: '#18181b' }}>
      
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', fontWeight: 'bold' }}>
        Vascarin Beauty 🚧
      </h1>
      
      <p style={{ maxWidth: '600px', fontSize: '1.125rem', lineHeight: '1.6', marginBottom: '1rem', color: '#52525b' }}>
        Estamos atualizando nosso catálogo!
      </p>
      
      <p style={{ maxWidth: '600px', fontSize: '1.125rem', lineHeight: '1.6', marginBottom: '2.5rem', color: '#52525b' }}>
        O site volta em breve. Enquanto preparamos as novidades, você pode continuar fazendo suas encomendas normalmente pelo nosso atendimento:
      </p>
      
      <a 
        href="https://wa.me/5511992465042" 
        target="_blank" 
        rel="noopener noreferrer"
        style={{ padding: '14px 28px', backgroundColor: '#25D366', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.125rem', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
      >
        Fazer Encomenda no WhatsApp
      </a>

    </main>
  );
}