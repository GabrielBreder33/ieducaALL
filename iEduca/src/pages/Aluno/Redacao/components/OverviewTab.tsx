import { useMemo } from 'react';
import type { ExtendedEssayCorrection, CompetencyScore, HighlightTone, ViewMode } from '../types';
import { getToneClasses, getCompetenciaStyles } from '../utils';
import { TabBar } from './TabBar';

interface Props {
  correcaoCompleta: ExtendedEssayCorrection;
  darkMode: boolean;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export function OverviewTab({ correcaoCompleta, darkMode, viewMode, setViewMode }: Props) {
  const competencias = correcaoCompleta.competencias ?? [];

  const sortedCompetencias = useMemo(() => {
    if (!competencias.length) return [] as CompetencyScore[];
    return [...competencias].sort((a, b) => b.nota - a.nota);
  }, [competencias]);

  const bestCompetencia = sortedCompetencias[0];
  const weakestCompetencia = sortedCompetencias[sortedCompetencias.length - 1];
  const pontosPositivos = correcaoCompleta.feedbacks?.pontosPositivos ?? [];
  const pontosMelhoria = correcaoCompleta.feedbacks?.pontosMelhoria ?? [];
  const notaTotal = correcaoCompleta.notaTotal ?? 0;

  const dataCorrecaoIso = (correcaoCompleta as any)?.dataCorrecao
    ?? (correcaoCompleta as any)?.dataConclusao
    ?? (correcaoCompleta as any)?.dataCriacao;
  const dataCorrecaoFormatada = dataCorrecaoIso
    ? new Date(dataCorrecaoIso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Correção recente';

  const nivelAluno = notaTotal >= 800 ? 'Avançado' : notaTotal >= 600 ? 'Intermediário' : 'Em desenvolvimento';

  const overviewHighlights = useMemo(() => {
    const highlights: Array<{ title: string; label: string; description: string; tone: HighlightTone; icon: string }> = [
      {
        title: 'Ponto Forte',
        label: bestCompetencia?.nomeCompetencia || 'Estrutura sintática',
        description: bestCompetencia?.comentario || pontosPositivos[0] || 'Assim que finalizarmos a correção você vê os destaques aqui.',
        tone: 'success',
        icon: '🛡️',
      },
      {
        title: 'Progressão',
        label: notaTotal >= 800 ? 'Tese consistente' : notaTotal >= 600 ? 'Boa evolução' : 'Em construção',
        description: correcaoCompleta.resumoFinal || pontosPositivos[1] || 'Use o diagnóstico executivo para acompanhar sua jornada.',
        tone: 'neutral',
        icon: '📈',
      },
      {
        title: 'Atenção crítica',
        label: weakestCompetencia?.nomeCompetencia || 'Intervenção (Comp. 5)',
        description: pontosMelhoria[0] || weakestCompetencia?.comentario || 'Nenhum alerta crítico nesta correção.',
        tone: 'warning',
        icon: '⚠️',
      },
    ];
    return highlights;
  }, [bestCompetencia, weakestCompetencia, pontosPositivos, pontosMelhoria, notaTotal, correcaoCompleta]);

  return (
    <div className="space-y-6">
      <TabBar viewMode={viewMode} setViewMode={setViewMode} correcaoCompleta={correcaoCompleta} darkMode={darkMode} />

      {/* Diagnóstico executivo header */}
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
          <div className="flex items-center gap-4">
            <div className={`rounded-2xl p-6 text-center border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <p className={`text-sm font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Nota IA</p>
              <div className={`text-6xl font-black ${notaTotal >= 800 ? 'text-green-500' : notaTotal >= 600 ? 'text-yellow-500' : 'text-orange-500'}`}>
                {notaTotal}
              </div>
              <p className={`mt-1 text-xs tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>/ 1000 pontos</p>
              <p className={`mt-3 text-sm font-semibold ${darkMode ? 'text-blue-200' : 'text-blue-700'}`}>{nivelAluno}</p>
            </div>
            {correcaoCompleta.revisaoProfessor && (
              <div className={`rounded-2xl p-6 text-center border-2 ${darkMode ? 'bg-purple-500/5 border-purple-400/40' : 'bg-purple-50 border-purple-200'}`}>
                <p className={`text-sm font-semibold ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>Nota Professor</p>
                <div className={`text-6xl font-black ${
                  correcaoCompleta.revisaoProfessor.notaTotalProfessor >= 800 ? 'text-green-500'
                  : correcaoCompleta.revisaoProfessor.notaTotalProfessor >= 600 ? 'text-yellow-500'
                  : 'text-orange-500'
                }`}>
                  {correcaoCompleta.revisaoProfessor.notaTotalProfessor}
                </div>
                <p className={`mt-1 text-xs tracking-widest ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>/ 1000 pontos</p>
                <p className={`mt-3 text-xs ${darkMode ? 'text-purple-300' : 'text-purple-600'}`}>
                  {correcaoCompleta.revisaoProfessor.professorNome}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Highlights cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {overviewHighlights.map((highlight, idx) => {
          const tone = getToneClasses(highlight.tone, darkMode);
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

      {/* Competências grid */}
      <div className={`rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'} p-6`}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <p className={`text-xs uppercase tracking-[0.4em] font-semibold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Visão geral</p>
            <h3 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Competências avaliadas</h3>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-4">
          {competencias.map((comp, idx) => {
            const styles = getCompetenciaStyles(comp.nota, darkMode);
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
}
