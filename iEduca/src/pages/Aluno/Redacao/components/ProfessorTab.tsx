import { useNavigate } from 'react-router-dom';
import type { ExtendedEssayCorrection, ViewMode } from '../types';
import { COMPETENCIA_NOMES } from '../utils';
import { TabBar } from './TabBar';

interface Props {
  correcaoCompleta: ExtendedEssayCorrection;
  darkMode: boolean;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
}

export function ProfessorTab({ correcaoCompleta, darkMode, viewMode, setViewMode }: Props) {
  const navigate = useNavigate();

  const rev = correcaoCompleta.revisaoProfessor;
  if (!rev) return null;

  const competencias = correcaoCompleta.competencias ?? [];
  const notaTotal = correcaoCompleta.notaTotal ?? 0;
  const diffTotal = rev.notaTotalProfessor - notaTotal;

  return (
    <div className="space-y-6">
      <TabBar viewMode={viewMode} setViewMode={setViewMode} correcaoCompleta={correcaoCompleta} darkMode={darkMode} />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,2fr)_minmax(340px,1fr)] gap-6">
        {/* Main column */}
        <div className="space-y-6">
          {/* Header */}
          <div className={`rounded-3xl border shadow-2xl overflow-hidden ${darkMode ? 'border-purple-400/30' : 'border-purple-200'}`}>
            <div className="h-2 w-full bg-gradient-to-r from-purple-500 via-violet-500 to-fuchsia-500" />
            <div className={`p-8 ${darkMode ? 'bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-900' : 'bg-gradient-to-br from-purple-50/80 via-white to-white'}`}>
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{rev.professorNome}</p>
                      <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Professor avaliador · {new Date(rev.criadoEm).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className={`text-xs uppercase tracking-[0.3em] font-semibold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>Redação avaliada</p>
                    <h2 className={`mt-1 text-2xl lg:text-3xl font-black leading-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {correcaoCompleta.tema}
                    </h2>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* General comment */}
          {rev.comentarioGeral && (
            <div className={`rounded-3xl border p-6 ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-xl'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${darkMode ? 'bg-purple-500/15' : 'bg-purple-50'}`}>
                  <span className="text-lg">💬</span>
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Comentário Geral</h3>
                  <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Avaliação do professor sobre a redação</p>
                </div>
              </div>
              <div className={`p-5 rounded-2xl border-l-4 border-purple-500 ${darkMode ? 'bg-slate-800/50' : 'bg-purple-50/50'}`}>
                <p className={`text-base leading-relaxed italic ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>
                  "{rev.comentarioGeral}"
                </p>
              </div>
            </div>
          )}

          {/* Competency details */}
          <div className={`rounded-3xl border ${darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200 shadow-xl'} p-6`}>
            <div className="mb-6">
              <p className={`text-xs uppercase tracking-[0.4em] font-semibold ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Detalhamento</p>
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Avaliação por Competência</h3>
            </div>

            <div className="space-y-4">
              {rev.competencias.map((comp) => {
                const iaComp = competencias.find(c => c.numeroCompetencia === comp.numeroCompetencia);
                const iaNota = iaComp?.nota ?? 0;
                const diff = comp.notaProfessor - iaNota;

                const profColor = comp.notaProfessor >= 160 ? 'text-emerald-500'
                  : comp.notaProfessor >= 120 ? 'text-blue-500'
                  : comp.notaProfessor >= 80 ? 'text-amber-500'
                  : 'text-rose-500';

                return (
                  <div key={comp.numeroCompetencia} className={`rounded-2xl border overflow-hidden ${darkMode ? 'bg-slate-800/40 border-slate-700' : 'bg-white border-slate-100 shadow-sm'}`}>
                    <div className={`h-1 w-full ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                      <div className="h-full bg-gradient-to-r from-purple-500 to-violet-500 transition-all" style={{ width: `${(comp.notaProfessor / 200) * 100}%` }} />
                    </div>

                    <div className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black ${darkMode ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                            C{comp.numeroCompetencia}
                          </div>
                          <p className={`text-sm font-semibold ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                            {COMPETENCIA_NOMES[comp.numeroCompetencia - 1] || ''}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${darkMode ? 'bg-purple-500/10 border border-purple-400/30' : 'bg-purple-50 border border-purple-100'}`}>
                            <span className={`text-[10px] font-bold uppercase ${darkMode ? 'text-purple-400' : 'text-purple-500'}`}>Prof</span>
                            <span className={`text-lg font-black ${profColor}`}>{comp.notaProfessor}</span>
                          </div>
                          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${darkMode ? 'bg-blue-500/10 border border-blue-400/30' : 'bg-blue-50 border border-blue-100'}`}>
                            <span className={`text-[10px] font-bold uppercase ${darkMode ? 'text-blue-400' : 'text-blue-500'}`}>IA</span>
                            <span className={`text-lg font-bold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>{iaNota}</span>
                          </div>
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${
                            diff > 0 ? (darkMode ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-400/30' : 'bg-emerald-50 text-emerald-600 border border-emerald-100')
                            : diff < 0 ? (darkMode ? 'bg-rose-500/10 text-rose-300 border border-rose-400/30' : 'bg-rose-50 text-rose-600 border border-rose-100')
                            : (darkMode ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500')
                          }`}>
                            {diff > 0 ? `+${diff}` : diff < 0 ? `${diff}` : '='}
                          </span>
                        </div>
                      </div>

                      {/* Comparison bars */}
                      <div className="space-y-2 mb-3">
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] w-12 text-right font-semibold ${darkMode ? 'text-purple-300' : 'text-purple-600'}`}>Prof</span>
                          <div className={`flex-1 rounded-full h-3 overflow-hidden ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                            <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-500 transition-all" style={{ width: `${(comp.notaProfessor / 200) * 100}%` }} />
                          </div>
                          <span className={`text-xs font-bold w-10 ${profColor}`}>{comp.notaProfessor}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] w-12 text-right font-semibold ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>IA</span>
                          <div className={`flex-1 rounded-full h-3 overflow-hidden ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                            <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all" style={{ width: `${(iaNota / 200) * 100}%` }} />
                          </div>
                          <span className={`text-xs font-bold w-10 ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>{iaNota}</span>
                        </div>
                      </div>

                      {comp.comentarioProfessor && (
                        <div className={`mt-4 p-4 rounded-xl border-l-4 border-purple-500 ${darkMode ? 'bg-purple-500/5' : 'bg-purple-50/60'}`}>
                          <p className={`text-xs font-bold uppercase tracking-widest mb-1.5 ${darkMode ? 'text-purple-300' : 'text-purple-700'}`}>💬 Comentário do Professor</p>
                          <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-200' : 'text-slate-700'}`}>{comp.comentarioProfessor}</p>
                        </div>
                      )}

                      {iaComp?.comentario && (
                        <div className={`mt-2 p-4 rounded-xl border-l-4 ${darkMode ? 'border-blue-500/40 bg-blue-500/5' : 'border-blue-300 bg-blue-50/40'}`}>
                          <p className={`text-xs font-bold uppercase tracking-widest mb-1.5 ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>🤖 Comentário da IA</p>
                          <p className={`text-sm leading-relaxed ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>{iaComp.comentario}</p>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-6">
          {/* Comparative scores */}
          <div className={`rounded-3xl border p-6 ${darkMode ? 'bg-slate-900/80 border-slate-700' : 'bg-white border-slate-200 shadow-xl'}`}>
            <p className={`text-xs uppercase tracking-[0.4em] font-semibold mb-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Notas comparativas</p>

            <div className="flex items-center justify-between mb-6">
              <div className="text-center flex-1">
                <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-purple-300' : 'text-purple-600'}`}>Professor</p>
                <p className={`text-5xl font-black ${rev.notaTotalProfessor >= 800 ? 'text-emerald-500' : rev.notaTotalProfessor >= 600 ? 'text-amber-500' : 'text-rose-500'}`}>
                  {rev.notaTotalProfessor}
                </p>
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>/ 1000</p>
              </div>
              <div className={`px-4 py-2 rounded-xl text-center ${darkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>
                <span className={`text-lg font-black ${
                  diffTotal > 0 ? 'text-emerald-500' : diffTotal < 0 ? 'text-rose-500' : (darkMode ? 'text-slate-400' : 'text-slate-500')
                }`}>
                  {diffTotal > 0 ? `+${diffTotal}` : diffTotal < 0 ? `${diffTotal}` : '='}
                </span>
                <p className={`text-[10px] ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>diferença</p>
              </div>
              <div className="text-center flex-1">
                <p className={`text-xs font-semibold mb-1 ${darkMode ? 'text-blue-300' : 'text-blue-600'}`}>IA</p>
                <p className={`text-3xl font-bold ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                  {notaTotal}
                </p>
                <p className={`text-xs mt-0.5 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>/ 1000</p>
              </div>
            </div>

            {/* Mini bar chart */}
            <div className="space-y-3">
              {rev.competencias.map((comp) => {
                const iaComp = competencias.find(c => c.numeroCompetencia === comp.numeroCompetencia);
                const iaNota = iaComp?.nota ?? 0;
                return (
                  <div key={comp.numeroCompetencia}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>C{comp.numeroCompetencia}</span>
                      <div className="flex gap-3">
                        <span className={`text-xs font-bold ${darkMode ? 'text-purple-300' : 'text-purple-600'}`}>{comp.notaProfessor}</span>
                        <span className={`text-xs font-bold ${darkMode ? 'text-blue-300' : 'text-blue-500'}`}>{iaNota}</span>
                      </div>
                    </div>
                    <div className="relative">
                      <div className={`h-2 rounded-full ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                        <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-violet-500" style={{ width: `${(comp.notaProfessor / 200) * 100}%` }} />
                      </div>
                      <div className={`h-2 rounded-full mt-1 ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                        <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 opacity-60" style={{ width: `${(iaNota / 200) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-dashed" style={{ borderColor: darkMode ? '#334155' : '#e2e8f0' }}>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
                <span className={`text-[10px] font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Professor</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                <span className={`text-[10px] font-medium ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>IA</span>
              </div>
            </div>
          </div>

          {/* Review summary */}
          <div className={`rounded-3xl border p-6 ${darkMode ? 'bg-slate-900/70 border-slate-700' : 'bg-white border-slate-200 shadow-xl'}`}>
            <p className={`text-xs uppercase tracking-[0.4em] font-semibold mb-4 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Resumo da revisão</p>
            <div className="space-y-3">
              {rev.competencias.map((comp) => {
                const iaComp = competencias.find(c => c.numeroCompetencia === comp.numeroCompetencia);
                const iaNota = iaComp?.nota ?? 0;
                const diff = comp.notaProfessor - iaNota;
                const emoji = diff > 20 ? '🟢' : diff > 0 ? '🔵' : diff === 0 ? '⚪' : diff > -20 ? '🟡' : '🔴';
                return (
                  <div key={comp.numeroCompetencia} className={`flex items-center gap-3 p-3 rounded-xl ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                    <span>{emoji}</span>
                    <div className="flex-1">
                      <p className={`text-xs font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>C{comp.numeroCompetencia} — {COMPETENCIA_NOMES[comp.numeroCompetencia - 1]}</p>
                    </div>
                    <span className={`text-xs font-bold ${diff > 0 ? 'text-emerald-500' : diff < 0 ? 'text-rose-500' : (darkMode ? 'text-slate-400' : 'text-slate-500')}`}>
                      {diff > 0 ? `+${diff}` : diff === 0 ? '=' : diff}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Back button */}
          <button
            onClick={() => navigate('/aluno/redacao/historico')}
            className={`w-full px-6 py-3 rounded-2xl text-sm font-semibold border ${darkMode ? 'border-slate-600 text-slate-200 hover:bg-slate-800' : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
          >
            ← Voltar ao histórico
          </button>
        </div>
      </div>
    </div>
  );
}
