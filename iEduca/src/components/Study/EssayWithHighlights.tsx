import { useState } from 'react';
import { TextError } from '../../services/aiService';

interface EssayWithHighlightsProps {
  content: string;
  errors: TextError[];
}

export default function EssayWithHighlights({ content, errors }: EssayWithHighlightsProps) {
  const [selectedError, setSelectedError] = useState<TextError | null>(null);
  const [expandedSeverity, setExpandedSeverity] = useState<{[key: string]: boolean}>({
    critical: true,
    medium: true,
    light: true
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/20 border-b-2 border-red-500 hover:bg-red-500/30';
      case 'medium':
        return 'bg-orange-500/20 border-b-2 border-orange-500 hover:bg-orange-500/30';
      case 'light':
        return 'bg-yellow-500/20 border-b-2 border-yellow-500 hover:bg-yellow-500/30';
      default:
        return '';
    }
  };

  const renderTextWithHighlights = () => {
    if (errors.length === 0) {
      return <span className="text-slate-200">{content}</span>;
    }

    const normalizedErrors = errors.map(error => ({
      start: error.start ?? error.posicaoInicio,
      end: error.end ?? error.posicaoFim,
      severity: (error.severity ?? error.severidade ?? 'medium') as string,
      message: error.message ?? error.explicacao,
      suggestion: error.suggestion ?? error.textoSugerido,
      textoOriginal: error.textoOriginal
    }));

    const sortedErrors = [...normalizedErrors].sort((a, b) => a.start - b.start);
    const segments: JSX.Element[] = [];
    let lastIndex = 0;

    sortedErrors.forEach((error, idx) => {
      if (error.start > lastIndex) {
        segments.push(
          <span key={`text-${idx}`} className="text-slate-200">
            {content.substring(lastIndex, error.start)}
          </span>
        );
      }

      segments.push(
        <span
          key={`error-${idx}`}
          className={`${getSeverityColor(error.severity)} cursor-pointer transition-colors rounded px-1`}
          onClick={() => setSelectedError(error as any)}
          title={error.message}
        >
          {content.substring(error.start, error.end)}
        </span>
      );

      lastIndex = error.end;
    });

    if (lastIndex < content.length) {
      segments.push(
        <span key="text-final" className="text-slate-200">
          {content.substring(lastIndex)}
        </span>
      );
    }

    return segments;
  };

  return (
    <div className="relative">
      <div className="bg-slate-700 rounded-lg p-6 leading-relaxed text-base whitespace-pre-wrap font-mono">
        {renderTextWithHighlights()}
      </div>

      {selectedError && (
        <div className="mt-4 bg-slate-800 border-l-4 border-orange-500 rounded-r-lg p-4 animate-slide-in-right">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${
                selectedError.severity === 'critical' ? 'bg-red-500' :
                selectedError.severity === 'medium' ? 'bg-orange-500' :
                'bg-yellow-500'
              }`} />
              <h4 className="font-semibold text-slate-100">
                {selectedError.severity === 'critical' ? '🔴 Erro Crítico' :
                 selectedError.severity === 'medium' ? '🟠 Atenção' :
                 '🟡 Sugestão'}
              </h4>
            </div>
            <button
              onClick={() => setSelectedError(null)}
              className="text-slate-400 hover:text-slate-100 transition-colors"
            >
              ✕
            </button>
          </div>
          
          <p className="text-slate-300 mb-2">{selectedError.message}</p>
          
          {selectedError.suggestion && (
            <div className="bg-slate-700 rounded p-3 mt-2">
              <p className="text-sm text-emerald-400 font-medium mb-1">💡 Sugestão:</p>
              <p className="text-sm text-slate-200">{selectedError.suggestion}</p>
            </div>
          )}
        </div>
      )}

      {/* Lista de Erros Encontrados */}
      {errors.length > 0 && (() => {
        // Normalizar e agrupar erros por severidade
        const normalizedErrors = errors.map((error, idx) => ({
          index: idx,
          start: error.start ?? error.posicaoInicio,
          end: error.end ?? error.posicaoFim,
          severity: (error.severity ?? error.severidade ?? 'medium') as string,
          message: error.message ?? error.explicacao,
          suggestion: error.suggestion ?? error.textoSugerido,
          textoOriginal: error.textoOriginal
        }));

        const errorsBySeverity = {
          critical: normalizedErrors.filter(e => e.severity === 'critical'),
          medium: normalizedErrors.filter(e => e.severity === 'medium'),
          light: normalizedErrors.filter(e => e.severity === 'light')
        };

        const getSeverityConfig = (severity: string) => {
          switch (severity) {
            case 'critical':
              return {
                icon: '🔴',
                title: 'Erros Críticos',
                color: 'red',
                bgColor: 'bg-red-500/10',
                borderColor: 'border-red-500/30',
                textColor: 'text-red-400',
                hoverBg: 'hover:bg-red-500/20'
              };
            case 'medium':
              return {
                icon: '🟠',
                title: 'Pontos de Atenção',
                color: 'orange',
                bgColor: 'bg-orange-500/10',
                borderColor: 'border-orange-500/30',
                textColor: 'text-orange-400',
                hoverBg: 'hover:bg-orange-500/20'
              };
            default:
              return {
                icon: '🟡',
                title: 'Sugestões de Melhoria',
                color: 'yellow',
                bgColor: 'bg-yellow-500/10',
                borderColor: 'border-yellow-500/30',
                textColor: 'text-yellow-400',
                hoverBg: 'hover:bg-yellow-500/20'
              };
          }
        };

        return (
          <div className="mt-6">
            <h4 className="font-semibold text-slate-100 mb-4 flex items-center gap-2">
              <span className="text-lg">🔍</span>
              Análise Ortográfica e Gramatical
              <span className="text-sm text-slate-400 ml-2">({errors.length} {errors.length === 1 ? 'erro encontrado' : 'erros encontrados'})</span>
            </h4>

            <div className="space-y-3">
              {(['critical', 'medium', 'light'] as const).map(severity => {
                const errorList = errorsBySeverity[severity];
                if (errorList.length === 0) return null;

                const config = getSeverityConfig(severity);
                const isExpanded = expandedSeverity[severity];

                return (
                  <div key={severity} className={`${config.bgColor} ${config.borderColor} border rounded-lg overflow-hidden`}>
                    <button
                      onClick={() => setExpandedSeverity(prev => ({ ...prev, [severity]: !prev[severity] }))}
                      className={`w-full px-4 py-3 flex items-center justify-between ${config.hoverBg} transition-colors`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{config.icon}</span>
                        <span className={`font-semibold ${config.textColor}`}>{config.title}</span>
                        <span className="px-2 py-0.5 bg-slate-800/50 rounded text-xs text-slate-300">
                          {errorList.length}
                        </span>
                      </div>
                      <span className={`text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                        ▼
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="max-h-96 overflow-y-auto">
                        <div className="p-3 space-y-2">
                          {errorList.map((error, idx) => (
                            <div
                              key={error.index}
                              className="bg-slate-800/50 rounded-lg p-3 hover:bg-slate-700/70 transition-colors cursor-pointer group"
                              onClick={() => setSelectedError(error as any)}
                            >
                              <div className="flex items-start gap-2">
                                <span className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center text-xs ${config.textColor} bg-slate-900/50`}>
                                  {idx + 1}
                                </span>
                                <div className="flex-1 min-w-0">
                                  {error.textoOriginal && (
                                    <div className="mb-1.5 flex items-center gap-2 flex-wrap">
                                      <span className="inline-flex items-center gap-1 text-sm">
                                        <span className="line-through text-red-400 font-medium">{error.textoOriginal}</span>
                                        {error.suggestion && (
                                          <>
                                            <span className="text-slate-500">→</span>
                                            <span className="text-emerald-400 font-medium">{error.suggestion}</span>
                                          </>
                                        )}
                                      </span>
                                    </div>
                                  )}
                                  <p className="text-slate-300 text-sm leading-relaxed">{error.message}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      <div className="mt-4 flex gap-2 text-xs">
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-red-500 rounded"></span>
          <span className="text-slate-400">Crítico</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-orange-500 rounded"></span>
          <span className="text-slate-400">Médio</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-3 h-3 bg-yellow-500 rounded"></span>
          <span className="text-slate-400">Leve</span>
        </div>
      </div>
    </div>
  );
}
