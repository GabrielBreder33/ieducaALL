import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../../services/authService';
import { aiService } from '../../../services/aiService';
import type { User } from '../../../types';
import { NotificationDropdown, ProfileMenu } from '../../../components/Dashboard';
import { AlunoSidebar } from '../../../components/AlunoSidebar';

interface Materia {
  id: number;
  nome: string;
  icone: string;
  totalAtividades: number;
  cor: string;
}

interface Atividade {
  id: number;
  titulo: string;
  descricao: string;
  dificuldade: 'FÁCIL' | 'MÉDIO' | 'DIFÍCIL';
  tempoEstimado: number;
  status: 'nao_iniciado' | 'em_progresso' | 'concluido';
  personalizadoIA: boolean;
  materiaId: number;
}

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

export default function Atividade() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [atividadesRealizadas, setAtividadesRealizadas] = useState<AtividadeRealizada[]>([]);
  const [carregandoHistorico, setCarregandoHistorico] = useState(true);
  const [materiaSelecionada, setMateriaSelecionada] = useState<number | null>(null);

  const materias: Materia[] = [
    { id: 1, nome: 'Matemática', icone: '🔢', totalAtividades: 12, cor: 'blue' },
    { id: 2, nome: 'Linguagens', icone: '🔤', totalAtividades: 12, cor: 'purple' },
    { id: 3, nome: 'C. Natureza', icone: '🧪', totalAtividades: 8, cor: 'green' },
    { id: 4, nome: 'C. Humanas', icone: '🌍', totalAtividades: 15, cor: 'orange' }
  ];

  const atividades: Atividade[] = [
    {
      id: 1,
      titulo: 'Geometria Plana: Área e Perímetro',
      descricao: 'Revisão de figuras elementares e polígonos regulares.',
      dificuldade: 'FÁCIL',
      tempoEstimado: 15,
      status: 'nao_iniciado',
      personalizadoIA: true,
      materiaId: 1
    },
    {
      id: 2,
      titulo: 'Funções de Segundo Grau',
      descricao: 'Análise de parábolas, raízes e pontos de máximo/mínimo.',
      dificuldade: 'MÉDIO',
      tempoEstimado: 25,
      status: 'em_progresso',
      personalizadoIA: false,
      materiaId: 1
    },
    {
      id: 3,
      titulo: 'Análise Combinatória e Probabilidade',
      descricao: 'Problemas complexos de arranjos, permutações e probabilidade(avançado).',
      dificuldade: 'DIFÍCIL',
      tempoEstimado: 40,
      status: 'nao_iniciado',
      personalizadoIA: true,
      materiaId: 1
    }
  ];

  const progressoGeral = {
    concluidas: 12,
    total: 45,
    percentual: 26,
    precisao: 78,
    tempoMedio: 18
  };

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    
    // Carregar histórico de atividades
    if (currentUser.id) {
      carregarHistorico(currentUser.id);
    }

    // Recarregar histórico quando a página ganhar foco (volta da execução)
    const handleFocus = () => {
      if (currentUser.id) {
        carregarHistorico(currentUser.id);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [navigate]);

  const carregarHistorico = async (userId: number) => {
    try {
      setCarregandoHistorico(true);
      const historico = await aiService.buscarHistoricoAtividades(userId);
      setAtividadesRealizadas(historico);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setCarregandoHistorico(false);
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

  const getDificuldadeColor = (dificuldade: string) => {
    switch (dificuldade) {
      case 'FÁCIL': return 'bg-green-100 text-green-700 border-green-300';
      case 'MÉDIO': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      case 'DIFÍCIL': return 'bg-red-100 text-red-700 border-red-300';
      default: return 'bg-gray-100 text-gray-700 border-gray-300';
    }
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
              <span className={darkMode ? 'text-white' : 'text-slate-900'}>Seleção de Atividades</span>
            </div>

            {/* Title */}
            <div className="mb-8">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h1 className={`text-3xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    O que vamos estudar hoje?
                  </h1>
                  <p className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
                    Selecione uma matéria para ver as atividades personalizadas por IA.
                  </p>
                </div>
                
                <button
                  onClick={() => navigate('/aluno/atividade/gerar-ia')}
                  className="px-6 py-4 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2 group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">🤖</span>
                  <div className="text-left">
                    <div className="text-sm font-semibold">Gerar com IA</div>
                    <div className="text-xs opacity-90">Nova Atividade</div>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {materias.map((materia) => (
                    <button
                      key={materia.id}
                      onClick={() => setMateriaSelecionada(materia.id)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        materiaSelecionada === materia.id
                          ? 'border-blue-600 bg-blue-50 shadow-lg scale-105'
                          : darkMode
                          ? 'border-slate-700 bg-slate-800 hover:border-slate-600'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className="text-4xl mb-2">{materia.icone}</div>
                      <div className={`font-bold mb-1 ${
                        materiaSelecionada === materia.id
                          ? 'text-blue-600'
                          : darkMode ? 'text-white' : 'text-slate-900'
                      }`}>
                        {materia.nome}
                      </div>
                      <div className={`text-xs ${
                        materiaSelecionada === materia.id
                          ? 'text-blue-600'
                          : darkMode ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        {materiaSelecionada === materia.id && 'Selecionado'}
                        {materiaSelecionada !== materia.id && `${materia.totalAtividades} atividades`}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="rounded-2xl border-2 border-purple-500 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 p-6 relative overflow-hidden">
                  <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-500 rounded-full blur-3xl"></div>
                  </div>

                  <div className="relative">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                        <span className="text-3xl">🤖</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold text-purple-900">
                            Gerador de Atividades com IA
                          </h3>
                          <span className="px-2 py-1 bg-purple-600 text-white text-xs font-bold rounded-full animate-pulse">
                            NOVO
                          </span>
                        </div>
                        <p className="text-purple-800 mb-3">
                          Crie atividades personalizadas em segundos! Escolha matéria, nível, quantidade de questões e deixe a IA gerar exercícios exclusivos para você.
                        </p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="px-3 py-1 bg-white/80 text-purple-700 text-xs font-medium rounded-full border border-purple-200">
                            ✨ Personalizado ao seu nível
                          </span>
                          <span className="px-3 py-1 bg-white/80 text-purple-700 text-xs font-medium rounded-full border border-purple-200">
                            🎯 Múltipla escolha ou discursiva
                          </span>
                          <span className="px-3 py-1 bg-white/80 text-purple-700 text-xs font-medium rounded-full border border-purple-200">
                            📚 Com explicações detalhadas
                          </span>
                        </div>
                        <button
                          onClick={() => navigate('/aluno/atividade/gerar-ia')}
                          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all"
                        >
                          🚀 Começar Agora
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={`rounded-2xl border p-6 ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className={`text-xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        📊 Atividades Realizadas
                      </h3>
                      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Histórico de atividades com IA
                      </p>
                    </div>
                    {atividadesRealizadas.length > 0 && (
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        darkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-700'
                      }`}>
                        {atividadesRealizadas.length} {atividadesRealizadas.length === 1 ? 'atividade' : 'atividades'}
                      </span>
                    )}
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
                    <div className="space-y-3">
                      {atividadesRealizadas.map((atividade) => {
                        const notaCor = atividade.nota >= 7 ? 'text-green-600' : atividade.nota >= 5 ? 'text-yellow-600' : 'text-red-600';
                        const notaBg = atividade.nota >= 7 ? 'bg-green-100' : atividade.nota >= 5 ? 'bg-yellow-100' : 'bg-red-100';
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
                            className={`p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-lg ${
                              darkMode
                                ? 'bg-slate-700/50 border-slate-600 hover:border-blue-500'
                                : 'bg-slate-50 border-slate-200 hover:border-blue-400'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                    {atividade.materia}
                                  </h4>
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    darkMode ? 'bg-slate-600 text-slate-200' : 'bg-slate-200 text-slate-700'
                                  }`}>
                                    {atividade.nivel}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                                    darkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-700'
                                  }`}>
                                    {atividade.tipo}
                                  </span>
                                </div>
                                <p className={`text-sm mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                  {atividade.conteudo}
                                </p>
                                <div className="flex items-center gap-4 text-xs">
                                  <span className={darkMode ? 'text-slate-400' : 'text-slate-500'}>
                                    📅 {dataFormatada}
                                  </span>
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
                              </div>
                              <div className="flex flex-col items-end gap-2">
                                <div className={`px-4 py-2 rounded-lg font-bold text-lg ${notaBg} ${notaCor}`}>
                                  {atividade.nota.toFixed(1)}
                                </div>
                                <div className={`text-xs font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                  {atividade.percentual.toFixed(0)}%
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

              <div className="space-y-6">
                <div className={`rounded-2xl border p-6 ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center justify-between mb-6">
                    <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      Status da Matéria
                    </h3>
                    <button className="text-blue-600 hover:text-blue-700">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
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
                  <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors">
                    Focar Agora
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
