import { getProducts } from '@/lib/products';
import Image from 'next/image';
import Link from 'next/link';

type PageParams = Promise<{ id: string }>;

export default async function ProductPage(props: { params: PageParams }) {
  const params = await props.params;
  const { id } = params;

  const products = await getProducts();
  const product = products.find((p) => p.id === id || p.nome === id);

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-xl font-bold mb-4">Produto não encontrado</h1>
        <Link href="/" className="text-xs uppercase font-bold underline">Voltar para o catálogo</Link>
      </div>
    );
  }

  return (
    <main className="max-w-7xl mx-auto px-4 py-12">
      <Link href="/" className="text-xs uppercase font-bold text-gray-500 hover:text-black mb-8 inline-block">
        &larr; Voltar ao Início
      </Link>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div className="relative w-full h-[400px] bg-gray-50 flex items-center justify-center">
          {product.imagem ? (
            <Image src={`/produtos/${product.imagem}`} alt={product.nome} fill className="object-contain p-4" />
          ) : (
            <span>Sem foto</span>
          )}
        </div>
        
        <div className="flex flex-col justify-center">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">{product.marca || product.categoria}</span>
          <h1 className="text-2xl font-black text-black uppercase mb-4">{product.nome}</h1>
          <span className="text-xl font-bold text-black mb-6">
            R$ {Number(product.preco || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
          <p className="text-sm text-gray-600 mb-6">{product.descricao_completa}</p>
        </div>
      </div>
    </main>
  );
}