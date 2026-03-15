import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authService } from '../../../services/authService';
import type { User } from '../../../types';
import { NotificationDropdown, ProfileMenu } from '../../../components/Dashboard';
import { AlunoSidebar } from '../../../components/AlunoSidebar';
import { useSSEProgress } from '../../../hooks/useSSEProgress';
import type { ExtendedEssayCorrection, ViewMode } from './types';
import { OverviewTab } from './components/OverviewTab';
import { DetailedTab } from './components/DetailedTab';
import { ProfessorTab } from './components/ProfessorTab';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function RedacaoCorrecaoView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [darkMode, setDarkMode] = useState(false);
  const correcaoId = id ? Number(id) : null;

  const { progressData, error: sseError, isConnected } = useSSEProgress(correcaoId);
  const [correcaoCompleta, setCorrecaoCompleta] = useState<ExtendedEssayCorrection | null>(null);
  const [mostrarCorrecao, setMostrarCorrecao] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [progresso, setProgresso] = useState(0);
  const [status, setStatus] = useState('processando');
  const [viewMode, setViewMode] = useState<ViewMode>('overview');

  const statusNormalizado = (status || '').toLowerCase();
  const isConcluida = statusNormalizado.includes('conclu');
  const isProcessando = statusNormalizado.includes('process');
  const isErro = statusNormalizado.includes('erro');

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);
  }, [navigate]);

  useEffect(() => {
    if (!progressData) return;

    setProgresso(progressData.progresso);
    setStatus(progressData.status);
    setIsLoading(false);

    const statusLower = (progressData.status || '').toLowerCase();
    if (statusLower.includes('conclu') && correcaoId && !correcaoCompleta) {
      loadCorrecaoCompleta(correcaoId);
    }
  }, [progressData, correcaoId, correcaoCompleta]);

  const loadCorrecaoCompleta = async (correcaoIdParam: number) => {
    try {
      const response = await fetch(`${API_URL}/RedacaoCorrecao/${correcaoIdParam}`);
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

  if (!user) return null;

  return (
    <div className={`min-h-screen overflow-x-hidden transition-colors duration-300 ${darkMode ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200'}`}>
      <AlunoSidebar darkMode={darkMode} onToggleTheme={() => setDarkMode(!darkMode)} />

      <div className="md:ml-52 min-h-screen flex flex-col">
        <div className={`backdrop-blur-sm pl-14 pr-3 md:pl-6 md:pr-6 py-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 sticky top-0 z-30 transition-colors duration-300 ${darkMode ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white/90 border-slate-200 shadow-sm'}`}>
          <div className="flex items-center gap-3 flex-1">
            <button
              onClick={() => navigate('/aluno/redacao/historico')}
              className={`shrink-0 w-9 h-9 flex items-center justify-center rounded-xl border transition-colors ${darkMode ? 'border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white' : 'border-slate-200 text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
              title="Voltar ao histórico"
            >
              ←
            </button>
            <div>
              <h1 className={`text-lg sm:text-xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>📊 Correção de Redação</h1>
              <p className={`text-xs sm:text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {isProcessando ? 'Aguarde enquanto processamos sua redação...' : 'Correção concluída!'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 self-end sm:self-auto">
            <NotificationDropdown darkMode={darkMode} />
            <ProfileMenu user={user} darkMode={darkMode} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />
          </div>
        </div>

        <div className="flex-1 p-3 sm:p-4 md:p-6">
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
                    { label: 'Finalizando', min: 95, max: 100 },
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

            {/* Tab content */}
            {mostrarCorrecao && isConcluida && correcaoCompleta && (
              viewMode === 'overview'
                ? <OverviewTab correcaoCompleta={correcaoCompleta} darkMode={darkMode} viewMode={viewMode} setViewMode={setViewMode} />
                : viewMode === 'professor'
                ? <ProfessorTab correcaoCompleta={correcaoCompleta} darkMode={darkMode} viewMode={viewMode} setViewMode={setViewMode} />
                : <DetailedTab correcaoCompleta={correcaoCompleta} darkMode={darkMode} viewMode={viewMode} setViewMode={setViewMode} />
            )}

            {/* Error state */}
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
