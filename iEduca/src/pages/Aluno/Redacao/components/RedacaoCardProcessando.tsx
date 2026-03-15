import type { RedacaoSubmissao } from '../types';
import { getStatusBadge, getStatusLabel, formatDate } from '../utils';

interface Props {
  redacao: RedacaoSubmissao;
  darkMode: boolean;
}

export function RedacaoCardProcessando({ redacao, darkMode }: Props) {
  return (
    <div
      className={`rounded-2xl shadow-lg border overflow-hidden transition-all hover:shadow-xl ${
        darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
      }`}
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <span className={getStatusBadge(redacao.status)}>{getStatusLabel(redacao.status)}</span>
            <h3 className={`text-base sm:text-lg font-bold mt-3 mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Redação: {redacao.tema}
            </h3>
            <p className={`text-xs sm:text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              📤 Enviado {formatDate(redacao.dataEnvio)}
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <div className={`text-2xl sm:text-3xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
              {redacao.progresso}%
            </div>
            <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
              ID: #{redacao.id.toString().padStart(6, '0')}
            </p>
          </div>
        </div>

        <div className="mb-3">
          <div className={`text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            Analisando competências e estrutura...
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${redacao.progresso}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Verificação Sintática</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Análise Estrutural</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${redacao.progresso >= 70 ? 'bg-green-500' : 'bg-slate-300'}`} />
            <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Avaliação de Competências</span>
          </div>
        </div>
      </div>
    </div>
  );
}
