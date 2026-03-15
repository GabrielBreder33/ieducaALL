import type { RedacaoSubmissao } from '../types';
import { getStatusBadge, getStatusLabel, formatDate } from '../utils';

interface Props {
  redacao: RedacaoSubmissao;
  darkMode: boolean;
  reenviandoId: number | null;
  onReenviar: (id: number) => void;
}

export function RedacaoCardErro({ redacao, darkMode, reenviandoId, onReenviar }: Props) {
  return (
    <div
      className={`rounded-2xl shadow-lg border overflow-hidden transition-all hover:shadow-xl ${
        darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
      }`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <span className={getStatusBadge(redacao.status)}>{getStatusLabel(redacao.status)}</span>
            <h3 className={`text-lg font-bold mt-3 mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Redação: {redacao.tema}
            </h3>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              📤 Enviado {formatDate(redacao.dataEnvio)}
            </p>
          </div>
          <div className="text-right">
            <button
              onClick={() => onReenviar(redacao.id)}
              disabled={reenviandoId === redacao.id}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {reenviandoId === redacao.id ? 'Reenviando...' : 'Reenviar'}
            </button>
            <p className={`text-xs mt-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
              ID: #{redacao.id.toString().padStart(6, '0')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
