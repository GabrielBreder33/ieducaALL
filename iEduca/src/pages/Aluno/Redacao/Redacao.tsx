import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../../services/authService';
import { aiService } from '../../../services/aiService';
import type { User } from '../../../types';
import { NotificationDropdown, ProfileMenu } from '../../../components/Dashboard';

export default function Redacao() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [isEditingTheme, setIsEditingTheme] = useState<boolean>(true);
  
  const [essayData, setEssayData] = useState({
    theme: '',
    type: 'ENEM' as const,
    minLines: 20,
    content: '',
    wordCount: 0,
    lineCount: 0
  });

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);
  }, [navigate]);

  const handleEssayChange = (content: string) => {
    const lines = content.split('\n');
    const words = content.trim().split(/\s+/).filter(word => word.length > 0);

    let totalLines = 0;
    lines.forEach(line => {
      if (line.trim().length > 0) {
        totalLines += Math.max(1, Math.ceil(line.length / 90));
      }
    });

    setEssayData({
      ...essayData,
      content,
      lineCount: totalLines,
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

    if (!user || !user.id) {
      alert('Erro: Usuário não autenticado');
      return;
    }

    try {
      // Para redações avulsas (não vinculadas a uma atividade específica), usar null
      const execucaoId = null;

      // Enviar redação para correção
      const response = await aiService.correctEssay(
        user.id,
        execucaoId,
        essayData.theme,
        essayData.content,
        essayData.type
      );

      // Redirecionar para o histórico de redações
      navigate('/aluno/redacao/historico');
    } catch (error) {
      console.error('Erro ao corrigir redação:', error);
      alert('Erro ao processar a correção. Tente novamente.');
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
    <div className={`min-h-screen transition-colors duration-300 ${darkMode
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
        : 'bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200'
      }`}>
      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-screen w-52 border-r transition-colors duration-300 flex flex-col ${darkMode
          ? 'bg-slate-900/50 border-slate-700/50'
          : 'bg-white border-slate-200'
        }`}>
        <div className="p-6 flex-shrink-0">
          <div className="flex items-center gap-2 mb-8">
            <h1 className="text-xl font-bold text-blue-600">IEDUCA</h1>
          </div>

          <nav className="space-y-2">
            <button 
              onClick={() => navigate('/aluno/estudos')}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${darkMode
                  ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Dashboard
            </button>

            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-600 text-white font-medium transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Redações
            </button>

            <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${darkMode
                ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Atividades
            </button>

            <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${darkMode
                ? 'text-slate-400 hover:bg-slate-800 hover:text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Desempenho
            </button>
          </nav>
        </div>

        <div className="mt-auto p-6 flex-shrink-0">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors border-2 ${darkMode
                ? 'text-slate-400 hover:bg-slate-800 hover:text-white border-slate-700'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border-slate-300'
              }`}
          >
            <span className="text-xl">{darkMode ? '🌙' : '☀️'}</span>
            Alternar Tema
          </button>
        </div>
      </div>

      <div className="ml-52 min-h-screen flex flex-col">
        {/* Header */}
        <div className={`backdrop-blur-sm px-6 py-4 border-b flex justify-between items-center sticky top-0 z-40 transition-colors duration-300 ${darkMode
            ? 'bg-slate-800/80 border-slate-700/50'
            : 'bg-white/90 border-slate-200 shadow-sm'
          }`}>
          <div>
            <h1 className={`text-xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              ✍️ Redação ENEM
            </h1>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Pratique e receba correção detalhada por IA
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
          <div className={`flex-1 ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
            <div className="max-w-7xl mx-auto px-6 py-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Editor de Redação */}
                <div className="lg:col-span-2">
                  <div className={`rounded-2xl shadow-lg border ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                      {/* Header */}
                      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="px-3 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                            Redação Dissertativa-Argumentativa
                          </span>
                        </div>
                        {isEditingTheme ? (
                          <div className="space-y-3">
                            <input
                              type="text"
                              value={essayData.theme}
                              onChange={(e) => setEssayData({ ...essayData, theme: e.target.value })}
                              placeholder="Digite o tema da redação..."
                              className={`text-2xl font-bold w-full px-3 py-2 rounded-lg border-2 focus:outline-none focus:border-blue-500 ${darkMode ? 'bg-slate-700 text-white border-slate-600 placeholder-slate-400' : 'bg-white text-slate-900 border-slate-300 placeholder-slate-400'}`}
                              autoFocus
                            />
                            {essayData.theme.trim() && (
                              <button
                                onClick={() => setIsEditingTheme(false)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                              >
                                Confirmar Tema
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                              {essayData.theme}
                            </h2>
                            <button
                              onClick={() => setIsEditingTheme(true)}
                              className={`p-2 rounded-lg hover:bg-slate-100 ${darkMode ? 'hover:bg-slate-700' : ''}`}
                            >
                              <svg className={`w-5 h-5 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                          </div>
                        )}
                        <p className={`text-sm mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          Foque em argumentação clara e propostas de intervenção.
                        </p>
                      </div>

                      <div className="p-6">
                        <textarea
                          value={essayData.content}
                          onChange={(e) => handleEssayChange(e.target.value)}
                          placeholder="Comece a escrever sua redação aqui... Lembre-se de estruturar seu texto com uma introdução, parágrafos de desenvolvimento e uma conclusão."
                          className={`w-full h-96 resize-none focus:outline-none font-serif text-base leading-relaxed ${darkMode ? 'bg-slate-800 text-white placeholder-slate-500' : 'bg-white text-slate-900 placeholder-slate-400'}`}
                        />
                      </div>

                      {/* Footer */}
                      <div className={`p-4 border-t flex items-center justify-between ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                        <div className="flex items-center gap-6">
                          <div>
                            <div className={`text-xs font-bold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                              Palavras
                            </div>
                            <div className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                              {essayData.wordCount}
                            </div>
                          </div>
                          <div>
                            <div className={`text-xs font-bold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                              Linhas
                            </div>
                            <div className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                              {essayData.lineCount}
                            </div>
                            <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                              Min: {essayData.minLines} / Max 30
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                {/* Quick Tips */}
                <div className="lg:col-span-1">
                  <div className={`rounded-2xl shadow-lg border p-6 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                      <div className="flex items-center gap-2 mb-6">
                        <span className="text-2xl">💡</span>
                        <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          Dicas rápidas
                        </h3>
                      </div>
                      <p className={`text-sm mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        Foque nessas 5 competências do ENEM.
                      </p>

                      <div className="space-y-4">
                        {/* COMP. 1 */}
                        <details className={`group ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          <summary className="cursor-pointer list-none">
                            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                              <div>
                                <div className="text-xs font-bold text-blue-600 mb-1">COMP. 1</div>
                                <div className="font-bold">Norma Culta</div>
                              </div>
                              <svg className="w-5 h-5 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </summary>
                          <p className={`text-sm mt-2 px-3 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Demonstre domínio da norma culta formal da língua portuguesa.
                          </p>
                        </details>

                        {/* COMP. 2 */}
                        <details className={`group ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          <summary className="cursor-pointer list-none">
                            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                              <div>
                                <div className="text-xs font-bold text-blue-600 mb-1">COMP. 2</div>
                                <div className="font-bold">Compreensão</div>
                              </div>
                              <svg className="w-5 h-5 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </summary>
                          <p className={`text-sm mt-2 px-3 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Entenda a proposta e aplique conceitos de diversas áreas do conhecimento.
                          </p>
                        </details>

                        {/* COMP. 3 */}
                        <details className={`group ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          <summary className="cursor-pointer list-none">
                            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                              <div>
                                <div className="text-xs font-bold text-blue-600 mb-1">COMP. 3</div>
                                <div className="font-bold">Argumentação</div>
                              </div>
                              <svg className="w-5 h-5 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </summary>
                          <p className={`text-sm mt-2 px-3 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Selecione, relacione, organize e interprete informações em defesa de um ponto de vista.
                          </p>
                        </details>

                        {/* COMP. 4 */}
                        <details className={`group ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          <summary className="cursor-pointer list-none">
                            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                              <div>
                                <div className="text-xs font-bold text-blue-600 mb-1">COMP. 4</div>
                                <div className="font-bold">Coesão</div>
                              </div>
                              <svg className="w-5 h-5 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </summary>
                          <p className={`text-sm mt-2 px-3 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Demonstre conhecimento dos mecanismos linguísticos necessários para construir a argumentação.
                          </p>
                        </details>

                        {/* COMP. 5 */}
                        <details className={`group ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          <summary className="cursor-pointer list-none">
                            <div className="flex items-center justify-between p-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
                              <div>
                                <div className="text-xs font-bold text-blue-600 mb-1">COMP. 5</div>
                                <div className="font-bold">Proposta</div>
                              </div>
                              <svg className="w-5 h-5 transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                          </summary>
                          <p className={`text-sm mt-2 px-3 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            Desenvolva uma proposta de intervenção para o problema que respeite os direitos humanos.
                          </p>
                        </details>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Botão Enviar */}
                <button
                  onClick={handleSubmitEssay}
                  className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                >
                  Enviar para Correção
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}
