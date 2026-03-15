import { useState } from 'react';
import type { GrifoView } from '../types';

interface Props {
  texto: string;
  erros: any[];
  onErroClick: (erro: any) => void;
  grifos?: GrifoView[];
}

export function TextoComErros({ texto, erros, onErroClick, grifos }: Props) {
  const [grifoTooltip, setGrifoTooltip] = useState<{ texto: string; x: number; y: number } | null>(null);

  if (!texto) {
    return <p className="text-gray-400 italic">Texto não disponível</p>;
  }

  const hasErros = erros && erros.length > 0;
  const hasGrifos = grifos && grifos.length > 0;

  if (!hasErros && !hasGrifos) {
    const paragrafos = texto.split('\n').filter((p) => p.trim());
    return (
      <>
        {paragrafos.map((paragrafo, idx) => (
          <p key={idx} className="mb-3 indent-8 leading-snug">
            {paragrafo.trim()}
          </p>
        ))}
      </>
    );
  }

  // Build all highlight ranges: errors + grifos
  type HighlightRange = { inicio: number; fim: number; tipo: 'erro' | 'grifo'; data: any };
  const ranges: HighlightRange[] = [];

  if (hasErros) {
    const textoLower = texto.toLowerCase();
    erros.forEach((erro) => {
      const trecho = (erro?.textoOriginal || '').trim();
      if (!trecho) return;
      const trechoLower = trecho.toLowerCase();
      let indice = textoLower.indexOf(trechoLower);
      while (indice !== -1) {
        ranges.push({ inicio: indice, fim: indice + trecho.length, tipo: 'erro', data: erro });
        indice = textoLower.indexOf(trechoLower, indice + trecho.length);
      }
    });
  }

  if (hasGrifos) {
    grifos!.forEach((g) => {
      ranges.push({ inicio: g.posicaoInicio, fim: g.posicaoFim, tipo: 'grifo', data: g });
    });
  }

  // Sort by start position, grifos first for overlap priority rendering
  ranges.sort((a, b) => a.inicio - b.inicio || (a.tipo === 'grifo' ? -1 : 1));

  // Remove overlapping ranges (keep first encountered)
  const filtradas: typeof ranges = [];
  let ultimoFim = -1;
  ranges.forEach((item) => {
    if (item.inicio >= ultimoFim) {
      filtradas.push(item);
      ultimoFim = item.fim;
    }
  });

  const corGrifoMap: Record<string, { bg: string; border: string }> = {
    yellow: { bg: 'rgba(253,224,71,0.45)', border: '#eab308' },
    red: { bg: 'rgba(252,165,165,0.45)', border: '#ef4444' },
    green: { bg: 'rgba(134,239,172,0.45)', border: '#22c55e' },
    blue: { bg: 'rgba(147,197,253,0.45)', border: '#3b82f6' },
    orange: { bg: 'rgba(253,186,116,0.45)', border: '#f97316' },
  };

  const segmentos: JSX.Element[] = [];
  let cursor = 0;

  filtradas.forEach((item, idx) => {
    if (item.inicio > cursor) {
      segmentos.push(
        <span key={`txt-${idx}-${cursor}`}>
          {texto.substring(cursor, item.inicio)}
        </span>
      );
    }

    if (item.tipo === 'erro') {
      const severidade = (item.data?.severidade || '').toLowerCase();
      const highlightClass = severidade === 'high'
        ? 'bg-red-200 border-b-2 border-red-500 hover:bg-red-300'
        : severidade === 'medium'
        ? 'bg-yellow-200 border-b-2 border-yellow-500 hover:bg-yellow-300'
        : 'bg-blue-200 border-b-2 border-blue-500 hover:bg-blue-300';

      segmentos.push(
        <span
          key={`erro-${idx}`}
          className={`${highlightClass} cursor-pointer transition-colors rounded-sm px-0.5`}
          onClick={() => onErroClick(item.data)}
          title="Clique para ver detalhes"
        >
          {texto.substring(item.inicio, item.fim)}
        </span>
      );
    } else {
      const g = item.data as GrifoView;
      const cores = corGrifoMap[g.cor] || corGrifoMap.yellow;
      segmentos.push(
        <span
          key={`grifo-${idx}`}
          className="cursor-help transition-colors rounded-sm px-0.5 relative"
          style={{ backgroundColor: cores.bg, borderBottom: `2px solid ${cores.border}` }}
          onClick={(e) => {
            if (g.comentario) {
              const rect = (e.target as HTMLElement).getBoundingClientRect();
              setGrifoTooltip({ texto: g.comentario, x: rect.left, y: rect.bottom + 4 });
              setTimeout(() => setGrifoTooltip(null), 4000);
            }
          }}
          title={g.comentario || 'Destaque do professor'}
        >
          {texto.substring(item.inicio, item.fim)}
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full" style={{ backgroundColor: cores.border, opacity: 0.7 }} />
        </span>
      );
    }

    cursor = item.fim;
  });

  if (cursor < texto.length) {
    segmentos.push(
      <span key="txt-final">
        {texto.substring(cursor)}
      </span>
    );
  }

  const paragrafos: JSX.Element[] = [];
  let buffer: JSX.Element[] = [];
  let paragIdx = 0;

  const flushParagrafo = () => {
    if (buffer.length === 0) {
      paragrafos.push(
        <p key={`p-${paragIdx++}`} className="mb-3 indent-8 leading-snug">
          &nbsp;
        </p>
      );
      return;
    }

    paragrafos.push(
      <p key={`p-${paragIdx++}`} className="mb-3 indent-8 leading-snug">
        {buffer}
      </p>
    );
    buffer = [];
  };

  segmentos.forEach((segmento, idx) => {
    const conteudo = segmento.props.children;

    if (typeof conteudo === 'string' && conteudo.includes('\n')) {
      const partes = conteudo.split('\n');
      partes.forEach((parte, parteIdx) => {
        if (parteIdx > 0) {
          flushParagrafo();
        }

        if (parte.length) {
          buffer.push(<span key={`seg-${idx}-${parteIdx}`}>{parte}</span>);
        }
      });
    } else {
      buffer.push(segmento);
    }
  });

  if (buffer.length) {
    flushParagrafo();
  }

  return (
    <>
      {paragrafos}
      {grifoTooltip && (
        <div
          className="fixed z-[9999] max-w-xs p-3 rounded-xl bg-slate-800 text-white text-xs shadow-2xl border border-slate-600"
          style={{ left: grifoTooltip.x, top: grifoTooltip.y }}
          onClick={() => setGrifoTooltip(null)}
        >
          <p className="font-semibold text-purple-300 mb-1">💬 Professor:</p>
          <p>{grifoTooltip.texto}</p>
        </div>
      )}
    </>
  );
}
