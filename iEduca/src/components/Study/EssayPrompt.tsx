import Modal from '../Modal';

interface EssayPromptProps {
  isOpen: boolean;
  theme: string;
  onStart: () => void;
}

export default function EssayPrompt({ isOpen, theme, onStart }: EssayPromptProps) {
  return (
    <Modal isOpen={isOpen} canClose={false}>
      <div className="p-8">
        <h2 className="text-3xl font-bold text-slate-100 mb-4 text-center">
          ✍️ Hora da Redação!
        </h2>
        
        <p className="text-slate-300 text-lg mb-6 text-center">
          Com base no tema estudado, faça uma redação no formato vestibular.
        </p>
        
        <div className="bg-slate-700 rounded-lg p-6 mb-6 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">📚 Tema:</span>
            <span className="text-slate-100 font-semibold">{theme}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">📝 Tipo:</span>
            <span className="text-slate-100 font-semibold">ENEM / Vestibular</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-medium">📏 Linhas mínimas:</span>
            <span className="text-slate-100 font-semibold">20 linhas</span>
          </div>
        </div>
        
        <button
          onClick={onStart}
          className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-lg font-semibold transition-all hover:shadow-lg hover:shadow-emerald-500/40"
        >
          ✏️ Fazer redação agora
        </button>
      </div>
    </Modal>
  );
}
