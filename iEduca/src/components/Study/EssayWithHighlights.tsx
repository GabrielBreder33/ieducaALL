import { useState } from 'react';
import { TextError } from '../../services/aiService';

interface EssayWithHighlightsProps {
  content: string;
  errors: TextError[];
}

export default function EssayWithHighlights({ content, errors }: EssayWithHighlightsProps) {
  const [selectedError, setSelectedError] = useState<TextError | null>(null);

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

    const sortedErrors = [...errors].sort((a, b) => a.start - b.start);
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
          onClick={() => setSelectedError(error)}
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
