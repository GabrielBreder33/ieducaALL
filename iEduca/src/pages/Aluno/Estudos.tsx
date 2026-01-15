import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { aiService } from '../../services/aiService';
import { atividadeService } from '../../services/atividadeService';
import type { AtividadeExecucao } from '../../services/atividadeService';
import type { User } from '../../types';
import Toast from '../../components/Toast';
import {
  ConfigurationForm,
  StudyTimer,
  ExercisesList,
  EssayPrompt,
  EssayEditor,
  CorrectionDisplay
} from '../../components/Study';
import {
  Calendar,
  PerformanceChart,
  ProgressCards,
  Chatbot,
  Carousel3D,
  ChatCard,
  NotificationDropdown,
  ProfileMenu
} from '../../components/Dashboard';
import { ActivityType, StudyPhase, EssayData, Exercise, ToastScore } from '../../types/study';
import { generateMockExercises } from '../../utils/exerciseGenerator';
import { showNotification, playSound, requestNotificationPermission } from '../../utils/notifications';
import type { EssayCorrection } from '../../services/aiService';

export default function Estudos() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [activityType, setActivityType] = useState<ActivityType>('redacao');
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
  
  const [essayData, setEssayData] = useState<EssayData>({
    theme: '',
    type: 'ENEM',
    minLines: 20,
    content: '',
    wordCount: 0,
    lineCount: 0
  });
  
  const [correction, setCorrection] = useState<EssayCorrection | null>(null);
  const [currentExecucao, setCurrentExecucao] = useState<AtividadeExecucao | null>(null);
  const [startTime, setStartTime] = useState<number>(0);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);
  }, [navigate]);

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
    
    if (activityType === 'redacao') {
      setEssayData({
        ...essayData,
        theme: studyTheme,
        type: 'ENEM'
      });
      setPhase('writing-essay');
    } else {
      const duration = customTime ? parseInt(customTime) : studyDuration;
      
      if (duration <= 0 || duration > 300) {
        alert('Por favor, escolha um tempo entre 1 e 300 minutos.');
        return;
      }
      
      try {
        // Gerar exercícios primeiro para saber o total de questões
        const mockExercises = generateMockExercises(studyTheme, schoolGrade);
        setExercises(mockExercises);
        
        console.log('📤 Iniciando atividade com dados:', {
          userId: user.id,
          atividadeId: 1,
          totalQuestoes: mockExercises.length
        });
        
        // Iniciar atividade no backend
        const execucao = await atividadeService.iniciarAtividade({
          userId: user.id,
          atividadeId: 1,
          totalQuestoes: mockExercises.length
        });
        
        console.log('✅ Atividade iniciada:', execucao);
        
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
        console.error('❌ Erro ao iniciar atividade:', error);
        const errorMessage = error?.message || 'Erro desconhecido';
        alert(`Erro ao iniciar atividade:\n${errorMessage}\n\n⚠️ Verifique se o backend está rodando em http://localhost:5000`);
      }
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
    
    // Salvar resultado no backend
    if (currentExecucao && user) {
      try {
        const tempoGasto = Math.floor((Date.now() - startTime) / 1000);
        const nota = (score / exercises.length) * 10;
        
        // Preparar resultados das questões
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
        
        console.log('✅ Atividade salva com sucesso!');
      } catch (error) {
        console.error('❌ Erro ao salvar atividade:', error);
        // Não bloqueia o usuário se der erro ao salvar
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

  const handleStartEssay = () => {
    setPhase('writing-essay');
  };

  const handleEssayChange = (content: string) => {
    const lines = content.split('\n');
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);
    
    setEssayData({
      ...essayData,
      content,
      lineCount: lines.length,
      wordCount: words.length
    });
  };

  const handleSubmitEssay = async () => {
    if (essayData.lineCount < essayData.minLines) {
      alert(`Sua redação precisa ter no mínimo ${essayData.minLines} linhas. Atualmente: ${essayData.lineCount} linhas.`);
      return;
    }
    
    if (essayData.wordCount < 50) {
      alert('Sua redação precisa ter mais conteúdo.');
      return;
    }
    
    setPhase('correction');
    
    try {
      const result = await aiService.correctEssay(
        essayData.theme,
        essayData.content,
        essayData.type
      );
      
      setCorrection(result);
    } catch (error) {
      alert('Erro ao processar a correção. Tente novamente.');
      setPhase('writing-essay');
    }
  };

  const handleFinish = () => {
    setPhase('config');
    setStudyTheme('');
    setEssayData({
      theme: '',
      type: 'ENEM',
      minLines: 20,
      content: '',
      wordCount: 0,
      lineCount: 0
    });
    setCorrection(null);
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleUpdateUser = (updatedData: Partial<User>) => {
    // Atualizar dados do usuário
    const updatedUser = { ...user, ...updatedData } as User;
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
    
    // Aqui você pode adicionar a chamada à API para atualizar no backend
    // await authService.updateUser(updatedUser);
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
      {/* Header */}
      <div className={`backdrop-blur-sm px-6 py-4 border-b flex justify-between items-center sticky top-0 z-50 transition-colors duration-300 ${
        darkMode
          ? 'bg-slate-800/80 border-slate-700/50'
          : 'bg-white/90 border-slate-300 shadow-sm'
      }`}>
        {/* Logo */}
        <div className="flex items-center">
          <h1 className={`text-2xl font-bold tracking-wide transition-colors ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}>IEDUCA</h1>
        </div>

        {/* Theme Toggle - Centro */}
        <div className={`flex items-center gap-3 rounded-full p-1.5 transition-colors ${
          darkMode ? 'bg-slate-700/50' : 'bg-slate-200'
        }`}>
          <button 
            onClick={() => setDarkMode(false)}
            className={`p-2 rounded-full transition-all ${
              !darkMode ? 'bg-white shadow-lg text-yellow-500' : 'text-slate-400 hover:bg-slate-600'
            }`}
          >
            ☀️
          </button>
          <div className="relative inline-block w-14 h-7">
            <input 
              type="checkbox" 
              checked={darkMode}
              onChange={(e) => setDarkMode(e.target.checked)}
              className="sr-only peer" 
            />
            <div className={`w-14 h-7 rounded-full peer peer-focus:ring-2 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:rounded-full after:h-6 after:w-6 after:transition-all ${
              darkMode 
                ? 'bg-blue-600 peer-focus:ring-blue-300 after:bg-white'
                : 'bg-slate-300 peer-focus:ring-slate-400 after:bg-white'
            }`}></div>
          </div>
          <button 
            onClick={() => setDarkMode(true)}
            className={`p-2 rounded-full transition-all ${
              darkMode ? 'bg-slate-600 shadow-lg text-blue-400' : 'text-slate-400 hover:bg-slate-300'
            }`}
          >
            🌙
          </button>
        </div>

        {/* Right Side - Notificações e Profile */}
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

      {phase === 'config' && (
        <div className="h-[calc(100vh-80px)] py-8">
          <Carousel3D
            items={[
              {
                id: 1,
                content: <Calendar darkMode={darkMode} />
              },
              {
                id: 2,
                content: (
                  <div className={`rounded-2xl p-8 shadow-2xl backdrop-blur-sm border transition-colors ${
                    darkMode
                      ? 'bg-slate-800/50 border-slate-700/50'
                      : 'bg-white border-slate-200'
                  }`}>
                    <h2 className={`text-2xl font-bold mb-6 text-center ${
                      darkMode ? 'text-slate-100' : 'text-slate-800'
                    }`}>
                      📚 Escolha a Atividade
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
                  </div>
                )
              },
              {
                id: 3,
                content: <PerformanceChart darkMode={darkMode} />
              },
              {
                id: 4,
                content: <ProgressCards darkMode={darkMode} />
              },
              {
                id: 5,
                content: <ChatCard darkMode={darkMode} />
              }
            ]}
            initialIndex={1}
          />
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

      <EssayPrompt
        isOpen={phase === 'essay-prompt'}
        theme={studyTheme}
        onStart={handleStartEssay}
      />

      <EssayEditor
        isOpen={phase === 'writing-essay'}
        theme={essayData.theme}
        content={essayData.content}
        wordCount={essayData.wordCount}
        lineCount={essayData.lineCount}
        minLines={essayData.minLines}
        onChange={handleEssayChange}
        onSubmit={handleSubmitEssay}
      />

      <CorrectionDisplay
        isOpen={phase === 'correction'}
        essayContent={essayData.content}
        theme={essayData.theme}
        correction={correction}
        onFinish={handleFinish}
      />

      {showToast && (
        <Toast
          message={`Você acertou ${toastScore.score} de ${toastScore.total} questões!`}
          score={toastScore.score}
          total={toastScore.total}
          onClose={() => setShowToast(false)}
        />
      )}

      <Chatbot />
    </div>
  );
}
