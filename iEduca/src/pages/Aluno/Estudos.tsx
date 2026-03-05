import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { atividadeService } from '../../services/atividadeService';
import type { AtividadeExecucao } from '../../services/atividadeService';
import type { User } from '../../types';
import Toast from '../../components/Toast';
import {
  ConfigurationForm,
  StudyTimer,
  ExercisesList
} from '../../components/Study';
import {
  Calendar,
  Chatbot,
  NotificationDropdown,
  ProfileMenu
} from '../../components/Dashboard';
import { AlunoSidebar } from '../../components/AlunoSidebar';
import { ActivityType, StudyPhase, Exercise, ToastScore } from '../../types/study';
import { generateMockExercises } from '../../utils/exerciseGenerator';
import { showNotification, playSound, requestNotificationPermission } from '../../utils/notifications';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function Estudos() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [activityType, setActivityType] = useState<ActivityType>('exercicio');
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [phase, setPhase] = useState<StudyPhase>('config');
  const [schoolGrade, setSchoolGrade] = useState<string>('1º ano EM');

  const [studyDuration, setStudyDuration] = useState<number>(60);
  const [customTime, setCustomTime] = useState<string>('');
  const [studyTheme, setStudyTheme] = useState<string>('');

  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [hasWarned10, setHasWarned10] = useState<boolean>(false);
  const [hasWarned5, setHasWarned5] = useState<boolean>(false);
  const [hasWarned1, setHasWarned1] = useState<boolean>(false);

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentExercise, setCurrentExercise] = useState<number>(0);
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastScore, setToastScore] = useState<ToastScore>({ score: 0, total: 0 });

  const [currentExecucao, setCurrentExecucao] = useState<AtividadeExecucao | null>(null);
  const [startTime, setStartTime] = useState<number>(0);

  const [estatisticas, setEstatisticas] = useState({
    totalAtividades: 0,
    acertos: 0,
    erros: 0,
    mediaNotas: 0,
    mediaNotasAtividades: 0,
    mediaNotasRedacoes: 0,
    tempoTotalSegundos: 0
  });

  const [atividadesRealizadas, setAtividadesRealizadas] = useState<any[]>([]);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    
    if (currentUser.id) {
      loadEstatisticas(currentUser.id);
      loadAtividadesRealizadas(currentUser.id);
    }

    // Listener para recarregar quando retornar à página
    const handleVisibilityChange = () => {
      if (!document.hidden && currentUser.id) {
        loadEstatisticas(currentUser.id);
        loadAtividadesRealizadas(currentUser.id);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [navigate]);

  const loadAtividadesRealizadas = async (userId: number) => {
    try {
      // Buscar histórico de execuções (sistema antigo)
      const execucoes = await atividadeService.getHistoricoUsuario(userId);
      
      // Buscar atividades geradas por IA
      const responseAtividades = await fetch(`${API_URL}/AtividadeIA/historico/${userId}`);
      const atividadesIA = responseAtividades.ok ? await responseAtividades.json() : [];
      
      // Buscar redações corrigidas
      const responseRedacoes = await fetch(`${API_URL}/RedacaoCorrecao/usuario/${userId}`);
      const redacoes = responseRedacoes.ok ? await responseRedacoes.json() : [];
      
      // Combinar tudo em um formato unificado com datas e informações detalhadas
      const todasAtividades = [
        ...execucoes.map(e => ({
          data: e.dataFim || e.dataInicio,
          tipo: 'atividade',
          subtipo: 'execucao',
          materia: 'Geral',
          tema: e.atividadeNome || 'Atividade',
          nota: e.nota,
          id: e.id
        })),
        ...atividadesIA.map((a: any) => ({
          data: a.realizadaEm,
          tipo: 'atividade',
          subtipo: 'ia',
          materia: a.materia || 'Geral',
          tema: a.conteudo || a.materia || 'Exercícios',
          nota: a.nota,
          id: a.id
        })),
        ...redacoes
          .filter((r: any) => r.status === 'Concluída' || r.status === 'concluida') // Aceitar ambos os formatos
          .map((r: any) => ({
            data: r.dataEnvio || r.criadoEm,
            tipo: 'redacao',
            subtipo: 'redacao',
            materia: 'Redação',
            tema: r.tema || 'Tema não especificado',
            nota: r.notaTotal / 100, // Converter de 0-1000 para 0-10 para exibição no calendário
            notaOriginal: r.notaTotal, // Manter nota original de 0-1000
            id: r.id
          }))
      ];
      
      setAtividadesRealizadas(todasAtividades);
      console.log('📅 Atividades carregadas para o calendário:', {
        execucoes: execucoes.length,
        atividadesIA: atividadesIA.length,
        redacoes: redacoes.filter((r: any) => r.status === 'Concluída' || r.status === 'concluida').length,
        total: todasAtividades.length,
        amostra: todasAtividades.slice(0, 3) // Mostrar amostra para debug
      });
    } catch (error) {
      console.error('Erro ao carregar atividades:', error);
      setAtividadesRealizadas([]);
    }
  };

  const loadEstatisticas = async (userId: number) => {
    try {
      const stats = await atividadeService.getEstatisticasUsuario(userId);
      setEstatisticas({
        totalAtividades: stats.totalAtividades || 0,
        acertos: stats.acertos || 0,
        erros: stats.erros || 0,
        mediaNotas: stats.mediaNotas || 0,
        mediaNotasAtividades: stats.mediaNotasAtividades || 0,
        mediaNotasRedacoes: stats.mediaNotasRedacoes || 0,
        tempoTotalSegundos: stats.tempoTotalSegundos || 0
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
      setEstatisticas({
        totalAtividades: 0,
        acertos: 0,
        erros: 0,
        mediaNotas: 0,
        mediaNotasAtividades: 0,
        mediaNotasRedacoes: 0,
        tempoTotalSegundos: 0
      });
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;
          const minutesLeft = Math.floor(newTime / 60);

          if (minutesLeft === 10 && !hasWarned10) {
            setHasWarned10(true);
            showNotification('⏰ Faltam 10 minutos!');
          } else if (minutesLeft === 5 && !hasWarned5) {
            setHasWarned5(true);
            showNotification('⏰ Faltam 5 minutos!');
          } else if (minutesLeft === 1 && !hasWarned1) {
            setHasWarned1(true);
            showNotification('⏰ Falta 1 minuto!');
          }

          if (newTime === 0) {
            setIsRunning(false);
            playSound();

            if (activityType === 'exercicio') {
              setPhase('exercises');
            } else {
              setPhase('essay-prompt');
            }
          }

          return newTime;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, timeRemaining, hasWarned10, hasWarned5, hasWarned1, activityType]);

  const handleStartActivity = async () => {
    if (!studyTheme.trim()) {
      alert(activityType === 'redacao' ? 'Por favor, insira o tema da redação.' : 'Por favor, insira o tema do estudo.');
      return;
    }

    if (!user) {
      alert('Usuário não encontrado');
      return;
    }

    const duration = customTime ? parseInt(customTime) : studyDuration;

    if (duration <= 0 || duration > 300) {
      alert('Por favor, escolha um tempo entre 1 e 300 minutos.');
      return;
    }

    try {
      if (!user.id) {
        alert('Erro: ID do usuário não encontrado');
        return;
      }

      const mockExercises = generateMockExercises(studyTheme, schoolGrade);
      setExercises(mockExercises);

      const execucao = await atividadeService.iniciarAtividade({
        userId: user.id,
        atividadeId: 1,
        totalQuestoes: mockExercises.length
      });

      setCurrentExecucao(execucao);
      setStartTime(Date.now());

      requestNotificationPermission();

      setTimeRemaining(duration * 60);
      setIsRunning(true);
      setPhase('studying');
      setHasWarned10(false);
      setHasWarned5(false);
      setHasWarned1(false);
    } catch (error: any) {
      console.error(' Erro ao iniciar atividade:', error);
      const errorMessage = error?.message || 'Erro desconhecido';
      alert(`Erro ao iniciar atividade:\n${errorMessage}`);
    }
  };

  const handlePauseResume = () => {
    setIsRunning(!isRunning);
  };

  const handleCancelStudy = () => {
    if (confirm('Tem certeza que deseja cancelar o estudo?')) {
      setPhase('config');
      setIsRunning(false);
      setTimeRemaining(0);
      setStudyTheme('');
      setExercises([]);
      setCurrentExercise(0);
      setCurrentExecucao(null);
    }
  };

  const handleAnswerExercise = (answerIndex: number) => {
    const updatedExercises = [...exercises];
    updatedExercises[currentExercise].userAnswer = answerIndex;
    setExercises(updatedExercises);
  };

  const handleNextExercise = () => {
    if (currentExercise < exercises.length - 1) {
      setCurrentExercise(currentExercise + 1);
    }
  };

  const handlePreviousExercise = () => {
    if (currentExercise > 0) {
      setCurrentExercise(currentExercise - 1);
    }
  };

  const handleSubmitExercises = async () => {
    const score = exercises.filter(ex => ex.userAnswer === ex.correctAnswer).length;
    const errors = exercises.length - score;

    setToastScore({ score, total: exercises.length });
    setShowToast(true);
    if (currentExecucao && user) {
      try {
        const tempoGasto = Math.floor((Date.now() - startTime) / 1000);
        const nota = (score / exercises.length) * 10;

        const questoesResultados = exercises.map((ex, index) => ({
          numeroQuestao: index + 1,
          resultado: ex.userAnswer === ex.correctAnswer ? 'Acerto' as const : 'Erro' as const,
          respostaAluno: ex.options[ex.userAnswer || 0],
          respostaCorreta: ex.options[ex.correctAnswer],
          topicoEspecifico: studyTheme
        }));

        await atividadeService.finalizarAtividade(currentExecucao.id, {
          acertos: score,
          erros: errors,
          nota: nota,
          tempoGastoSegundos: tempoGasto,
          questoesResultados: questoesResultados
        });

        // Recarregar estatísticas
        if (user.id) {
          loadEstatisticas(user.id);
          loadAtividadesRealizadas(user.id); // Recarregar calendário
        }
      } catch (error) {
        console.error('Erro ao salvar atividade:', error);
      }
    }

    setTimeout(() => {
      setPhase('config');
      setExercises([]);
      setCurrentExercise(0);
      setStudyTheme('');
      setCurrentExecucao(null);
    }, 500);
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
    <div className={`min-h-screen transition-colors duration-300 ${darkMode
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
        : 'bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200'
      }`}>
      <AlunoSidebar darkMode={darkMode} onToggleTheme={() => setDarkMode(!darkMode)} />

      <div className="ml-52 min-h-screen flex flex-col">
        <div className={`backdrop-blur-sm px-6 py-4 border-b flex justify-between items-center sticky top-0 z-40 transition-colors duration-300 ${darkMode
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

        {/* Content Area */}
        <div className="flex-1">

          {phase === 'config' && (
            <div className="max-w-7xl mx-auto px-6 py-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Coluna Esquerda - Cards de Ação */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Card Iniciar Redação */}
                  <div
                    onClick={() => navigate('/aluno/redacao')}
                    className={`rounded-2xl p-6 shadow-lg cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] ${darkMode
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700'
                        : 'bg-gradient-to-r from-blue-500 to-blue-600'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-xl">
                          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">Iniciar Redação</h3>
                          <p className="text-blue-100 text-sm">Pratique com temas inéditos guiados por IA</p>
                        </div>
                      </div>
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>

                  {/* Card Lista de Atividades */}
                  <div
                    onClick={() => navigate('/aluno/atividades')}
                    className={`rounded-2xl p-6 shadow-lg cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] border ${darkMode
                        ? 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-800/70'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${darkMode ? 'bg-blue-600/20' : 'bg-blue-100'}`}>
                          <svg className={`w-8 h-8 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <div>
                          <h3 className={`text-xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            Lista de Atividades
                          </h3>
                          <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Questões por áreas de conhecimento
                          </p>
                        </div>
                      </div>
                      <svg className={`w-6 h-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>

                  {/* Meu Progresso - Calendário */}
                  <div className={`rounded-2xl p-6 shadow-lg border ${darkMode
                      ? 'bg-slate-800/50 border-slate-700/50'
                      : 'bg-white border-slate-200'
                    }`}>
                  
                    <Calendar 
                      darkMode={darkMode} 
                      atividadesRealizadas={atividadesRealizadas}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className={`rounded-2xl p-6 shadow-lg border ${darkMode
                      ? 'bg-slate-800/50 border-slate-700/50'
                      : 'bg-white border-slate-200'
                    }`}>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        Estatísticas de Progresso
                      </h3>
                      <button className={`p-1 rounded hover:bg-slate-100 ${darkMode ? 'hover:bg-slate-700' : ''}`}>
                        <svg className={`w-5 h-5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    </div>

                    {/* Total de Atividades */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          Total de Atividades
                        </span>
                        <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {estatisticas.totalAtividades}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 mb-1">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ width: estatisticas.totalAtividades > 0 ? '100%' : '0%' }}></div>
                      </div>
                      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {estatisticas.totalAtividades} concluída{estatisticas.totalAtividades !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Total de Acertos */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          Total de Acertos
                        </span>
                        <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {estatisticas.acertos + estatisticas.erros > 0 
                            ? `${Math.round((estatisticas.acertos / (estatisticas.acertos + estatisticas.erros)) * 100)}%`
                            : '0%'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 mb-1">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ 
                          width: estatisticas.acertos + estatisticas.erros > 0 
                            ? `${(estatisticas.acertos / (estatisticas.acertos + estatisticas.erros)) * 100}%`
                            : '0%'
                        }}></div>
                      </div>
                      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {estatisticas.acertos} questõe{estatisticas.acertos !== 1 ? 's' : ''}
                      </p>
                    </div>

                    {/* Média de Notas - Atividades */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          Média - Lista de Atividades
                        </span>
                        <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {(estatisticas.mediaNotasAtividades || 0).toFixed(1)}/10
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 mb-1">
                        <div className="bg-green-600 h-2 rounded-full" style={{ 
                          width: estatisticas.mediaNotasAtividades > 0 ? `${(estatisticas.mediaNotasAtividades / 10) * 100}%` : '0%'
                        }}></div>
                      </div>
                      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Escala de 0 a 10
                      </p>
                    </div>

                    {/* Média de Notas - Redações */}
                    <div className="mb-6">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          Média - Redações
                        </span>
                        <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {(estatisticas.mediaNotasRedacoes || 0).toFixed(0)}/1000
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 mb-1">
                        <div className="bg-purple-600 h-2 rounded-full" style={{ 
                          width: estatisticas.mediaNotasRedacoes > 0 ? `${(estatisticas.mediaNotasRedacoes / 1000) * 100}%` : '0%'
                        }}></div>
                      </div>
                      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Escala ENEM (0 a 1000)
                      </p>
                    </div>

                    {/* Tempo de Estudo */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          Tempo de Estudo
                        </span>
                        <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {estatisticas.tempoTotalSegundos > 0 
                            ? `${Math.floor(estatisticas.tempoTotalSegundos / 60)}min`
                            : '0min'}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200 rounded-full h-2 mb-1">
                        <div className="bg-blue-600 h-2 rounded-full" style={{ 
                          width: estatisticas.tempoTotalSegundos > 0 ? `${Math.min((estatisticas.tempoTotalSegundos / 3600) * 100, 100)}%` : '0%'
                        }}></div>
                      </div>
                      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {Math.floor(estatisticas.tempoTotalSegundos / 60)}min total
                      </p>
                    </div>
                  </div>

                  {/* Card de Chatbot */}
                  {/* <div className="rounded-2xl p-6 shadow-lg bg-gradient-to-br from-blue-600 to-blue-700">
                    <div className="flex items-center justify-between mb-3">
                      <div className="bg-white/20 p-2 rounded-lg">
                        <span className="text-2xl">🤖</span>
                      </div>
                      <span className="bg-white text-blue-600 text-xs font-bold px-3 py-1 rounded-full">
                        ONLINE
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">
                      Tire suas dúvidas agora!
                    </h3>
                    <p className="text-blue-100 text-sm mb-4">
                      Nosso assistente IA está pronto para ajudar com qualquer matéria ou dúvida sobre ENEM!
                    </p>
                    <button className="w-full bg-white text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-50 transition-colors">
                      Abrir Chat IA
                    </button>
                  </div> */}
                </div>
              </div>

              {showConfigModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                  <div className={`rounded-2xl p-8 shadow-2xl max-w-2xl w-full border transition-colors ${darkMode
                      ? 'bg-slate-800 border-slate-700'
                      : 'bg-white border-slate-200'
                    }`}>
                    <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-slate-100' : 'text-slate-800'}`}>
                      {activityType === 'redacao' ? '✍️ Configurar Redação' : '📚 Configurar Atividade'}
                    </h2>
                    <ConfigurationForm
                      activityType={activityType}
                      setActivityType={setActivityType}
                      studyTheme={studyTheme}
                      setStudyTheme={setStudyTheme}
                      schoolGrade={schoolGrade}
                      setSchoolGrade={setSchoolGrade}
                      studyDuration={studyDuration}
                      setStudyDuration={setStudyDuration}
                      customTime={customTime}
                      setCustomTime={setCustomTime}
                      onStart={handleStartActivity}
                      darkMode={darkMode}
                    />
                    <button
                      onClick={() => {
                        setShowConfigModal(false);
                        setStudyTheme('');
                      }}
                      className={`mt-4 w-full py-2 rounded-lg transition-colors ${darkMode
                          ? 'bg-slate-700 hover:bg-slate-600 text-white'
                          : 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                        }`}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {phase === 'studying' && (
            <StudyTimer
              studyTheme={studyTheme}
              timeRemaining={timeRemaining}
              isRunning={isRunning}
              onPauseResume={handlePauseResume}
              onCancel={handleCancelStudy}
            />
          )}

          {phase === 'exercises' && (
            <ExercisesList
              studyTheme={studyTheme}
              schoolGrade={schoolGrade}
              exercises={exercises}
              currentExercise={currentExercise}
              onAnswer={handleAnswerExercise}
              onPrevious={handlePreviousExercise}
              onNext={handleNextExercise}
              onSubmit={handleSubmitExercises}
            />
          )}

          {showToast && (
            <Toast
              message={`Você acertou ${toastScore.score} de ${toastScore.total} questões!`}
              score={toastScore.score}
              total={toastScore.total}
              onClose={() => setShowToast(false)}
            />
          )}

          {/* <Chatbot /> */}
        </div>
      </div>
    </div>
  );
}
