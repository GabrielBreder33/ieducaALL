import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/authService';
import type { User } from '../types';
import { NotificationDropdown, ProfileMenu } from '../components/Dashboard';
import { AlunoSidebar } from '../components/AlunoSidebar';
import { ConfiguracaoAtividadeComponent } from '../components/ConfiguracaoAtividade';
import { ExibicaoAtividadeComponent, ResultadoAtividadeComponent } from '../components/ExibicaoAtividade';
import { 
  ConfiguracaoAtividade, 
  AtividadeGerada, 
  RespostaAluno,
  ResultadoAtividade
} from '../types/atividade';
import { aiService } from '../services/aiService';

type EstadoFluxo = 'configuracao' | 'respondendo' | 'resultado';

export const AtividadeIAPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [estado, setEstado] = useState<EstadoFluxo>('configuracao');
  const [carregando, setCarregando] = useState(false);
  const [progressoGeracao, setProgressoGeracao] = useState(0);
  const [mensagemGeracao, setMensagemGeracao] = useState('Preparando...');
  const [atividadeAtual, setAtividadeAtual] = useState<AtividadeGerada | null>(null);
  const [resultadoAtual, setResultadoAtual] = useState<ResultadoAtividade | null>(null);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);

    // Verificar se há uma atividade para refazer
    const atividadeRefazer = location.state?.atividadeRefazer || 
                            JSON.parse(localStorage.getItem('atividadeRefazer') || 'null');
    
    if (atividadeRefazer) {
      console.log('🔄 Carregando atividade para refazer:', atividadeRefazer);
      setAtividadeAtual(atividadeRefazer);
      setEstado('respondendo');
      localStorage.removeItem('atividadeRefazer'); // Limpar depois de usar
    }
  }, [navigate, location]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleUpdateUser = (updatedData: Partial<User>) => {
    const updatedUser = { ...user, ...updatedData } as User;
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const handleGerarAtividade = async (config: ConfiguracaoAtividade) => {
    setCarregando(true);
    setProgressoGeracao(0);
    setMensagemGeracao('Iniciando geração...');
    try {
      const atividade = await aiService.gerarAtividadeStream(config, (percent, message) => {
        setProgressoGeracao(Math.max(0, Math.min(100, percent)));
        if (message) setMensagemGeracao(message);
      });
      setAtividadeAtual(atividade);
      // Salvar no localStorage para ExecutarAtividade usar
      localStorage.setItem('atividadeAtual', JSON.stringify(atividade));
      setEstado('respondendo');
    } catch (error) {
      console.error('Erro ao gerar atividade:', error);
      alert('Erro ao gerar atividade. Por favor, tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const handleSubmeterRespostas = async (respostas: RespostaAluno[]) => {
    if (!atividadeAtual) return;

    setCarregando(true);
    try {
      const resultado = await aiService.corrigirAtividade(
        atividadeAtual.id,
        atividadeAtual.gabarito,
        respostas,
        atividadeAtual // Passar atividade completa para salvar no banco
      );
      setResultadoAtual(resultado);
      setEstado('resultado');
    } catch (error) {
      console.error('Erro ao corrigir atividade:', error);
      alert('Erro ao corrigir atividade. Por favor, tente novamente.');
    } finally {
      setCarregando(false);
    }
  };

  const handleNovaAtividade = () => {
    // Navegar de volta para a página de atividades
    navigate('/aluno/atividades');
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
              🤖 Gerador de Atividades com IA
            </h1>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Crie atividades personalizadas em segundos
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
          <div className="max-w-6xl mx-auto">
            {/* Breadcrumb */}
            <div className={`text-sm mb-6 flex items-center gap-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              <button onClick={() => navigate('/aluno/estudos')} className="hover:text-blue-600">
                Dashboard
              </button>
              <span>/</span>
              <button onClick={() => navigate('/aluno/atividades')} className="hover:text-blue-600">
                Atividades
              </button>
              <span>/</span>
              <span className={darkMode ? 'text-white' : 'text-slate-900'}>Gerador IA</span>
            </div>

            {/* Progress Indicator */}
            <div className="mb-8">
              <div className="flex items-center justify-center gap-4">
                <div className={`flex items-center gap-2 ${estado === 'configuracao' ? 'text-blue-600 font-semibold' : 'text-gray-400'}`}>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center ${estado === 'configuracao' ? 'bg-blue-600 text-white' : 'bg-gray-300'}`}>
                    1
                  </span>
                  <span className="hidden md:inline">Configurar</span>
                </div>
                <div className={`w-16 h-1 ${estado !== 'configuracao' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                <div className={`flex items-center gap-2 ${estado === 'respondendo' ? 'text-green-600 font-semibold' : 'text-gray-400'}`}>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center ${estado === 'respondendo' ? 'bg-green-600 text-white' : 'bg-gray-300'}`}>
                    2
                  </span>
                  <span className="hidden md:inline">Responder</span>
                </div>
                <div className={`w-16 h-1 ${estado === 'resultado' ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
                <div className={`flex items-center gap-2 ${estado === 'resultado' ? 'text-purple-600 font-semibold' : 'text-gray-400'}`}>
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center ${estado === 'resultado' ? 'bg-purple-600 text-white' : 'bg-gray-300'}`}>
                    3
                  </span>
                  <span className="hidden md:inline">Resultado</span>
                </div>
              </div>
            </div>

            {/* Conteúdo Principal */}
            {estado === 'configuracao' && (
              <ConfiguracaoAtividadeComponent 
                onGerarAtividade={handleGerarAtividade}
                carregando={carregando}
              />
            )}

            {estado === 'respondendo' && atividadeAtual && (
              <ExibicaoAtividadeComponent
                atividade={atividadeAtual}
                onSubmeterRespostas={handleSubmeterRespostas}
                carregando={carregando}
              />
            )}

            {estado === 'resultado' && resultadoAtual && atividadeAtual && (
              <ResultadoAtividadeComponent
                resultado={resultadoAtual}
                atividade={atividadeAtual}
                onNovaAtividade={handleNovaAtividade}
              />
            )}

            {/* Loading Overlay */}
            {carregando && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-lg font-semibold text-gray-800">
                    {estado === 'configuracao' ? 'Gerando atividade...' : 'Corrigindo respostas...'}
                  </p>
                  {estado === 'configuracao' ? (
                    <div className="mt-3 w-72">
                      <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden mb-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progressoGeracao}%` }}
                        />
                      </div>
                      <p className="text-sm text-gray-700 font-medium">{progressoGeracao}%</p>
                      <p className="text-sm text-gray-600 mt-1">{mensagemGeracao}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600 mt-2">
                      Isso pode levar alguns segundos
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
