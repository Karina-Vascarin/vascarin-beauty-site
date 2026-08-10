import Image from 'next/image';
import Link from 'next/link';

export default function Header() {
  return (
    <header className="w-full bg-white border-b border-gray-200 py-3 px-6 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-6">
        
        {/* Logo alinhado no canto esquerdo */}
        <Link href="/" className="flex items-center shrink-0">
          <Image 
            src="/logo/logo_site.png" 
            alt="Vascarin Beauty" 
            width={160} 
            height={55} 
            priority
            className="object-contain h-10 w-auto"
          />
        </Link>

        {/* Espaço para barra de busca / elementos do topo se houver */}
        <div className="flex-1 max-w-xl hidden md:block">
          {/* Opcional: barra de busca global do header */}
        </div>

      </div>
    </header>
  );
}