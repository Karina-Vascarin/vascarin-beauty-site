import { Suspense } from 'react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-center">
      <h1 className="text-4xl font-black uppercase tracking-widest text-black mb-2">404</h1>
      <p className="text-xs text-gray-500 uppercase tracking-wider mb-6">Página não encontrada na Vascarin Beauty</p>
      <Suspense fallback={null}>
        <Link 
          href="/"
          className="bg-black text-white text-[10px] font-bold uppercase px-6 py-3 rounded-full hover:bg-zinc-800 transition-colors"
        >
          Voltar para a Loja
        </Link>
      </Suspense>
    </main>
  );
}