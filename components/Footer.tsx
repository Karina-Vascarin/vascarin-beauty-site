import TermsModal from './TermsModal';

export default function Footer() {
  return (
    <footer className="bg-zinc-100 border-t-2 border-black py-10 px-6 mt-16 shadow-inner">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
        
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-black block mb-1">
            Vascarin Beauty
          </span>
          <p className="text-[11px] text-gray-600">
            © {new Date().getFullYear()} — Todos os direitos reservados.
          </p>
        </div>

        <div className="bg-white px-4 py-2 border border-gray-300 shadow-sm">
          <TermsModal />
        </div>

      </div>
    </footer>
  );
}