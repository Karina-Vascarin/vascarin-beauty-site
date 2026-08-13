import './globals.css';
import Header from '@/components/Header'; // Importe o componente do cabeçalho
import AuthModal from '@/components/AuthModal';

export const metadata = {
  title: 'Vascarin Beauty',
  description: 'Sua loja de perfumes e cosméticos',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <Header /> {/* O logo e o cabeçalho vão renderizar aqui */}
        {children}
      </body>
      <AuthModal />
    </html>
  );
}