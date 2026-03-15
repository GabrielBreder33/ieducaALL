import { useNavigate } from 'react-router-dom';
import type { RedacaoSubmissao } from '../types';
import { getStatusBadge, getStatusLabel, formatDate } from '../utils';

interface Props {
  redacao: RedacaoSubmissao;
  darkMode: boolean;
}

export function RedacaoCardRascunho({ redacao, darkMode }: Props) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/aluno/redacao/nova?rascunhoId=${redacao.id}`)}
      className={`rounded-xl sm:rounded-2xl shadow-lg border overflow-hidden transition-all hover:shadow-xl cursor-pointer ${
        darkMode
          ? 'bg-slate-800 border-slate-700 hover:border-slate-600'
          : 'bg-white border-slate-200 hover:border-blue-300'
      }`}
    >
      <div className="h-32 sm:h-40 bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center relative">
        <svg className="w-20 h-20 text-white/30" fill="currentColor" viewBox="0 0 24 24">
          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
          <path
            fillRule="evenodd"
            d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
            clipRule="evenodd"
          />
        </svg>
        <div className="absolute top-3 right-3">
          <span className={getStatusBadge(redacao.status)}>{getStatusLabel(redacao.status)}</span>
        </div>
        <div className="absolute top-2 sm:top-3 left-2 sm:left-3 bg-white text-slate-700 px-2 sm:px-3 py-1 rounded-lg font-bold text-xs sm:text-sm shadow">
          RASCUNHO
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <h3 className={`text-sm sm:text-base font-bold mb-2 line-clamp-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          {redacao.tema}
        </h3>
        <p className={`text-sm mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
          Salvo {formatDate(redacao.dataEnvio)}
        </p>
        <button className="w-full text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center justify-center gap-2 py-2">
          Continuar edição
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
