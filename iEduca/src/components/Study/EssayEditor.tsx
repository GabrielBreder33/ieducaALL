import Modal from '../Modal';

interface EssayEditorProps {
  isOpen: boolean;
  theme: string;
  content: string;
  wordCount: number;
  lineCount: number;
  minLines: number;
  onChange: (content: string) => void;
  onSubmit: () => void;
}

export default function EssayEditor({
  isOpen,
  theme,
  content,
  wordCount,
  lineCount,
  minLines,
  onChange,
  onSubmit
}: EssayEditorProps) {
  return (
    <Modal isOpen={isOpen} canClose={false}>
      <div className="p-8">
        <h2 className="text-2xl font-bold text-slate-100 mb-6">
          ✍️ Redação: {theme}
        </h2>
        
        <div className="mb-4 flex gap-4 text-sm">
          <div className="bg-slate-700 px-4 py-2 rounded-lg">
            <span className="text-slate-400">Palavras: </span>
            <span className="text-slate-100 font-bold">{wordCount}</span>
          </div>
          <div className="bg-slate-700 px-4 py-2 rounded-lg">
            <span className="text-slate-400">Linhas: </span>
            <span className={`font-bold ${
              lineCount >= minLines ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {lineCount}
            </span>
            <span className="text-slate-400"> / {minLines}</span>
          </div>
        </div>
        
        {lineCount < minLines && lineCount > 0 && (
          <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 text-amber-300 text-sm">
            ⚠️ Você precisa escrever pelo menos {minLines - lineCount} linhas a mais
          </div>
        )}
        
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Escreva sua redação aqui..."
          className="w-full h-96 px-4 py-3 bg-slate-700 text-slate-100 rounded-lg border border-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 resize-none font-mono text-sm leading-relaxed"
        />
        
        <div className="mt-6 flex gap-3">
          <button
            onClick={onSubmit}
            disabled={lineCount < minLines}
            className={`flex-1 py-4 rounded-xl text-base font-semibold transition-all ${
              lineCount >= minLines
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg hover:shadow-emerald-500/40'
                : 'bg-slate-600 text-slate-400 cursor-not-allowed'
            }`}
          >
            📤 Enviar para correção
          </button>
        </div>
      </div>
    </Modal>
  );
}
