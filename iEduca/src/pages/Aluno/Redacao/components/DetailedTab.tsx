import { useState } from 'react';
import type { ExtendedEssayCorrection, ViewMode } from '../types';
import { getAccentByNota } from '../utils';
import { TabBar } from './TabBar';
import { TextoComErros } from './TextoComErros';

interface Props {
  correcaoCompleta: ExtendedEssayCorrection;
  darkMode: boolean;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export function DetailedTab({ correcaoCompleta, darkMode, viewMode, setViewMode }: Props) {
  const [erroSelecionado, setErroSelecionado] = useState<any>(null);

  const competencias = correcaoCompleta.competencias ?? [];
  const pontosPositivos = correcaoCompleta.feedbacks?.pontosPositivos ?? [];
  const pontosMelhoria = correcaoCompleta.feedbacks?.pontosMelhoria ?? [];
  const recomendacoes = correcaoCompleta.feedbacks?.recomendacoes ?? [];
  const notaTotal = correcaoCompleta.notaTotal ?? 0;

  const dataCorrecaoIso = (correcaoCompleta as any)?.dataCorrecao
    ?? (correcaoCompleta as any)?.dataConclusao
    ?? (correcaoCompleta as any)?.dataCriacao;
  const dataCorrecaoFormatada = dataCorrecaoIso
    ? new Date(dataCorrecaoIso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Correção recente';

  const wordCount = correcaoCompleta.textoRedacao?.split(/\s+/).filter(Boolean).length ?? 0;

  const statusBadge = notaTotal >= 800
    ? { label: 'APROVADO', light: 'bg-emerald-50 border border-emerald-200 text-emerald-700', dark: 'bg-emerald-500/10 border border-emerald-400/40 text-emerald-200' }
    : notaTotal >= 600
    ? { label: 'EM REVISÃO', light: 'bg-amber-50 border border-amber-200 text-amber-700', dark: 'bg-amber-500/10 border border-amber-400/40 text-amber-200' }
    : { label: 'REFAZER', light: 'bg-rose-50 border border-rose-200 text-rose-700', dark: 'bg-rose-500/10 border border-rose-400/40 text-rose-200' };

  const badgeClasses = `${darkMode ? statusBadge.dark : statusBadge.light} px-4 py-1 rounded-full text-[0.7rem] font-black tracking-[0.3em]`;

  return (
    <div className="space-y-6">
      <TabBar viewMode={viewMode} setViewMode={setViewMode} correcaoCompleta={correcaoCompleta} darkMode={darkMode} />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)] gap-6">
        {/* Main column */}
        <div className="space-y-6">
          {/* Toolbar */}
          <div className={`rounded-3xl border p-8 ${darkMode ? 'bg-slate-900/80 border-slate-700' : 'bg-white border-slate-200 shadow-xl'}`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
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

          {/* Essay text with errors */}
          <div className={`rounded-3xl border p-8 space-y-8 ${darkMode ? 'bg-slate-900/70 border-slate-700' : 'bg-white border-slate-200 shadow-xl'}`}>
            <div className="flex items-center justify-between">
              <p className={`text-sm font-semibold tracking-[0.3em] uppercase ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Redação</p>
              <div className="flex items-center gap-3 text-xs text-black">
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-300 border border-red-500 rounded" />Erro/Desvio</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-yellow-200 border border-yellow-500 rounded" />Atenção</span>
                <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-200 border border-blue-500 rounded" />Sugestão</span>
                {correcaoCompleta.revisaoProfessor?.grifos && correcaoCompleta.revisaoProfessor.grifos.length > 0 && (
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded" style={{ backgroundColor: 'rgba(168,85,247,0.4)', border: '1px solid #a855f7' }} />Professor</span>
                )}
              </div>
            </div>

            <div className={`text-lg leading-relaxed font-serif ${darkMode ? 'text-slate-100' : 'text-slate-900'} space-y-5`}>
              <TextoComErros
                texto={correcaoCompleta.textoRedacao ?? ''}
                erros={correcaoCompleta.errosGramaticais || []}
                onErroClick={setErroSelecionado}
                grifos={correcaoCompleta.revisaoProfessor?.grifos}
              />
            </div>

            {/* Active comment */}
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

          {/* Feedback section */}
          <div className={`rounded-3xl border p-6 space-y-5 ${darkMode ? 'bg-slate-900/70 border-slate-700' : 'bg-white border-slate-200 shadow-xl'}`}>
            <h3 className={`text-base font-bold uppercase tracking-[0.4em] ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Feedback personalizado</h3>
            <div>
              <p className="text-xs font-semibold text-emerald-500 mb-2">Pontos fortes</p>
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
              <p className="text-xs font-semibold text-amber-500 mb-2">Pontos de atenção</p>
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
                <p className="text-xs font-semibold text-blue-500 mb-2">Próximos passos sugeridos</p>
                <ul className={`space-y-2 text-sm ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  {recomendacoes.map((rec, idx) => (
                    <li key={`rec-detailed-${idx}`}>
                      <span className="font-semibold text-blue-500">{idx + 1}.</span> {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Score card */}
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
                const accent = getAccentByNota(comp.nota, darkMode);
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

          {/* Detailed analysis */}
          <div className={`rounded-3xl border p-6 ${darkMode ? 'bg-slate-900/70 border-slate-700' : 'bg-white border-slate-200 shadow-xl'}`}>
            <h3 className={`text-base font-bold uppercase tracking-[0.4em] mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Análise detalhada</h3>
            <div className="space-y-4">
              {competencias.map((comp, idx) => {
                const accent = getAccentByNota(comp.nota, darkMode);
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
    </div>
  );
}
