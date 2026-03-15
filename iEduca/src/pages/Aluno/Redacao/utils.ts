import type { HighlightTone } from './types';

export const COMPETENCIA_NOMES = [
  'Domínio da Norma Culta',
  'Compreensão da Proposta',
  'Seleção e Organização',
  'Mecanismos Linguísticos',
  'Proposta de Intervenção',
];

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 60) {
    return `${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'} atrás`;
  } else if (diffHours < 24) {
    return `${diffHours} ${diffHours === 1 ? 'hora' : 'horas'} atrás`;
  } else if (diffDays === 0) {
    return 'Hoje';
  } else {
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}

export function getStatusBadge(status: string) {
  switch (status) {
    case 'processando':
      return 'px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full';
    case 'concluida':
      return 'px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full';
    case 'erro':
      return 'px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full';
    case 'rascunho':
      return 'px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full';
    default:
      return '';
  }
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'processando': return '🔄 Analisando';
    case 'concluida': return '✓ Completa';
    case 'erro': return '⚠️ Erro';
    case 'rascunho': return '📝 Rascunho';
    default: return '';
  }
}

export function getToneClasses(tone: HighlightTone, darkMode: boolean) {
  switch (tone) {
    case 'success':
      return {
        icon: darkMode
          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-400/40'
          : 'bg-emerald-50 text-emerald-600 border border-emerald-100',
        label: darkMode ? 'text-emerald-200' : 'text-emerald-700',
      };
    case 'warning':
      return {
        icon: darkMode
          ? 'bg-amber-500/10 text-amber-200 border border-amber-400/40'
          : 'bg-amber-50 text-amber-600 border border-amber-100',
        label: darkMode ? 'text-amber-200' : 'text-amber-700',
      };
    default:
      return {
        icon: darkMode
          ? 'bg-blue-500/10 text-blue-200 border border-blue-400/40'
          : 'bg-blue-50 text-blue-600 border border-blue-100',
        label: darkMode ? 'text-blue-200' : 'text-blue-700',
      };
  }
}

export function getCompetenciaStyles(nota: number, darkMode: boolean) {
  if (nota >= 160) {
    return {
      tag: darkMode
        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-400/40'
        : 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      bar: 'from-emerald-400 to-emerald-500',
      label: 'Bom domínio',
    };
  }
  if (nota >= 120) {
    return {
      tag: darkMode
        ? 'bg-blue-500/10 text-blue-200 border border-blue-400/40'
        : 'bg-blue-50 text-blue-600 border border-blue-100',
      bar: 'from-blue-500 to-cyan-500',
      label: 'Consistente',
    };
  }
  if (nota >= 80) {
    return {
      tag: darkMode
        ? 'bg-amber-500/10 text-amber-200 border border-amber-400/40'
        : 'bg-amber-50 text-amber-600 border border-amber-100',
      bar: 'from-amber-500 to-orange-500',
      label: 'Em desenvolvimento',
    };
  }
  return {
    tag: darkMode
      ? 'bg-rose-500/10 text-rose-200 border border-rose-400/40'
      : 'bg-rose-50 text-rose-600 border border-rose-100',
    bar: 'from-rose-500 to-orange-500',
    label: 'Prioritário',
  };
}

export function getAccentByNota(nota: number, darkMode: boolean) {
  if (nota >= 160) {
    return {
      gradient: 'bg-gradient-to-t from-emerald-400 to-emerald-500',
      card: darkMode ? 'bg-emerald-500/5 border-emerald-400/40' : 'bg-emerald-50 border-emerald-100',
      text: darkMode ? 'text-emerald-200' : 'text-emerald-700',
    };
  }
  if (nota >= 120) {
    return {
      gradient: 'bg-gradient-to-t from-blue-500 to-cyan-500',
      card: darkMode ? 'bg-blue-500/5 border-blue-400/40' : 'bg-blue-50 border-blue-100',
      text: darkMode ? 'text-blue-200' : 'text-blue-700',
    };
  }
  if (nota >= 80) {
    return {
      gradient: 'bg-gradient-to-t from-amber-500 to-orange-400',
      card: darkMode ? 'bg-amber-500/5 border-amber-400/40' : 'bg-amber-50 border-amber-100',
      text: darkMode ? 'text-amber-200' : 'text-amber-700',
    };
  }
  return {
    gradient: 'bg-gradient-to-t from-rose-500 to-orange-500',
    card: darkMode ? 'bg-rose-500/5 border-rose-400/40' : 'bg-rose-50 border-rose-100',
    text: darkMode ? 'text-rose-200' : 'text-rose-700',
  };
}
