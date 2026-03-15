interface Props {
  texto: string;
  erros: any[];
  onErroClick: (erro: any) => void;
}

export function TextoComErros({ texto, erros, onErroClick }: Props) {
  if (!texto) {
    return <p className="text-gray-400 italic">Texto não disponível</p>;
  }

  if (!erros || erros.length === 0) {
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

  const ocorrencias: Array<{ inicio: number; fim: number; erro: any }> = [];
  const textoLower = texto.toLowerCase();

  erros.forEach((erro) => {
    const trecho = (erro?.textoOriginal || '').trim();
    if (!trecho) return;

    const trechoLower = trecho.toLowerCase();
    let indice = textoLower.indexOf(trechoLower);

    while (indice !== -1) {
      ocorrencias.push({ inicio: indice, fim: indice + trecho.length, erro });
      indice = textoLower.indexOf(trechoLower, indice + trecho.length);
    }
  });

  ocorrencias.sort((a, b) => a.inicio - b.inicio);

  const filtradas: typeof ocorrencias = [];
  let ultimoFim = -1;
  ocorrencias.forEach((item) => {
    if (item.inicio >= ultimoFim) {
      filtradas.push(item);
      ultimoFim = item.fim;
    }
  });

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

    const severidade = (item.erro?.severidade || '').toLowerCase();
    const highlightClass = severidade === 'high'
      ? 'bg-red-200 border-b-2 border-red-500 hover:bg-red-300'
      : severidade === 'medium'
      ? 'bg-yellow-200 border-b-2 border-yellow-500 hover:bg-yellow-300'
      : 'bg-blue-200 border-b-2 border-blue-500 hover:bg-blue-300';

    segmentos.push(
      <span
        key={`erro-${idx}`}
        className={`${highlightClass} cursor-pointer transition-colors rounded-sm px-0.5`}
        onClick={() => onErroClick(item.erro)}
        title="Clique para ver detalhes"
      >
        {texto.substring(item.inicio, item.fim)}
      </span>
    );

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

  return <>{paragrafos}</>;
}
