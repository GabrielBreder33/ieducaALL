import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { professorService } from '../../services/professorService';
import type {
  RedacaoAlunoList,
  RedacaoDetalhada,
  ProfessorRedacaoRevisao,
  CompetenciaRevisaoItem,
} from '../../services/professorService';
import type { User } from '../../types';
import { NotificationDropdown, ProfileMenu } from '../../components/Dashboard';

const COMPETENCIA_NOMES = [
  'Domínio da Norma Culta',
  'Compreensão da Proposta',
  'Seleção e Organização',
  'Conhecimento dos Mecanismos Linguísticos',
  'Proposta de Intervenção',
];

export default function CorrigirRedacoes() {
  const navigate = useNavigate();
  const [professor, setProfessor] = useState<User | null>(null);
  const [darkMode] = useState(false);
  const [redacoes, setRedacoes] = useState<RedacaoAlunoList[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState<'todas' | 'pendentes' | 'revisadas'>('todas');

  // Correção/Revisão
  const [redacaoSelecionada, setRedacaoSelecionada] = useState<RedacaoDetalhada | null>(null);
  const [revisaoExistente, setRevisaoExistente] = useState<ProfessorRedacaoRevisao | null>(null);
  const [loadingRedacao, setLoadingRedacao] = useState(false);
  const [salvandoRevisao, setSalvandoRevisao] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);
  const [redacaoIdAberta, setRedacaoIdAberta] = useState<number | null>(null);

  // Form revisão
  const [notaTotal, setNotaTotal] = useState(0);
  const [comentarioGeral, setComentarioGeral] = useState('');
  const [competencias, setCompetencias] = useState<CompetenciaRevisaoItem[]>(
    [1, 2, 3, 4, 5].map(n => ({ numeroCompetencia: n, notaProfessor: 0, comentarioProfessor: '' }))
  );

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'Professor') {
      navigate('/login');
      return;
    }
    setProfessor(user);
    carregarRedacoes(user.idEscola || 0);
  }, [navigate]);

  const carregarRedacoes = async (escolaId: number) => {
    setLoading(true);
    try {
      const data = await professorService.listarRedacoesAlunos(escolaId);
      setRedacoes(data);
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Erro ao carregar redações' });
    } finally {
      setLoading(false);
    }
  };

  const abrirRedacao = async (redacaoId: number) => {
    if (redacaoIdAberta === redacaoId) {
      setRedacaoIdAberta(null);
      setRedacaoSelecionada(null);
      setRevisaoExistente(null);
      return;
    }

    setLoadingRedacao(true);
    setRedacaoIdAberta(redacaoId);
    setMensagem(null);
    try {
      const [redacao, revisao] = await Promise.all([
        professorService.obterRedacao(redacaoId),
        professorService.obterRevisao(redacaoId),
      ]);
      setRedacaoSelecionada(redacao);
      setRevisaoExistente(revisao);

      if (revisao) {
        setNotaTotal(revisao.notaTotalProfessor);
        setComentarioGeral(revisao.comentarioGeral || '');
        setCompetencias(
          [1, 2, 3, 4, 5].map(n => {
            const existing = revisao.competencias.find(c => c.numeroCompetencia === n);
            return {
              numeroCompetencia: n,
              notaProfessor: existing?.notaProfessor ?? 0,
              comentarioProfessor: existing?.comentarioProfessor ?? '',
            };
          })
        );
      } else {
        // Preencher com as notas da IA como base
        setNotaTotal(redacao.notaTotal || 0);
        setComentarioGeral('');
        setCompetencias(
          [1, 2, 3, 4, 5].map(n => {
            const iaComp = redacao.competencias?.find(c => c.numeroCompetencia === n);
            return {
              numeroCompetencia: n,
              notaProfessor: iaComp?.nota ?? 0,
              comentarioProfessor: '',
            };
          })
        );
      }
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Erro ao carregar redação' });
    } finally {
      setLoadingRedacao(false);
    }
  };

  const handleCompetenciaChange = (numero: number, field: 'notaProfessor' | 'comentarioProfessor', value: number | string) => {
    setCompetencias(prev =>
      prev.map(c =>
        c.numeroCompetencia === numero
          ? { ...c, [field]: value }
          : c
      )
    );
  };

  const recalcularTotal = () => {
    const soma = competencias.reduce((acc, c) => acc + c.notaProfessor, 0);
    setNotaTotal(soma);
  };

  useEffect(() => {
    recalcularTotal();
  }, [competencias]);

  const handleSalvarRevisao = async () => {
    if (!professor?.id || !redacaoIdAberta) return;

    setSalvandoRevisao(true);
    setMensagem(null);
    try {
      if (revisaoExistente) {
        const updated = await professorService.atualizarRevisao(revisaoExistente.id, professor.id, {
          notaTotalProfessor: notaTotal,
          comentarioGeral,
          competencias,
        });
        setRevisaoExistente(updated);
        setMensagem({ tipo: 'sucesso', texto: 'Revisão atualizada com sucesso!' });
      } else {
        const created = await professorService.criarRevisao({
          redacaoCorrecaoId: redacaoIdAberta,
          professorId: professor.id,
          notaTotalProfessor: notaTotal,
          comentarioGeral,
          competencias,
        });
        setRevisaoExistente(created);
        setMensagem({ tipo: 'sucesso', texto: 'Revisão salva com sucesso!' });
      }

      // Atualizar lista
      setRedacoes(prev =>
        prev.map(r =>
          r.id === redacaoIdAberta
            ? { ...r, notaProfessor: notaTotal, revisadaPorProfessor: true }
            : r
        )
      );
    } catch (err: any) {
      setMensagem({ tipo: 'erro', texto: err.message || 'Erro ao salvar revisão' });
    } finally {
      setSalvandoRevisao(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleUpdateUser = (updatedUser: Partial<User>) => {
    if (updatedUser.nome && updatedUser.email && updatedUser.role) {
      const fullUser = { ...professor!, ...updatedUser } as User;
      setProfessor(fullUser);
      localStorage.setItem('user', JSON.stringify(fullUser));
    }
  };

  const redacoesFiltradas = redacoes.filter(r => {
    if (filtro === 'pendentes') return !r.revisadaPorProfessor && r.status !== 'processando';
    if (filtro === 'revisadas') return r.revisadaPorProfessor;
    return true;
  });

  const getStatusBadge = (r: RedacaoAlunoList) => {
    if (r.status === 'processando') {
      return <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">Processando</span>;
    }
    if (r.revisadaPorProfessor) {
      return <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">Revisada</span>;
    }
    if (r.status?.toLowerCase().includes('conclu')) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full">Pendente Revisão</span>;
    }
    return <span className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">{r.status || 'N/A'}</span>;
  };

  if (!professor) return null;

  return (
    <div className={`min-h-screen overflow-x-hidden w-full transition-colors ${
      darkMode ? 'bg-slate-900' : 'bg-slate-50'
    }`}>
      {/* Header */}
      <div className={`sticky top-0 z-40 flex justify-between items-center px-3 sm:px-6 py-3 sm:py-4 backdrop-blur-lg border-b transition-colors ${
        darkMode ? 'bg-slate-800/80 border-slate-700 shadow-lg' : 'bg-white/90 border-slate-300 shadow-sm'
      }`}>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/professor/dashboard')} className={`text-sm font-medium transition-colors ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
            ← Dashboard
          </button>
          <h1 className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Corrigir Redações
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <NotificationDropdown darkMode={darkMode} />
          <ProfileMenu user={professor} darkMode={darkMode} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-3 sm:p-5">
        {/* Mensagem */}
        {mensagem && (
          <div className={`mb-4 p-4 rounded-xl font-medium ${
            mensagem.tipo === 'sucesso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {mensagem.texto}
          </div>
        )}

        {/* Filtros */}
        <div className="flex gap-2 mb-6">
          {(['todas', 'pendentes', 'revisadas'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                filtro === f
                  ? 'bg-indigo-600 text-white'
                  : darkMode
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {f === 'todas' ? 'Todas' : f === 'pendentes' ? 'Pendentes' : 'Revisadas'}
            </button>
          ))}
        </div>

        {/* Lista */}
        {loading ? (
          <div className={`text-center py-12 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Carregando...</div>
        ) : redacoesFiltradas.length === 0 ? (
          <div className={`text-center py-12 rounded-2xl ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-600'}`}>
            <p className="text-lg font-medium">Nenhuma redação encontrada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {redacoesFiltradas.map(r => (
              <div key={r.id} className={`rounded-2xl shadow-lg overflow-hidden transition-colors ${
                darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
              }`}>
                {/* Header da redação */}
                <button
                  onClick={() => abrirRedacao(r.id)}
                  className={`w-full p-5 text-left flex flex-col sm:flex-row justify-between gap-3 transition-colors ${
                    redacaoIdAberta === r.id
                      ? darkMode ? 'bg-slate-700' : 'bg-indigo-50'
                      : darkMode ? 'hover:bg-slate-750' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {r.tema}
                      </h3>
                      {getStatusBadge(r)}
                    </div>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Aluno: <strong>{r.alunoNome}</strong>
                      {r.dataEnvio && <> · {new Date(r.dataEnvio).toLocaleDateString('pt-BR')}</>}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Nota IA</p>
                      <p className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{r.notaTotal}</p>
                    </div>
                    {r.notaProfessor != null && (
                      <div className="text-right">
                        <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>Nota Prof.</p>
                        <p className="text-lg font-bold text-indigo-500">{r.notaProfessor}</p>
                      </div>
                    )}
                    <svg className={`w-5 h-5 transition-transform ${redacaoIdAberta === r.id ? 'rotate-180' : ''} ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Painel expandido */}
                {redacaoIdAberta === r.id && (
                  <div className={`border-t p-5 ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                    {loadingRedacao ? (
                      <p className={`text-center py-8 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Carregando redação...</p>
                    ) : redacaoSelecionada && (
                      <div className="space-y-6">
                        {/* Texto da redação */}
                        <div>
                          <h4 className={`font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Texto do Aluno</h4>
                          <div className={`p-4 rounded-xl max-h-60 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed ${
                            darkMode ? 'bg-slate-900 text-slate-300' : 'bg-slate-50 text-slate-700 border border-slate-200'
                          }`}>
                            {redacaoSelecionada.textoRedacao || 'Sem texto'}
                          </div>
                        </div>

                        {/* Notas da IA */}
                        <div>
                          <h4 className={`font-bold mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            Avaliação da IA (Nota: {redacaoSelecionada.notaTotal})
                          </h4>
                          <div className="grid gap-2">
                            {redacaoSelecionada.competencias?.map(c => (
                              <div key={c.numeroCompetencia} className={`flex justify-between items-center p-3 rounded-lg ${
                                darkMode ? 'bg-slate-900' : 'bg-slate-50'
                              }`}>
                                <span className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                  C{c.numeroCompetencia}: {c.nomeCompetencia}
                                </span>
                                <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{c.nota}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Resumo IA */}
                        {redacaoSelecionada.resumoFinal && (
                          <div>
                            <h4 className={`font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Resumo da IA</h4>
                            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                              {redacaoSelecionada.resumoFinal}
                            </p>
                          </div>
                        )}

                        {/* Formulário de revisão do professor */}
                        <div className={`p-5 rounded-xl border-2 ${
                          darkMode ? 'bg-slate-800 border-indigo-500/30' : 'bg-indigo-50/50 border-indigo-200'
                        }`}>
                          <h4 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {revisaoExistente ? 'Editar Revisão' : 'Sua Revisão'}
                          </h4>

                          {/* Competências */}
                          <div className="space-y-4 mb-6">
                            {competencias.map(comp => (
                              <div key={comp.numeroCompetencia} className={`p-4 rounded-xl ${
                                darkMode ? 'bg-slate-900' : 'bg-white border border-slate-200'
                              }`}>
                                <div className="flex flex-col sm:flex-row justify-between gap-3">
                                  <div className="flex-1">
                                    <label className={`text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                      C{comp.numeroCompetencia}: {COMPETENCIA_NOMES[comp.numeroCompetencia - 1]}
                                    </label>
                                    <div className={`text-xs mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                                      Nota IA: {redacaoSelecionada.competencias?.find(c => c.numeroCompetencia === comp.numeroCompetencia)?.nota ?? 'N/A'}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="number"
                                      min={0}
                                      max={200}
                                      step={20}
                                      value={comp.notaProfessor}
                                      onChange={e => handleCompetenciaChange(comp.numeroCompetencia, 'notaProfessor', Number(e.target.value))}
                                      className={`w-24 px-3 py-2 rounded-lg border-2 text-center font-bold focus:outline-none ${
                                        darkMode ? 'bg-slate-800 border-slate-600 text-white focus:border-indigo-500' : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                                      }`}
                                    />
                                    <span className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>/200</span>
                                  </div>
                                </div>
                                <textarea
                                  value={comp.comentarioProfessor || ''}
                                  onChange={e => handleCompetenciaChange(comp.numeroCompetencia, 'comentarioProfessor', e.target.value)}
                                  placeholder="Comentário sobre esta competência..."
                                  rows={2}
                                  className={`w-full mt-3 px-3 py-2 rounded-lg border-2 text-sm resize-none focus:outline-none ${
                                    darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600 focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500'
                                  }`}
                                />
                              </div>
                            ))}
                          </div>

                          {/* Nota Total */}
                          <div className={`p-4 rounded-xl mb-4 flex justify-between items-center ${
                            darkMode ? 'bg-indigo-900/30' : 'bg-indigo-100'
                          }`}>
                            <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                              Nota Total do Professor
                            </span>
                            <span className="text-2xl font-bold text-indigo-500">{notaTotal}</span>
                          </div>

                          {/* Comentário geral */}
                          <div className="mb-4">
                            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                              Comentário Geral
                            </label>
                            <textarea
                              value={comentarioGeral}
                              onChange={e => setComentarioGeral(e.target.value)}
                              rows={3}
                              placeholder="Observações gerais sobre a redação do aluno..."
                              className={`w-full px-4 py-3 rounded-xl border-2 text-sm resize-none focus:outline-none ${
                                darkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-600 focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500'
                              }`}
                            />
                          </div>

                          {/* Botão salvar */}
                          <button
                            onClick={handleSalvarRevisao}
                            disabled={salvandoRevisao}
                            className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
                          >
                            {salvandoRevisao ? 'Salvando...' : revisaoExistente ? 'Atualizar Revisão' : 'Salvar Revisão'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
