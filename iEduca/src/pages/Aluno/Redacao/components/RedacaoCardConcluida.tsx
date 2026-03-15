import { useNavigate } from 'react-router-dom';
import type { RedacaoSubmissao } from '../types';
import { getStatusBadge, getStatusLabel, formatDate } from '../utils';

interface Props {
  redacao: RedacaoSubmissao;
  darkMode: boolean;
}

export function RedacaoCardConcluida({ redacao, darkMode }: Props) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/aluno/redacao/${redacao.id}`)}
      className={`rounded-xl sm:rounded-2xl shadow-lg border overflow-hidden transition-all hover:shadow-xl cursor-pointer ${
        darkMode
          ? 'bg-slate-800 border-slate-700 hover:border-slate-600'
          : 'bg-white border-slate-200 hover:border-blue-300'
      }`}
    >
      <div
        className={`h-32 sm:h-40 flex items-center justify-center relative ${
          redacao.revisadaPorProfessor
            ? 'bg-gradient-to-br from-purple-500 to-purple-700'
            : 'bg-gradient-to-br from-teal-500 to-teal-600'
        }`}
      >
        <div className="text-center">
          <div className="text-3xl sm:text-4xl font-extrabold text-white drop-shadow-lg">
            {redacao.revisadaPorProfessor && redacao.notaProfessor != null
              ? redacao.notaProfessor
              : redacao.notaTotal ?? '—'}
          </div>
          <div className="text-white/70 text-xs font-medium mt-1">pontos</div>
        </div>

        <div className="absolute top-2 sm:top-3 left-2 sm:left-3">
          {redacao.revisadaPorProfessor ? (
            <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow">
              <span className="text-xs">👨‍🏫</span>
              <span className="text-purple-700 font-bold text-xs truncate max-w-[100px]">
                {redacao.professorNome || 'Professor'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-lg shadow">
              <span className="text-teal-700 font-bold text-xs">iEduca IA</span>
            </div>
          )}
        </div>

        <div className="absolute top-2 sm:top-3 right-2 sm:right-3">
          <span className={getStatusBadge(redacao.status)}>{getStatusLabel(redacao.status)}</span>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <h3 className={`text-sm sm:text-base font-bold mb-1.5 line-clamp-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          {redacao.tema}
        </h3>
        <p className={`text-xs mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
          Enviado {formatDate(redacao.dataEnvio)}
        </p>
        <button
          className={`w-full font-medium text-sm flex items-center justify-center gap-2 py-2 ${
            redacao.revisadaPorProfessor
              ? 'text-purple-600 hover:text-purple-700'
              : 'text-blue-600 hover:text-blue-700'
          }`}
        >
          Ver Feedback
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
