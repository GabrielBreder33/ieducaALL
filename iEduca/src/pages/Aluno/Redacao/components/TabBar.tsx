import { useMemo } from 'react';
import type { ViewMode, ExtendedEssayCorrection } from '../types';

interface Props {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  correcaoCompleta: ExtendedEssayCorrection | null;
  darkMode: boolean;
}

export function TabBar({ viewMode, setViewMode, correcaoCompleta, darkMode }: Props) {
  const tabItems = useMemo(() => {
    const items: Array<{ key: ViewMode; label: string; accent?: string }> = [
      { key: 'overview', label: 'Diagnóstico' },
      { key: 'detailed', label: 'Redação Completa' },
    ];
    if (correcaoCompleta?.revisaoProfessor) {
      items.push({ key: 'professor', label: 'Revisão Professor', accent: 'purple' });
    }
    return items;
  }, [correcaoCompleta?.revisaoProfessor]);

  return (
    <div className={`rounded-2xl border ${darkMode ? 'bg-slate-900/80 border-slate-700' : 'bg-white border-slate-200'} p-1.5 flex gap-1 shadow-sm`}>
      {tabItems.map(tab => {
        const isActive = viewMode === tab.key;
        const isProfessor = tab.accent === 'purple';
        let cls: string;
        if (isActive && isProfessor) {
          cls = darkMode
            ? 'bg-purple-500/20 text-purple-200 border-purple-400/40 shadow-lg shadow-purple-500/10'
            : 'bg-purple-50 text-purple-700 border-purple-200 shadow-lg shadow-purple-500/10';
        } else if (isActive) {
          cls = darkMode
            ? 'bg-blue-500/15 text-blue-200 border-blue-400/40 shadow-lg shadow-blue-500/10'
            : 'bg-blue-50 text-blue-700 border-blue-200 shadow-lg shadow-blue-500/10';
        } else {
          cls = darkMode
            ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border-transparent'
            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50 border-transparent';
        }
        return (
          <button
            key={tab.key}
            onClick={() => setViewMode(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 ${cls}`}
          >
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}
