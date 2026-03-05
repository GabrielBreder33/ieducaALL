import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../../services/authService';
import { aiService } from '../../../services/aiService';
import type { User } from '../../../types';
import { NotificationDropdown, ProfileMenu } from '../../../components/Dashboard';
import { AlunoSidebar } from '../../../components/AlunoSidebar';

interface AtividadeRealizada {
  id: number;
  userId: number;
  atividadeId: string;
  materia: string;
  segmento: string;
  ano: string;
  conteudo: string;
  nivel: string;
  tipo: string;
  totalQuestoes: number;
  acertos: number;
  erros: number;
  nota: number;
  percentual: number;
  realizadaEm: string;
}

interface DetalhesAtividade {
  questoes: any[];
  respostas: any[];
  gabarito: any[];
  atividade: AtividadeRealizada;
}

export default function Atividade() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [atividadesRealizadas, setAtividadesRealizadas] = useState<AtividadeRealizada[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(true);
  const [modalDetalhes, setModalDetalhes] = useState<DetalhesAtividade | null>(null);

  const progressoGeral = {
    concluidas: atividadesRealizadas.length,
    total: atividadesRealizadas.length,
    percentual: atividadesRealizadas.length > 0 
      ? Math.round(atividadesRealizadas.reduce((acc, a) => acc + a.percentual, 0) / atividadesRealizadas.length)
      : 0,
    precisao: atividadesRealizadas.length > 0
      ? Math.round(atividadesRealizadas.reduce((acc, a) => acc + a.percentual, 0) / atividadesRealizadas.length)
      : 0,
    tempoMedio: 18
  };

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    
    // Carregar histórico de atividades do banco
    if (currentUser.id) {
      carregarHistorico(currentUser.id);
    }
  }, [navigate]);

  const carregarHistorico = async (userId: number) => {
    try {
      setCarregandoHistorico(true);
      const historico = await aiService.buscarHistoricoAtividades(userId);
      setAtividadesRealizadas(historico);
      console.log('✅ Histórico carregado:', historico);
    } catch (error) {
      console.error('❌ Erro ao carregar histórico:', error);
    } finally {
      setCarregandoHistorico(false);
    }
  };

  const visualizarCorrecao = async (atividadeId: number) => {
    if (!user?.id) return;
    
    try {
      const detalhes = await aiService.buscarDetalheAtividade(user.id, atividadeId);
      
      // Os campos já vêm deserializados do backend
      const questoes = detalhes.questoes || [];
      const respostas = detalhes.respostas || [];
      const gabarito = detalhes.gabarito || [];
      
      setModalDetalhes({
        questoes,
        respostas,
        gabarito,
        atividade: atividadesRealizadas.find(a => a.id === atividadeId)!
      });
      
      console.log('📖 Visualizando correção:', { questoes, respostas, gabarito });
    } catch (error) {
      console.error('❌ Erro ao carregar detalhes:', error);
      alert('Erro ao carregar detalhes da atividade.');
    }
  };

  const refazerAtividade = async (atividadeId: number) => {
    if (!user?.id) return;
    
    try {
      const detalhes = await aiService.buscarDetalheAtividade(user.id, atividadeId);
      
      // Os campos já vêm deserializados do backend
      const questoes = detalhes.questoes || [];
      const gabarito = detalhes.gabarito || [];
      
      const atividadeRefazer = {
        id: detalhes.atividadeId,
        configuracao: {
          materia: detalhes.materia,
          segmento: detalhes.segmento,
          ano: detalhes.ano,
          conteudo: detalhes.conteudo,
          nivel: detalhes.nivel,
          quantidade: detalhes.totalQuestoes,
          tipo: detalhes.tipo,
          explicacao: true
        },
        questoes: questoes,
        gabarito: gabarito,
        criadaEm: new Date().toISOString()
      };
      
      localStorage.setItem('atividadeRefazer', JSON.stringify(atividadeRefazer));
      navigate('/aluno/atividade/gerar-ia', { state: { atividadeRefazer } });
      
      console.log('🔄 Refazendo atividade:', atividadeRefazer);
    } catch (error) {
      console.error('❌ Erro ao refazer atividade:', error);
      alert('Erro ao carregar atividade. Tente novamente.');
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleUpdateUser = (updatedData: Partial<User>) => {
    const updatedUser = { ...user, ...updatedData } as User;
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  if (!user) {
    return null;
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
        : 'bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200'
    }`}>
      <AlunoSidebar darkMode={darkMode} onToggleTheme={() => setDarkMode(!darkMode)} />

      <div className="ml-52 min-h-screen flex flex-col">
        {/* Header */}
        <div className={`backdrop-blur-sm px-6 py-4 border-b flex justify-between items-center sticky top-0 z-40 transition-colors duration-300 ${
          darkMode
            ? 'bg-slate-800/80 border-slate-700/50'
            : 'bg-white/90 border-slate-200 shadow-sm'
        }`}>
          <div>
            <h1 className={`text-xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Olá, {user.nome}!
            </h1>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Pronto para a jornada rumo aos 900+ no ENEM?
            </p>
          </div>
          <div className="flex items-center gap-4">
            <NotificationDropdown darkMode={darkMode} />
            <ProfileMenu
              user={user}
              darkMode={darkMode}
              onLogout={handleLogout}
              onUpdateUser={handleUpdateUser}
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Breadcrumb */}
            <div className={`text-sm mb-4 flex items-center gap-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              <button onClick={() => navigate('/aluno/estudos')} className="hover:text-blue-600">
                Dashboard
              </button>
              <span>/</span>
              <span className={darkMode ? 'text-white' : 'text-slate-900'}>Atividades</span>
            </div>

            {/* Title */}
            <div className="mb-8">
              <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Atividades de Estudo
              </h1>
              <p className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
                Gere atividades personalizadas com IA ou continue exercícios salvos
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Conteúdo Principal */}
              <div className="lg:col-span-2 space-y-6">
                {/* Card Principal - Gerador IA */}
                <div className="rounded-2xl border-2 border-purple-500 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-8 relative overflow-hidden shadow-xl">
                  {/* Background Pattern */}
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500 rounded-full blur-3xl"></div>
                  </div>

                  <div className="relative">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-20 h-20 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                        <span className="text-4xl">🤖</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <h2 className="text-2xl font-bold text-purple-900">
                            Gerador de Atividades com IA
                          </h2>
                          <span className="px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full animate-pulse">
                            NOVO
                          </span>
                        </div>
                        <p className="text-purple-800 text-lg mb-4">
                          Crie atividades personalizadas em segundos! Escolha matéria, nível, quantidade de questões e deixe a IA gerar exercícios exclusivos para você.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                          <div className="px-4 py-3 bg-white/90 rounded-xl border border-purple-200 shadow-sm">
                            <div className="text-2xl mb-1">✨</div>
                            <div className="text-xs font-semibold text-purple-900">Personalizado</div>
                            <div className="text-xs text-purple-700">Ao seu nível</div>
                          </div>
                          <div className="px-4 py-3 bg-white/90 rounded-xl border border-purple-200 shadow-sm">
                            <div className="text-2xl mb-1">🎯</div>
                            <div className="text-xs font-semibold text-purple-900">Múltipla Escolha</div>
                            <div className="text-xs text-purple-700">Ou discursiva</div>
                          </div>
                          <div className="px-4 py-3 bg-white/90 rounded-xl border border-purple-200 shadow-sm">
                            <div className="text-2xl mb-1">📚</div>
                            <div className="text-xs font-semibold text-purple-900">Com Explicações</div>
                            <div className="text-xs text-purple-700">Detalhadas</div>
                          </div>
                        </div>
                        <button
                          onClick={() => navigate('/aluno/atividade/gerar-ia')}
                          className="w-full px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all text-lg"
                        >
                          🚀 Começar Agora
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Atividades em Progresso */}
                {atividadesRealizadas.some(a => a.nota < 7) && (
                  <div className={`rounded-2xl border p-6 ${
                    darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="text-xl">📝</span>
                      <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        Para Revisar (Nota Baixa)
                      </h3>
                    </div>

                    <div className="space-y-4">
                      {atividadesRealizadas.filter(a => a.nota < 7).slice(0, 3).map((atividade) => {
                        const dataFormatada = new Date(atividade.realizadaEm).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });
                        
                        return (
                          <div
                            key={atividade.id}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              darkMode
                                ? 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-2xl">📊</span>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="px-2 py-1 rounded-md text-xs font-bold border bg-orange-100 text-orange-700 border-orange-300">
                                    REVISAR
                                  </span>
                                  <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    📅 {dataFormatada}
                                  </span>
                                </div>

                                <h4 className={`font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                  {atividade.materia} - {atividade.conteudo}
                                </h4>
                                <p className={`text-sm mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                  Nível: {atividade.nivel} | Nota: {atividade.nota.toFixed(1)} | {atividade.acertos}/{atividade.totalQuestoes} acertos
                                </p>

                                <div className="flex items-center justify-between">
                                  <span className="text-xs text-orange-600 font-medium">
                                    📝 {atividade.percentual.toFixed(0)}% de aproveitamento
                                  </span>
                                  <button
                                    onClick={() => visualizarCorrecao(atividade.id)}
                                    className="px-4 py-2 rounded-lg font-medium bg-purple-600 hover:bg-purple-700 text-white transition-all text-sm flex items-center gap-1"
                                    title="Ver correção detalhada para estudar"
                                  >
                                    📖 Ver Correção
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Atividades Realizadas (todas) */}
                <div className={`rounded-2xl border p-6 ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-xl">📚</span>
                    <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      Histórico de Atividades
                    </h3>
                  </div>

                  {carregandoHistorico ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                  ) : atividadesRealizadas.length === 0 ? (
                    <div className={`text-center py-12 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      <div className="text-5xl mb-4">📝</div>
                      <p className="font-medium mb-2">Nenhuma atividade realizada ainda</p>
                      <p className="text-sm">Gere sua primeira atividade com IA!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {atividadesRealizadas.map((atividade) => {
                        const notaCor = atividade.nota >= 7 ? 'text-green-600' : atividade.nota >= 5 ? 'text-yellow-600' : 'text-red-600';
                        const notaBg = atividade.nota >= 7 ? 'bg-green-100' : atividade.nota >= 5 ? 'bg-yellow-100' : 'bg-red-100';
                        const nivelCor = atividade.nivel === 'Fácil' ? 'bg-green-100 text-green-700 border-green-300' :
                                        atividade.nivel === 'Médio' ? 'bg-yellow-100 text-yellow-700 border-yellow-300' :
                                        'bg-red-100 text-red-700 border-red-300';
                        const dataFormatada = new Date(atividade.realizadaEm).toLocaleString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        });

                        return (
                          <div
                            key={atividade.id}
                            className={`p-4 rounded-xl border-2 transition-all ${
                              darkMode
                                ? 'bg-slate-700/50 border-slate-600 hover:border-slate-500'
                                : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 ${
                                atividade.nota >= 7 ? 'bg-green-100' :
                                atividade.nota >= 5 ? 'bg-yellow-100' :
                                'bg-red-100'
                              }`}>
                                <span className="text-2xl">
                                  {atividade.nota >= 7 ? '🎯' : atividade.nota >= 5 ? '📊' : '📐'}
                                </span>
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className={`px-2 py-1 rounded-md text-xs font-bold border ${nivelCor}`}>
                                    {atividade.nivel}
                                  </span>
                                  <span className={`px-2 py-1 rounded-md text-xs font-bold ${
                                    darkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-700'
                                  }`}>
                                    {atividade.tipo}
                                  </span>
                                  <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                                    📅 {dataFormatada}
                                  </span>
                                </div>

                                <h4 className={`font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                  {atividade.materia}
                                </h4>
                                <p className={`text-sm mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                  {atividade.conteudo}
                                </p>

                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-3 text-xs flex-wrap">
                                    <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
                                      📝 {atividade.totalQuestoes} questões
                                    </span>
                                    <span className="text-green-600">
                                      ✓ {atividade.acertos} acertos
                                    </span>
                                    <span className="text-red-600">
                                      ✗ {atividade.erros} erros
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <button
                                      onClick={() => refazerAtividade(atividade.id)}
                                      className="px-3 py-1.5 rounded-lg font-medium bg-blue-600 hover:bg-blue-700 text-white transition-all text-xs flex items-center gap-1"
                                      title="Refazer esta atividade"
                                    >
                                      🔄 Refazer
                                    </button>
                                    <div className={`px-3 py-1 rounded-lg font-bold ${notaBg} ${notaCor}`}>
                                      {atividade.nota.toFixed(1)}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column - Status */}
              <div className="space-y-6">
                {/* Status Geral */}
                <div className={`rounded-2xl border p-6 ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      Seu Progresso
                    </h3>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Progresso Geral
                      </span>
                      <span className="text-2xl font-bold text-blue-600">
                        {progressoGeral.percentual}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden mb-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${progressoGeral.percentual}%` }}
                      />
                    </div>
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      {progressoGeral.concluidas}/{progressoGeral.total} atividades
                    </p>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Precisão
                      </span>
                      <span className="text-2xl font-bold text-green-600">
                        {progressoGeral.precisao}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden mb-2">
                      <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${progressoGeral.precisao}%` }}
                      />
                    </div>
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Índice de acertos
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Tempo Médio
                      </span>
                      <span className="text-2xl font-bold text-orange-600">
                        {progressoGeral.tempoMedio}m
                      </span>
                    </div>
                    <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      Por exercício ⏱️
                    </p>
                  </div>
                </div>

                {/* Recomendação IA */}
                <div className="rounded-2xl border-2 border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 p-6">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-xl">💡</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-blue-900 mb-1">
                        RECOMENDAÇÃO IA
                      </h3>
                      <p className="text-sm text-blue-800">
                        Com base nos seus últimos erros, recomendamos focar em{' '}
                        <strong>Geometria Plana</strong> hoje para reforçar a base de cálculos de área.
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate('/aluno/atividade/gerar-ia')}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors"
                  >
                    Gerar Atividade
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Detalhes da Correção */}
      {modalDetalhes && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className={`max-w-4xl w-full max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
            darkMode ? 'bg-slate-800' : 'bg-white'
          }`}>
            {/* Header do Modal */}
            <div className={`sticky top-0 p-6 border-b z-10 ${
              darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
            }`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    📖 Correção Detalhada
                  </h2>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`px-3 py-1 rounded-lg font-bold ${
                      modalDetalhes.atividade.nota >= 7 ? 'bg-green-100 text-green-700' :
                      modalDetalhes.atividade.nota >= 5 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      Nota: {modalDetalhes.atividade.nota.toFixed(1)}
                    </span>
                    <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      {modalDetalhes.atividade.materia} • {modalDetalhes.atividade.conteudo}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setModalDetalhes(null)}
                  className={`p-2 rounded-lg transition-colors ${
                    darkMode 
                      ? 'hover:bg-slate-700 text-slate-400 hover:text-white' 
                      : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                  title="Fechar"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-6 space-y-6">
              {/* Estatísticas */}
              <div className="grid grid-cols-3 gap-4">
                <div className={`p-4 rounded-xl text-center ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                  <div className="text-2xl font-bold text-blue-600">{modalDetalhes.atividade.totalQuestoes}</div>
                  <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Questões</div>
                </div>
                <div className={`p-4 rounded-xl text-center ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                  <div className="text-2xl font-bold text-green-600">{modalDetalhes.atividade.acertos}</div>
                  <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Acertos</div>
                </div>
                <div className={`p-4 rounded-xl text-center ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                  <div className="text-2xl font-bold text-red-600">{modalDetalhes.atividade.erros}</div>
                  <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Erros</div>
                </div>
              </div>

              {/* Questões com Correção */}
              {modalDetalhes.questoes.map((questao: any) => {
                // Campos do backend vêm com letra MAIÚSCULA: Questao, Resposta, RespostaCorreta
                const numeroQuestao = questao.Numero || questao.numero;
                const respostaAluno = modalDetalhes.respostas.find((r: any) => 
                  (r.Questao || r.questao) === numeroQuestao
                );
                const gabaritoItem = modalDetalhes.gabarito.find((g: any) => 
                  (g.Questao || g.questao) === numeroQuestao
                );
                const respostaAlunoLetra = respostaAluno?.Resposta || respostaAluno?.resposta;
                const respostaCorretaLetra = gabaritoItem?.RespostaCorreta || gabaritoItem?.respostaCorreta;
                const acertou = respostaAlunoLetra === respostaCorretaLetra;

                return (
                  <div
                    key={questao.numero}
                    className={`p-5 rounded-xl border-2 ${
                      acertou
                        ? darkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-200'
                        : darkMode ? 'bg-red-900/20 border-red-700' : 'bg-red-50 border-red-200'
                    }`}
                  >
                    {/* Cabeçalho da Questão */}
                    <div className="flex items-start justify-between mb-4">
                      <h3 className={`font-bold text-lg ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        Questão {numeroQuestao}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                        acertou
                          ? 'bg-green-600 text-white'
                          : 'bg-red-600 text-white'
                      }`}>
                        {acertou ? '✓ Acertou' : '✗ Errou'}
                      </span>
                    </div>

                    {/* Enunciado */}
                    <p className={`mb-4 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      {questao.Enunciado || questao.enunciado}
                    </p>

                    {/* Alternativas (se múltipla escolha) */}
                    {(questao.Alternativas || questao.alternativas) && (
                      <div className="space-y-2 mb-4">
                        {(questao.Alternativas || questao.alternativas).map((alt: any, index: number) => {
                          const letraAlternativa = alt.Letra || alt.letra || String.fromCharCode(65 + index); // A, B, C, D
                          const ehResposta = letraAlternativa === respostaAlunoLetra;
                          const ehCorreta = letraAlternativa === respostaCorretaLetra;

                          return (
                            <div
                              key={letraAlternativa}
                              className={`p-3 rounded-lg border-2 transition-all ${
                                ehCorreta && ehResposta
                                  ? darkMode ? 'bg-green-900/30 border-green-600' : 'bg-green-100 border-green-400'
                                  : ehCorreta && !ehResposta
                                  ? darkMode ? 'bg-green-900/20 border-green-700' : 'bg-green-50 border-green-300'
                                  : ehResposta && !ehCorreta
                                  ? darkMode ? 'bg-red-900/30 border-red-600' : 'bg-red-100 border-red-400'
                                  : darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'
                              }`}
                            >
                              <div className="flex items-start gap-3">
                                <span className={`font-bold flex-shrink-0 min-w-[24px] ${
                                  ehCorreta ? 'text-green-600' : ehResposta ? 'text-red-600' : darkMode ? 'text-slate-400' : 'text-slate-600'
                                }`}>
                                  {letraAlternativa})
                                </span>
                                <span className={`flex-1 ${
                                  ehCorreta || ehResposta 
                                    ? darkMode ? 'text-white' : 'text-slate-900'
                                    : darkMode ? 'text-slate-300' : 'text-slate-700'
                                }`}>
                                  {alt.Texto || alt.texto}
                                </span>
                                {ehCorreta && (
                                  <span className="ml-auto text-green-600 font-bold flex items-center gap-1">
                                    ✓ {ehResposta ? 'Sua resposta' : 'Correta'}
                                  </span>
                                )}
                                {ehResposta && !ehCorreta && (
                                  <span className="ml-auto text-red-600 font-bold flex items-center gap-1">
                                    ✗ Sua resposta
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Resposta do Aluno (se discursiva) */}
                    {!(questao.Alternativas || questao.alternativas) && respostaAluno && (
                      <div className={`p-4 rounded-lg mb-4 ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                        <h4 className={`font-bold mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          Sua Resposta:
                        </h4>
                        <p className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
                          {respostaAlunoLetra}
                        </p>
                      </div>
                    )}

                    {/* Explicação do Gabarito */}
                    {(gabaritoItem?.Explicacao || gabaritoItem?.explicacao) && (
                      <div className={`p-4 rounded-lg ${darkMode ? 'bg-blue-900/20 border-l-4 border-blue-500' : 'bg-blue-50 border-l-4 border-blue-400'}`}>
                        <h4 className={`font-bold mb-2 flex items-center gap-2 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                          💡 Explicação:
                        </h4>
                        <p className={darkMode ? 'text-slate-300' : 'text-slate-700'}>
                          {gabaritoItem.Explicacao || gabaritoItem.explicacao}
                        </p>
                        {(gabaritoItem?.PorqueOutrasEstaoErradas || gabaritoItem?.porqueOutrasEstaoErradas) && (
                          <div className="mt-3">
                            <h5 className={`font-semibold mb-1 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                              Por que as outras estão erradas:
                            </h5>
                            <p className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
                              {gabaritoItem.PorqueOutrasEstaoErradas || gabaritoItem.porqueOutrasEstaoErradas}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Botão de Refazer */}
              <div className="pt-4">
                <button
                  onClick={() => {
                    setModalDetalhes(null);
                    refazerAtividade(modalDetalhes.atividade.id);
                  }}
                  className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <span className="text-xl">🔄</span>
                  <span>Refazer Esta Atividade</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
