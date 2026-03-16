import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authService } from '../../services/authService';
import { professorService } from '../../services/professorService';
import type { ExecucaoAlunoResumo, ExecucaoDetalhada } from '../../services/professorService';
import type { User } from '../../types';

export default function VerResultadosAtividade() {
  const navigate = useNavigate();
  const { atividadeId } = useParams<{ atividadeId: string }>();
  const [professor, setProfessor] = useState<User | null>(null);
  const [execucoes, setExecucoes] = useState<ExecucaoAlunoResumo[]>([]);
  const [detalhe, setDetalhe] = useState<ExecucaoDetalhada | null>(null);
  const [loading, setLoading] = useState(true);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'Professor') { navigate('/login'); return; }
    setProfessor(user);

    if (atividadeId && user.id) {
      carregarExecucoes(parseInt(atividadeId), user.id);
    }
  }, [navigate, atividadeId]);

  const carregarExecucoes = async (ativId: number, profId: number) => {
    setLoading(true);
    try {
      const data = await professorService.listarExecucoesAtividade(ativId, profId);
      setExecucoes(data);
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Erro ao carregar resultados' });
    } finally {
      setLoading(false);
    }
  };

  const verDetalhes = async (execucaoId: number) => {
    if (!professor?.id) return;
    try {
      const data = await professorService.obterExecucaoDetalhada(execucaoId, professor.id);
      setDetalhe(data);
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Erro ao carregar detalhes' });
    }
  };

  if (!professor) return null;

  const notaCor = (nota?: number) => {
    if (nota == null) return 'text-slate-500';
    if (nota >= 7) return 'text-green-600';
    if (nota >= 5) return 'text-yellow-600';
    return 'text-red-600';
  };

  const notaBg = (nota?: number) => {
    if (nota == null) return 'bg-slate-100';
    if (nota >= 7) return 'bg-green-100';
    if (nota >= 5) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/professor/atividades')} className="text-slate-500 hover:text-slate-900 transition-colors">
              ← Voltar
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900">
                Resultados dos Alunos
              </h1>
              {execucoes.length > 0 && (
                <p className="text-xs text-slate-500">
                  {execucoes[0].atividadeNome} • {execucoes.length} {execucoes.length === 1 ? 'resposta' : 'respostas'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mensagem */}
      {mensagem && (
        <div className="max-w-5xl mx-auto px-4 mt-4">
          <div className={`p-4 rounded-xl font-medium text-sm ${
            mensagem.tipo === 'sucesso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {mensagem.texto}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto p-4 pb-20">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4" />
            <p className="text-slate-500">Carregando resultados...</p>
          </div>
        ) : execucoes.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-lg font-medium text-slate-700">Nenhum aluno respondeu ainda</p>
            <p className="text-sm text-slate-500 mt-1">Os resultados aparecerão aqui quando os alunos completarem a atividade</p>
          </div>
        ) : (
          <>
            {/* Resumo */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <p className="text-xs text-slate-500">Respostas</p>
                <p className="text-2xl font-bold text-slate-900">{execucoes.length}</p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <p className="text-xs text-slate-500">Média da turma</p>
                <p className={`text-2xl font-bold ${notaCor(
                  execucoes.reduce((sum, e) => sum + (e.nota || 0), 0) / execucoes.length
                )}`}>
                  {(execucoes.reduce((sum, e) => sum + (e.nota || 0), 0) / execucoes.length).toFixed(1)}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <p className="text-xs text-slate-500">Maior nota</p>
                <p className="text-2xl font-bold text-green-600">
                  {Math.max(...execucoes.map(e => e.nota || 0)).toFixed(1)}
                </p>
              </div>
              <div className="bg-white rounded-xl p-4 border border-slate-200">
                <p className="text-xs text-slate-500">Menor nota</p>
                <p className="text-2xl font-bold text-red-600">
                  {Math.min(...execucoes.map(e => e.nota || 0)).toFixed(1)}
                </p>
              </div>
            </div>

            {/* Lista de alunos */}
            <div className="space-y-3">
              {execucoes.map(exec => (
                <div
                  key={exec.execucaoId}
                  className="bg-white rounded-2xl border border-slate-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => verDetalhes(exec.execucaoId)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm">
                        {exec.alunoNome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900">{exec.alunoNome}</h3>
                        <p className="text-xs text-slate-500">
                          {exec.acertos}/{exec.totalQuestoes} acertos
                          {exec.dataFim && ` • ${new Date(exec.dataFim).toLocaleString('pt-BR')}`}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className={`px-4 py-2 rounded-xl font-bold text-lg ${notaBg(exec.nota)} ${notaCor(exec.nota)}`}>
                        {exec.nota != null ? exec.nota.toFixed(1) : '-'}
                      </div>
                      <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal Detalhes */}
      {detalhe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-3xl bg-white rounded-2xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header do modal */}
            <div className="p-6 border-b border-slate-200 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Respostas de {detalhe.alunoNome}
                  </h2>
                  <p className="text-sm text-slate-500 mt-1">
                    {detalhe.atividadeNome} • {detalhe.acertos}/{detalhe.totalQuestoes} acertos •
                    Nota: <span className={`font-bold ${notaCor(detalhe.nota)}`}>{detalhe.nota?.toFixed(1) ?? '-'}</span>
                  </p>
                </div>
                <button
                  onClick={() => setDetalhe(null)}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Questões */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {detalhe.questoes.map(q => {
                const acertou = q.resultado === 'Acerto';
                const pulou = q.resultado === 'Pulou' || !q.respostaAluno;
                return (
                  <div
                    key={q.numeroQuestao}
                    className={`rounded-xl border-2 p-4 ${
                      acertou ? 'border-green-300 bg-green-50/50' :
                      pulou ? 'border-slate-200 bg-slate-50' :
                      'border-red-300 bg-red-50/50'
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                        acertou ? 'bg-green-500 text-white' :
                        pulou ? 'bg-slate-300 text-slate-600' :
                        'bg-red-500 text-white'
                      }`}>
                        {q.numeroQuestao}
                      </span>
                      <div className="flex-1">
                        {q.enunciado && (
                          <p className="text-sm text-slate-800 font-medium mb-2">{q.enunciado}</p>
                        )}

                        {/* Alternativas com indicação visual */}
                        {q.alternativas && q.alternativas.length > 0 && (
                          <div className="space-y-1.5 mb-3">
                            {q.alternativas.map(alt => {
                              const isRespostaAluno = alt.id === q.respostaAluno;
                              const isCorreta = alt.id === q.respostaCorreta;
                              return (
                                <div
                                  key={alt.id}
                                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${
                                    isCorreta && isRespostaAluno ? 'bg-green-100 border-2 border-green-400' :
                                    isCorreta ? 'bg-green-100 border-2 border-green-300' :
                                    isRespostaAluno ? 'bg-red-100 border-2 border-red-300' :
                                    'bg-white border border-slate-200'
                                  }`}
                                >
                                  <span className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                    isCorreta ? 'bg-green-500 text-white' :
                                    isRespostaAluno ? 'bg-red-500 text-white' :
                                    'bg-slate-200 text-slate-600'
                                  }`}>
                                    {alt.id}
                                  </span>
                                  <span className={
                                    isCorreta ? 'text-green-800 font-medium' :
                                    isRespostaAluno ? 'text-red-800' :
                                    'text-slate-700'
                                  }>
                                    {alt.texto}
                                  </span>
                                  {isCorreta && <span className="ml-auto text-green-600 text-xs font-bold">✓ Correta</span>}
                                  {isRespostaAluno && !isCorreta && <span className="ml-auto text-red-600 text-xs font-bold">✗ Marcou</span>}
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {/* Sem alternativas - mostrar apenas texto */}
                        {(!q.alternativas || q.alternativas.length === 0) && (
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500">Resposta do aluno:</span>
                              <span className={`font-medium ${acertou ? 'text-green-700' : 'text-red-700'}`}>
                                {q.respostaAluno || '(não respondeu)'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-slate-500">Resposta correta:</span>
                              <span className="font-medium text-green-700">{q.respostaCorreta}</span>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Badge resultado */}
                      <span className={`px-2 py-1 rounded-lg text-xs font-bold flex-shrink-0 ${
                        acertou ? 'bg-green-500 text-white' :
                        pulou ? 'bg-slate-300 text-slate-600' :
                        'bg-red-500 text-white'
                      }`}>
                        {acertou ? '✓ Acertou' : pulou ? '— Pulou' : '✗ Errou'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 flex-shrink-0">
              <button
                onClick={() => setDetalhe(null)}
                className="w-full py-3 bg-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-300 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
