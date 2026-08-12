import TermsModal from './TermsModal';

export default function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 w-full bg-white/95 border-t border-gray-100 py-2 px-4 z-30 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="max-w-7xl mx-auto flex justify-between items-center text-center">
        
        <p className="text-[10px] text-gray-400 uppercase tracking-widest font-bold">
          © {new Date().getFullYear()} Vascarin Beauty
        </p>

        <div className="text-[10px]">
          <TermsModal />
        </div>

      </div>
    </footer>
  );
}