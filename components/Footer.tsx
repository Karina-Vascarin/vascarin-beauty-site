import TermsModal from './TermsModal';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-100 py-8 px-4 mt-12">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
        
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-black block mb-1">
            Vascarin Beauty
          </span>
          <p className="text-[11px] text-gray-500">
            © {new Date().getFullYear()} — Todos os direitos reservados.
          </p>
        </div>

        <div>
          <TermsModal />
        </div>

      </div>
    </footer>
  );
}