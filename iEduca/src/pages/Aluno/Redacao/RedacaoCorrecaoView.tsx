import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authService } from '../../../services/authService';
import type { User } from '../../../types';
import type { EssayCorrection, CompetencyScore } from '../../../services/aiService';
import { NotificationDropdown, ProfileMenu } from '../../../components/Dashboard';
import { AlunoSidebar } from '../../../components/AlunoSidebar';
import { useSSEProgress } from '../../../hooks/useSSEProgress';

type HighlightTone = 'success' | 'neutral' | 'warning';

type ExtendedEssayCorrection = EssayCorrection & {
  tema?: string;
  tipoAvaliacao?: string;
  textoRedacao?: string;
  dataCorrecao?: string;
  dataConclusao?: string;
  dataCriacao?: string;
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function RedacaoCorrecaoView() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const correcaoId = id ? Number(id) : null;

  const { progressData, error: sseError, isConnected } = useSSEProgress(correcaoId);
  const [correcaoCompleta, setCorrecaoCompleta] = useState<ExtendedEssayCorrection | null>(null);
  const [mostrarCorrecao, setMostrarCorrecao] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [erroSelecionado, setErroSelecionado] = useState<any>(null);
  const [progresso, setProgresso] = useState(0);
  const [status, setStatus] = useState('processando');
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');

  const statusNormalizado = (status || '').toLowerCase();
  const isConcluida = statusNormalizado.includes('conclu');
  const isProcessando = statusNormalizado.includes('process');
  const isErro = statusNormalizado.includes('erro');

  const renderTextoComErros = (texto: string, erros: any[]) => {
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
          onClick={() => setErroSelecionado(item.erro)}
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
  };

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);
  }, [navigate]);

  useEffect(() => {
    if (!progressData) {
      return;
    }

    setProgresso(progressData.progresso);
    setStatus(progressData.status);
    setIsLoading(false);

    const statusLower = (progressData.status || '').toLowerCase();
    if (statusLower.includes('conclu') && correcaoId && !correcaoCompleta) {
      loadCorrecaoCompleta(correcaoId);
    }
  }, [progressData, correcaoId, correcaoCompleta]);

  const loadCorrecaoCompleta = async (id: number) => {
    try {
      const response = await fetch(`${API_URL}/RedacaoCorrecao/${id}`);
      const data: ExtendedEssayCorrection = await response.json();
      setCorrecaoCompleta(data);
      setMostrarCorrecao(true);
      setViewMode('overview');
    } catch (error) {
      console.error('Erro ao carregar correção:', error);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleUpdateUser = (updatedData: Partial<User>) => {
    const updatedUser = { ...(user as User), ...updatedData } as User;
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const getNavButtonClasses = (isActive = false) => {
    const base = 'w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors';
    const active = 'bg-blue-600 text-white';
    const inactive = darkMode
      ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900';
    return `${base} ${isActive ? active : inactive}`;
  };

  const competencias = correcaoCompleta?.competencias ?? [];
  const sortedCompetencias = useMemo(() => {
    if (!competencias.length) {
      return [] as CompetencyScore[];
    }
    return [...competencias].sort((a, b) => b.nota - a.nota);
  }, [competencias]);

  const bestCompetencia = sortedCompetencias[0];
  const weakestCompetencia = sortedCompetencias[sortedCompetencias.length - 1];
  const pontosPositivos = correcaoCompleta?.feedbacks?.pontosPositivos ?? [];
  const pontosMelhoria = correcaoCompleta?.feedbacks?.pontosMelhoria ?? [];
  const recomendacoes = correcaoCompleta?.feedbacks?.recomendacoes ?? [];
  const notaTotal = correcaoCompleta?.notaTotal ?? 0;
  const dataCorrecaoIso = (correcaoCompleta as any)?.dataCorrecao
    ?? (correcaoCompleta as any)?.dataConclusao
    ?? (correcaoCompleta as any)?.dataCriacao;
  const dataCorrecaoFormatada = dataCorrecaoIso
    ? new Date(dataCorrecaoIso).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : 'Correção recente';
  const nivelAluno = notaTotal >= 800 ? 'Avançado' : notaTotal >= 600 ? 'Intermediário' : 'Em desenvolvimento';

  const overviewHighlights = useMemo(() => {
    const highlights: Array<{ title: string; label: string; description: string; tone: HighlightTone; icon: string }> = [
      {
        title: 'Ponto Forte',
        label: bestCompetencia?.nomeCompetencia || 'Estrutura sintática',
        description:
          bestCompetencia?.comentario ||
          pontosPositivos[0] ||
          'Assim que finalizarmos a correção você vê os destaques aqui.',
        tone: 'success',
        icon: '🛡️'
      },
      {
        title: 'Progressão',
        label: notaTotal >= 800 ? 'Tese consistente' : notaTotal >= 600 ? 'Boa evolução' : 'Em construção',
        description:
          correcaoCompleta?.resumoFinal ||
          pontosPositivos[1] ||
          'Use o diagnóstico executivo para acompanhar sua jornada.',
        tone: 'neutral',
        icon: '📈'
      },
      {
        title: 'Atenção crítica',
        label: weakestCompetencia?.nomeCompetencia || 'Intervenção (Comp. 5)',
        description:
          pontosMelhoria[0] ||
          weakestCompetencia?.comentario ||
          'Nenhum alerta crítico nesta correção.',
        tone: 'warning',
        icon: '⚠️'
      }
    ];
    return highlights;
  }, [bestCompetencia, weakestCompetencia, pontosPositivos, pontosMelhoria, notaTotal, correcaoCompleta]);

  const getToneClasses = (tone: HighlightTone) => {
    switch (tone) {
      case 'success':
        return {
          icon: darkMode
            ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-400/40'
            : 'bg-emerald-50 text-emerald-600 border border-emerald-100',
          label: darkMode ? 'text-emerald-200' : 'text-emerald-700'
        };
      case 'warning':
        return {
          icon: darkMode
            ? 'bg-amber-500/10 text-amber-200 border border-amber-400/40'
            : 'bg-amber-50 text-amber-600 border border-amber-100',
          label: darkMode ? 'text-amber-200' : 'text-amber-700'
        };
      default:
        return {
          icon: darkMode
            ? 'bg-blue-500/10 text-blue-200 border border-blue-400/40'
            : 'bg-blue-50 text-blue-600 border border-blue-100',
          label: darkMode ? 'text-blue-200' : 'text-blue-700'
        };
    }
  };

  const getCompetenciaStyles = (nota: number) => {
    if (nota >= 160) {
      return {
        tag: darkMode
          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-400/40'
          : 'bg-emerald-50 text-emerald-600 border border-emerald-100',
        bar: 'from-emerald-400 to-emerald-500',
        label: 'Bom domínio'
      };
    }
    if (nota >= 120) {
      return {
        tag: darkMode
          ? 'bg-blue-500/10 text-blue-200 border border-blue-400/40'
          : 'bg-blue-50 text-blue-600 border border-blue-100',
        bar: 'from-blue-500 to-cyan-500',
        label: 'Consistente'
      };
    }
    if (nota >= 80) {
      return {
        tag: darkMode
          ? 'bg-amber-500/10 text-amber-200 border border-amber-400/40'
          : 'bg-amber-50 text-amber-600 border border-amber-100',
        bar: 'from-amber-500 to-orange-500',
        label: 'Em desenvolvimento'
      };
    }
    return {
      tag: darkMode
        ? 'bg-rose-500/10 text-rose-200 border border-rose-400/40'
        : 'bg-rose-50 text-rose-600 border border-rose-100',
      bar: 'from-rose-500 to-orange-500',
      label: 'Prioritário'
    };
  };

  const renderOverviewSection = () => {
    if (!correcaoCompleta) {
      return null;
    }

    return (
      <div className="space-y-6">
        <div className={`rounded-3xl border shadow-2xl ${darkMode ? 'bg-gradient-to-r from-slate-900 to-slate-800 border-slate-700' : 'bg-white border-slate-200'} p-8`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-3 text-sm uppercase tracking-[0.3em] font-semibold">
                <span className={darkMode ? 'text-blue-300' : 'text-blue-600'}>Diagnóstico executivo</span>
                <span className={darkMode ? 'text-slate-500' : 'text-slate-500'}>{dataCorrecaoFormatada}</span>
              </div>
              <h2 className={`mt-3 text-3xl lg:text-4xl font-black leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {correcaoCompleta.tema}
              </h2>
              <p className={`mt-3 text-base ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                Revise seus principais indicadores antes de mergulhar nas correções linha a linha.
              </p>
            </div>
            <div className={`rounded-2xl p-6 text-center border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <p className={`text-sm font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Nota Geral</p>
              <div className={`text-6xl font-black ${notaTotal >= 800 ? 'text-green-500' : notaTotal >= 600 ? 'text-yellow-500' : 'text-orange-500'}`}>
                {notaTotal}
              </div>
              <p className={`mt-1 text-xs tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>/ 1000 pontos</p>
              <p className={`mt-3 text-sm font-semibold ${darkMode ? 'text-blue-200' : 'text-blue-700'}`}>{nivelAluno}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              className={`px-4 py-2 rounded-full text-sm font-semibold ${darkMode ? 'bg-blue-500/20 text-blue-200 border border-blue-400/40' : 'bg-blue-50 text-blue-700 border border-blue-100'}`}
              type="button"
            >
              Diagnóstico Executivo
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-4 py-2 rounded-full text-sm font-semibold border ${darkMode ? 'border-slate-600 text-white hover:bg-slate-800' : 'border-slate-200 text-slate-800 hover:bg-slate-50'}`}
              type="button"
            >
              Ver redação completa
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {overviewHighlights.map((highlight, idx) => {
            const tone = getToneClasses(highlight.tone);
            return (
              <div key={idx} className={`rounded-2xl border p-5 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} flex flex-col gap-3`}>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${tone.icon}`}>
                  {highlight.icon}
                </div>
                <span className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>{highlight.title}</span>
                <h4 className={`text-lg font-semibold ${tone.label}`}>{highlight.label}</h4>
                <p className={`${darkMode ? 'text-slate-300' : 'text-slate-600'} text-sm`}>{highlight.description}</p>
              </div>
            );
          })}
        </div>

        <div className={`rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} p-6`}>
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className={`text-xs uppercase tracking-[0.4em] font-semibold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Visão geral</p>
              <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Competências avaliadas</h3>
            </div>
            <button
              onClick={() => setViewMode('detailed')}
              className="text-sm font-semibold text-blue-500 hover:text-blue-400"
            >
              Ver detalhes completos →
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
            {competencias.map((comp, idx) => {
              const styles = getCompetenciaStyles(comp.nota);
              return (
                <div key={idx} className={`rounded-2xl border p-4 flex flex-col gap-3 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Competência {idx + 1}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full border ${styles.tag}`}>{styles.label}</span>
                  </div>
                  <div>
                    <p className={`text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{comp.nomeCompetencia}</p>
                    <div className="mt-2 flex items-baseline gap-1">
                      <span className="text-3xl font-black text-blue-500">{comp.nota}</span>
                      <span className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>/200</span>
                    </div>
                    <div className="mt-3 w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div className={`h-full bg-gradient-to-r ${styles.bar}`} style={{ width: `${(comp.nota / 200) * 100}%` }} />
                    </div>
                  </div>
                  <p className={`text-xs leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{comp.comentario}</p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    );
  };

  const renderDetailedSection = () => {
    if (!correcaoCompleta) {
      return null;
    }

    const wordCount = correcaoCompleta.textoRedacao?.split(/\s+/).filter(Boolean).length ?? 0;
    const statusBadge = notaTotal >= 800
      ? {
          label: 'APROVADO',
          light: 'bg-emerald-50 border border-emerald-200 text-emerald-700',
          dark: 'bg-emerald-500/10 border border-emerald-400/40 text-emerald-200'
        }
      : notaTotal >= 600
      ? {
          label: 'EM REVISÃO',
          light: 'bg-amber-50 border border-amber-200 text-amber-700',
          dark: 'bg-amber-500/10 border border-amber-400/40 text-amber-200'
        }
      : {
          label: 'REFAZER',
          light: 'bg-rose-50 border border-rose-200 text-rose-700',
          dark: 'bg-rose-500/10 border border-rose-400/40 text-rose-200'
        };

    const getAccent = (nota: number) => {
      if (nota >= 160) {
        return {
          gradient: 'bg-gradient-to-t from-emerald-400 to-emerald-500',
          card: darkMode ? 'bg-emerald-500/5 border-emerald-400/40' : 'bg-emerald-50 border-emerald-100',
          text: darkMode ? 'text-emerald-200' : 'text-emerald-700'
        };
      }
      if (nota >= 120) {
        return {
          gradient: 'bg-gradient-to-t from-blue-500 to-cyan-500',
          card: darkMode ? 'bg-blue-500/5 border-blue-400/40' : 'bg-blue-50 border-blue-100',
          text: darkMode ? 'text-blue-200' : 'text-blue-700'
        };
      }
      if (nota >= 80) {
        return {
          gradient: 'bg-gradient-to-t from-amber-500 to-orange-400',
          card: darkMode ? 'bg-amber-500/5 border-amber-400/40' : 'bg-amber-50 border-amber-100',
          text: darkMode ? 'text-amber-200' : 'text-amber-700'
        };
      }
      return {
        gradient: 'bg-gradient-to-t from-rose-500 to-orange-500',
        card: darkMode ? 'bg-rose-500/5 border-rose-400/40' : 'bg-rose-50 border-rose-100',
        text: darkMode ? 'text-rose-200' : 'text-rose-700'
      };
    };

    const badgeClasses = `${darkMode ? statusBadge.dark : statusBadge.light} px-4 py-1 rounded-full text-[0.7rem] font-black tracking-[0.3em]`;

    return (
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-6">
        <div className="space-y-6">
          <div className={`rounded-3xl border p-8 ${darkMode ? 'bg-slate-900/80 border-slate-700' : 'bg-white border-slate-200 shadow-xl'}`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className={`flex items-center gap-2 text-xs font-semibold ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                  <button onClick={() => navigate('/aluno/estudos')} className="hover:text-blue-500 transition-colors">
                    Dashboard
                  </button>
                  <span className="opacity-40">/</span>
                  <button onClick={() => navigate('/aluno/redacao/historico')} className="hover:text-blue-500 transition-colors">
                    Redações
                  </button>
                  <span className="opacity-40">/</span>
                  <span className="text-blue-500">Correção</span>
                </div>
                <h2 className={`mt-3 text-3xl font-black tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  {correcaoCompleta.tema}
                </h2>
                <p className={`mt-2 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  {correcaoCompleta.tipoAvaliacao || 'ENEM'} · {nivelAluno}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setViewMode('overview')}
                  className={`px-4 py-2 rounded-xl text-sm font-semibold border ${darkMode ? 'border-slate-600 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                >
                  ← Voltar ao diagnóstico
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-lg"
                >
                  ⬇️ Download PDF
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-4 text-sm">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${darkMode ? 'border-slate-700 text-slate-200' : 'border-slate-200 text-slate-600'}`}>
                <span>🗓️</span>
                {dataCorrecaoFormatada}
              </div>
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border ${darkMode ? 'border-slate-700 text-slate-200' : 'border-slate-200 text-slate-600'}`}>
                <span>📝</span>
                {wordCount} palavras
              </div>
              <div className={badgeClasses}>{statusBadge.label}</div>
            </div>
          </div>

          <div className={`rounded-3xl border p-8 space-y-8 ${darkMode ? 'bg-slate-900/70 border-slate-700' : 'bg-white border-slate-200 shadow-xl'}`}>
            <div className="flex items-center justify-between">
              <p className={`text-sm font-semibold tracking-[0.3em] uppercase ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Redação</p>
              <div className="flex items-center gap-3 text-xs text-black">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-300 border border-red-500 rounded" />Erro/Desvio</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-200 border border-yellow-500 rounded" />Atenção</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-200 border border-blue-500 rounded" />Sugestão</span>
              </div>
            </div>

            <div className={`text-lg leading-relaxed font-serif ${darkMode ? 'text-slate-100' : 'text-slate-900'} space-y-5`}>
              {renderTextoComErros(correcaoCompleta.textoRedacao ?? '', correcaoCompleta.errosGramaticais || [])}
            </div>

            <div className={`rounded-2xl border p-5 ${darkMode ? 'bg-slate-800 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <h4 className={`text-base font-bold ${darkMode ? 'text-blue-200' : 'text-blue-900'}`}>📌 Comentário ativo</h4>
                {erroSelecionado && (
                  <button
                    onClick={() => setErroSelecionado(null)}
                    className={`text-xs font-semibold ${darkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-500 hover:text-slate-800'}`}
                  >
                    Limpar
                  </button>
                )}
              </div>
              {erroSelecionado ? (
                <div className="mt-4 space-y-3 text-sm">
                  <div className={`p-4 rounded-xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <p className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Trecho destacado</p>
                    <p className={`mt-2 font-mono ${darkMode ? 'text-white' : 'text-slate-900'}`}>{erroSelecionado.textoOriginal}</p>
                  </div>
                  {erroSelecionado.textoSugerido && (
                    <div className={`p-4 rounded-xl border ${darkMode ? 'bg-emerald-500/5 border-emerald-400/40' : 'bg-emerald-50 border-emerald-200'}`}>
                      <p className={`text-xs font-bold uppercase tracking-widest ${darkMode ? 'text-emerald-200' : 'text-emerald-700'}`}>Sugestão</p>
                      <p className={`mt-2 font-mono ${darkMode ? 'text-white' : 'text-slate-900'}`}>{erroSelecionado.textoSugerido}</p>
                    </div>
                  )}
                  <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{erroSelecionado.explicacao}</p>
                </div>
              ) : (
                <p className={`mt-4 text-sm italic ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                  Clique em qualquer destaque para ver explicações detalhadas.
                </p>
              )}
            </div>
          </div>

          <div className={`rounded-3xl border p-6 space-y-5 ${darkMode ? 'bg-slate-900/70 border-slate-700' : 'bg-white border-slate-200 shadow-xl'}`}>
            <h3 className={`text-base font-bold uppercase tracking-[0.4em] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Feedback personalizado</h3>
            <div>
              <p className={`text-xs font-semibold text-emerald-500 mb-2`}>Pontos fortes</p>
              {pontosPositivos.length ? (
                <ul className={`space-y-2 text-sm ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  {pontosPositivos.map((item, idx) => (
                    <li key={`positivo-detailed-${idx}`} className="flex gap-2">
                      <span className="text-emerald-400">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={`text-xs italic ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Sem destaques registrados.</p>
              )}
            </div>
            <div>
              <p className={`text-xs font-semibold text-amber-500 mb-2`}>Pontos de atenção</p>
              {pontosMelhoria.length ? (
                <ul className={`space-y-2 text-sm ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  {pontosMelhoria.map((item, idx) => (
                    <li key={`melhoria-detailed-${idx}`} className="flex gap-2">
                      <span className="text-amber-400">•</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className={`text-xs italic ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Nenhum alerta crítico.</p>
              )}
            </div>
            {recomendacoes.length > 0 && (
              <div>
                <p className={`text-xs font-semibold text-blue-500 mb-2`}>Próximos passos sugeridos</p>
                <ul className={`space-y-2 text-sm ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  {recomendacoes.map((rec, idx) => (
                    <li key={`rec-detailed-${idx}`}>
                      <span className="font-semibold text-blue-500">{idx + 1}.</span> {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={() => navigate('/aluno/redacao/historico')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-2xl transition-colors"
            >
              Voltar ao histórico
            </button>
          </div>
        </div>

        <div className="space-y-6">
          <div className={`rounded-3xl border p-6 space-y-6 ${darkMode ? 'bg-slate-900/80 border-slate-700' : 'bg-white border-slate-200 shadow-xl'}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-xs font-semibold uppercase tracking-[0.4em] ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Nota geral</p>
                <p className={`mt-2 text-5xl font-black ${notaTotal >= 800 ? 'text-emerald-500' : notaTotal >= 600 ? 'text-amber-500' : 'text-rose-500'}`}>{notaTotal}</p>
                <p className={`text-xs mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>de 1000 pontos</p>
              </div>
              <span className={`${badgeClasses} shrink-0`}>{statusBadge.label}</span>
            </div>
            <div className="grid grid-cols-5 gap-3">
              {competencias.map((comp, idx) => {
                const accent = getAccent(comp.nota);
                return (
                  <div key={idx} className="text-center space-y-2">
                    <p className={`text-xs font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>C{idx + 1}</p>
                    <div className={`h-28 rounded-2xl border flex flex-col justify-end overflow-hidden ${darkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-100 bg-slate-50'}`}>
                      <div className={`${accent.gradient} w-full`} style={{ height: `${Math.max(8, (comp.nota / 200) * 100)}%` }} />
                    </div>
                    <p className={`text-sm font-bold ${accent.text}`}>{comp.nota}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className={`rounded-3xl border p-6 ${darkMode ? 'bg-slate-900/70 border-slate-700' : 'bg-white border-slate-200 shadow-xl'}`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-base font-bold uppercase tracking-[0.4em] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Análise detalhada</h3>
              <button
                onClick={() => setViewMode('overview')}
                className={`text-xs font-semibold ${darkMode ? 'text-blue-200 hover:text-blue-100' : 'text-blue-600 hover:text-blue-500'}`}
              >
                Ver visão geral →
              </button>
            </div>
            <div className="space-y-4">
              {competencias.map((comp, idx) => {
                const accent = getAccent(comp.nota);
                return (
                  <div key={idx} className={`rounded-2xl border-l-4 p-4 ${accent.card}`}>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className={`text-xs font-bold uppercase tracking-[0.3em] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          Competência {idx + 1}
                        </p>
                        <h4 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{comp.nomeCompetencia}</h4>
                      </div>
                      <p className={`text-2xl font-black ${accent.text}`}>{comp.nota}/200</p>
                    </div>
                    <p className={`mt-3 text-sm ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{comp.comentario}</p>
                    {comp.melhorias?.length ? (
                      <ul className={`mt-3 text-xs space-y-1 ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                        {comp.melhorias.map((melhoria, i) => (
                          <li key={i}>• {melhoria}</li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (!user) {
    return null;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200'}`}>
      <AlunoSidebar darkMode={darkMode} onToggleTheme={() => setDarkMode(!darkMode)} />

      <div className="ml-52 min-h-screen flex flex-col">
        <div className={`backdrop-blur-sm px-6 py-4 border-b flex justify-between items-center sticky top-0 z-40 transition-colors duration-300 ${darkMode ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white/90 border-slate-200 shadow-sm'}`}>
          <div>
            <h1 className={`text-xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>📊 Correção de Redação</h1>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {isProcessando ? 'Aguarde enquanto processamos sua redação...' : 'Correção concluída!'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationDropdown darkMode={darkMode} />
            <ProfileMenu user={user} darkMode={darkMode} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />
          </div>
        </div>

        <div className="flex-1 p-6">
          <div className="max-w-screen-2xl mx-auto w-full">
            {isLoading && (
              <div className={`rounded-2xl shadow-lg border p-8 mb-6 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    <div>
                      <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Carregando correção...</h2>
                      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Conectando ao servidor...</p>
                    </div>
                  </div>
                </div>
                <div className="mb-6">
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden animate-pulse">
                    <div className="bg-slate-300 h-3 rounded-full w-1/4" />
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-4">
                  {[1, 2, 3, 4, 5].map((idx) => (
                    <div key={idx} className="text-center">
                      <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 animate-pulse ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                        {idx}
                      </div>
                      <div className={`h-3 rounded animate-pulse mx-auto ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`} style={{ width: '60px' }} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isLoading && !mostrarCorrecao && (
              <div className={`rounded-2xl shadow-lg border p-8 mb-6 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    {isProcessando ? (
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xl">✓</div>
                    )}
                    <div>
                      <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {isProcessando ? 'Processando redação' : 'Correção concluída!'}
                      </h2>
                      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {isProcessando ? (isConnected ? '🟢 Conectado ao servidor' : '🔴 Reconectando...') : '✨ Sua redação foi corrigida com sucesso'}
                      </p>
                    </div>
                  </div>
                  <div className={`text-4xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>{progresso}%</div>
                </div>

                <div className="mb-6">
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-500 ease-out ${isConcluida ? 'bg-gradient-to-r from-green-500 to-green-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'}`}
                      style={{ width: `${progresso}%` }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-4 mb-6">
                  {[
                    { label: 'Iniciando', min: 0, max: 20 },
                    { label: 'Analisando', min: 20, max: 50 },
                    { label: 'Avaliando', min: 50, max: 75 },
                    { label: 'Gerando feedback', min: 75, max: 95 },
                    { label: 'Finalizando', min: 95, max: 100 }
                  ].map((step, idx) => (
                    <div key={idx} className="text-center">
                      <div className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2 transition-colors ${
                        progresso >= step.max
                          ? 'bg-green-500 text-white'
                          : progresso >= step.min
                          ? 'bg-blue-500 text-white animate-pulse'
                          : darkMode
                          ? 'bg-slate-700 text-slate-400'
                          : 'bg-slate-200 text-slate-500'
                      }`}>
                        {progresso >= step.max ? '✓' : idx + 1}
                      </div>
                      <p className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{step.label}</p>
                    </div>
                  ))}
                </div>

                {isConcluida && correcaoId && (
                  <button
                    onClick={() => loadCorrecaoCompleta(correcaoId)}
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-[1.02] shadow-lg"
                  >
                    📊 Ver correção completa
                  </button>
                )}

                {sseError && (
                  <div className="mt-4 p-4 bg-red-100 border border-red-300 rounded-lg text-red-800 text-sm">⚠️ {sseError}</div>
                )}
              </div>
            )}

            {mostrarCorrecao && isConcluida && correcaoCompleta && (
              viewMode === 'overview' ? renderOverviewSection() : renderDetailedSection()
            )}

            {isErro && (
              <div className={`rounded-2xl shadow-lg border p-8 text-center ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Erro ao processar redação</h2>
                <p className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Ocorreu um erro durante o processamento. Por favor, tente novamente.</p>
                <button
                  onClick={() => navigate('/aluno/redacao/historico')}
                  className="mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Voltar ao histórico
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
