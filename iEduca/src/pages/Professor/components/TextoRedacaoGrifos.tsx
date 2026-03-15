import { useRef, useState } from 'react';
import type { GrifoItem } from '../../../services/professorService';

interface Props {
  texto: string;
  darkMode: boolean;
  grifos: GrifoItem[];
  onGrifosChange: (grifos: GrifoItem[]) => void;
}

const COR_MAP: Record<string, string> = {
  yellow: 'rgba(253,224,71,0.5)',
  red: 'rgba(252,165,165,0.5)',
  green: 'rgba(134,239,172,0.5)',
  blue: 'rgba(147,197,253,0.5)',
  orange: 'rgba(253,186,116,0.5)',
};

const BORDER_MAP: Record<string, string> = {
  yellow: '#eab308', red: '#ef4444', green: '#22c55e', blue: '#3b82f6', orange: '#f97316',
};

const BG_MAP: Record<string, string> = {
  yellow: '#fde047', red: '#fca5a5', green: '#86efac', blue: '#93c5fd', orange: '#fdba74',
};

export default function TextoRedacaoGrifos({ texto, darkMode, grifos, onGrifosChange }: Props) {
  const [grifoCorAtiva, setGrifoCorAtiva] = useState('yellow');
  const [grifoPopup, setGrifoPopup] = useState<{ posicaoInicio: number; posicaoFim: number; top: number; left: number } | null>(null);
  const [grifoComentario, setGrifoComentario] = useState('');
  const [grifoSelecionado, setGrifoSelecionado] = useState<number | null>(null);
  const textoRef = useRef<HTMLDivElement | null>(null);

  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !textoRef.current) return;
    const range = sel.getRangeAt(0);
    const container = textoRef.current;
    const preRange = document.createRange();
    preRange.selectNodeContents(container);
    preRange.setEnd(range.startContainer, range.startOffset);
    const inicio = preRange.toString().length;
    const selectedText = sel.toString();
    if (selectedText.trim().length === 0) return;
    const fim = inicio + selectedText.length;
    const rect = range.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    setGrifoPopup({
      posicaoInicio: inicio,
      posicaoFim: fim,
      top: rect.bottom - containerRect.top + container.scrollTop + 4,
      left: Math.max(0, rect.left - containerRect.left),
    });
    setGrifoComentario('');
  };

  const adicionarGrifo = () => {
    if (!grifoPopup) return;
    onGrifosChange([...grifos, {
      posicaoInicio: grifoPopup.posicaoInicio,
      posicaoFim: grifoPopup.posicaoFim,
      cor: grifoCorAtiva,
      comentario: grifoComentario || undefined,
    }]);
    setGrifoPopup(null);
    window.getSelection()?.removeAllRanges();
  };

  const removerGrifo = (idx: number) => {
    onGrifosChange(grifos.filter((_, i) => i !== idx));
    setGrifoSelecionado(null);
  };

  const renderTexto = () => {
    if (grifos.length === 0) return texto;
    const sorted = [...grifos].sort((a, b) => a.posicaoInicio - b.posicaoInicio);
    const elements: JSX.Element[] = [];
    let cursor = 0;
    sorted.forEach((g, idx) => {
      if (g.posicaoInicio > cursor) {
        elements.push(<span key={`t-${idx}`}>{texto.substring(cursor, g.posicaoInicio)}</span>);
      }
      elements.push(
        <span
          key={`g-${idx}`}
          className={`cursor-pointer rounded-sm relative group ${grifoSelecionado === idx ? 'ring-2 ring-offset-1 ring-slate-500' : ''}`}
          style={{ backgroundColor: COR_MAP[g.cor] || COR_MAP.yellow, borderBottom: `2px solid ${BORDER_MAP[g.cor] || BORDER_MAP.yellow}` }}
          onClick={(e) => { e.stopPropagation(); setGrifoSelecionado(grifoSelecionado === idx ? null : idx); }}
          title={g.comentario || 'Clique para selecionar/remover'}
        >
          {texto.substring(g.posicaoInicio, g.posicaoFim)}
          {g.comentario && (
            <span className="hidden group-hover:block absolute left-0 top-full z-50 mt-1 p-2 rounded-lg bg-slate-800 text-white text-xs max-w-xs shadow-xl whitespace-normal">
              {g.comentario}
            </span>
          )}
        </span>
      );
      cursor = g.posicaoFim;
    });
    if (cursor < texto.length) {
      elements.push(<span key="t-final">{texto.substring(cursor)}</span>);
    }
    return elements;
  };

  return (
    <>
      <div className={`rounded-2xl shadow-lg overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'}`}>
        <div className={`px-5 py-4 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Texto do Aluno</h3>
            <div className="flex items-center gap-2">
              <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Cor do grifo:</span>
              {['yellow', 'red', 'green', 'blue', 'orange'].map(cor => (
                <button
                  key={cor}
                  onClick={() => setGrifoCorAtiva(cor)}
                  className={`w-6 h-6 rounded-full border-2 transition-all ${
                    grifoCorAtiva === cor ? 'border-slate-900 scale-125 ring-2 ring-offset-1 ring-slate-400' : 'border-slate-300'
                  }`}
                  style={{ backgroundColor: BG_MAP[cor] }}
                  title={cor}
                />
              ))}
              {grifos.length > 0 && (
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${darkMode ? 'bg-indigo-900 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                  {grifos.length} grifo{grifos.length > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <p className={`text-xs mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
            Selecione um trecho do texto para grifar. Clique em um grifo existente para removê-lo.
          </p>
        </div>
        <div
          ref={textoRef}
          className={`p-5 min-h-[300px] max-h-[60vh] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed select-text cursor-text relative ${
            darkMode ? 'text-slate-300' : 'text-slate-700'
          }`}
          onMouseUp={handleMouseUp}
        >
          {renderTexto()}

          {grifoPopup && (
            <div
              className={`absolute z-50 p-3 rounded-xl shadow-2xl border ${darkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200'}`}
              style={{ top: grifoPopup.top, left: grifoPopup.left, minWidth: 240 }}
              onClick={e => e.stopPropagation()}
            >
              <p className={`text-xs font-semibold mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>Adicionar grifo</p>
              <input
                type="text"
                value={grifoComentario}
                onChange={e => setGrifoComentario(e.target.value)}
                placeholder="Comentário (opcional)"
                className={`w-full px-3 py-1.5 rounded-lg border text-xs mb-2 ${darkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
              />
              <div className="flex gap-2">
                <button onClick={adicionarGrifo} className="flex-1 px-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700">
                  Grifar
                </button>
                <button
                  onClick={() => { setGrifoPopup(null); window.getSelection()?.removeAllRanges(); }}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg ${darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {grifoSelecionado !== null && grifos[grifoSelecionado] && (
        <div className={`p-3 rounded-xl flex items-center justify-between ${darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-slate-100 border border-slate-200'}`}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: BG_MAP[grifos[grifoSelecionado].cor] || BG_MAP.yellow }} />
            <span className={`text-xs truncate ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              "{texto.substring(grifos[grifoSelecionado].posicaoInicio, Math.min(grifos[grifoSelecionado].posicaoFim, grifos[grifoSelecionado].posicaoInicio + 40))}
              {grifos[grifoSelecionado].posicaoFim - grifos[grifoSelecionado].posicaoInicio > 40 ? '...' : ''}"
            </span>
            {grifos[grifoSelecionado].comentario && (
              <span className={`text-xs italic ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                — {grifos[grifoSelecionado].comentario}
              </span>
            )}
          </div>
          <button
            onClick={() => removerGrifo(grifoSelecionado)}
            className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 flex-shrink-0 ml-2"
          >
            Remover
          </button>
        </div>
      )}
    </>
  );
}
