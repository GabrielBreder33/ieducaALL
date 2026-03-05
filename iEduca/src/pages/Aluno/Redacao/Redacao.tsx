import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../../../services/authService';
import { aiService } from '../../../services/aiService';
import type { User } from '../../../types';
import { NotificationDropdown, ProfileMenu } from '../../../components/Dashboard';
import { AlunoSidebar } from '../../../components/AlunoSidebar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
// Limites por redação
const MIN_CHARS = 4000;
const MAX_CHARS = 6800;

const countWords = (text: string) => {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
};

export default function Redacao() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rascunhoIdParam = searchParams.get('rascunhoId');
  const rascunhoId = rascunhoIdParam ? parseInt(rascunhoIdParam) : null;
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [isEditingTheme, setIsEditingTheme] = useState<boolean>(true);
  const [rascunhoAtualId, setRascunhoAtualId] = useState<number | null>(null);
  const [enviandoCorrecao, setEnviandoCorrecao] = useState(false);
  const [validationPopup, setValidationPopup] = useState({ visible: false, title: '', message: '' });
  
  const [essayData, setEssayData] = useState({
    theme: '',
    type: 'ENEM' as const,
    content: '',
    wordCount: 0,
    charCount: 0,
    
  });
  
  const showValidation = (title: string, message: string) => {
    setValidationPopup({ visible: true, title, message });
  };

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }

    setUser(currentUser);

    const loadRascunho = async () => {
      if (!rascunhoId) {
        setRascunhoAtualId(null);
        setIsEditingTheme(true);
        return;
      }

      try {
        const response = await fetch(`${API_URL}/RedacaoCorrecao/${rascunhoId}`);
        if (!response.ok) {
          throw new Error('Erro ao carregar rascunho');
        }

        const data = await response.json();
        const content = data?.textoRedacao || '';

        setEssayData({
          theme: data?.tema || 'Rascunho sem tema',
          type: 'ENEM',
          content,
          wordCount: countWords(content),
          charCount: content.length,
        });
        setRascunhoAtualId(rascunhoId);
        setIsEditingTheme(!(data?.tema && data.tema.trim().length > 0));
      } catch (error) {
        console.error('Erro ao carregar rascunho:', error);
        setValidationPopup({
          visible: true,
          title: 'Erro ao carregar rascunho',
          message: 'Não foi possível carregar este rascunho. Tente novamente pelo histórico.'
        });
      }
    };

    loadRascunho();
  }, [navigate, rascunhoId]);

  const handleEssayChange = (content: string) => {
    setEssayData((prev) => ({
      ...prev,
      content,
      wordCount: countWords(content),
      charCount: content.length,
    }));

    if (content.length > MAX_CHARS) {
      showValidation(
        'Limite de caracteres excedido',
        `Sua redação excede o máximo de ${MAX_CHARS.toLocaleString('pt-BR')} caracteres. Remova caracteres para prosseguir.`
      );
    }
  };

  const handleSubmitEssay = async () => {
    if (!user || !user.id) {
      alert('Erro: Usuário não autenticado');
      navigate('/login');
      return;
    }

    if (!essayData.theme.trim()) {
      showValidation('Informe o tema', 'Defina um tema para conseguirmos enviar sua redação.');
      setIsEditingTheme(true);
      return;
    }

    if (!essayData.content.trim()) {
      showValidation('Texto obrigatório', 'Escreva a redação antes de enviar para correção.');
      return;
    }

    if (essayData.charCount < MIN_CHARS) {
      showValidation(
        'Redação muito curta',
        `Escreva pelo menos ${MIN_CHARS.toLocaleString('pt-BR')} caracteres antes de enviar para correção.`
      );
      return;
    }

    if (essayData.charCount > MAX_CHARS) {
      showValidation(
        'Limite de caracteres excedido',
        `Sua redação excede o máximo de ${MAX_CHARS.toLocaleString('pt-BR')} caracteres. Remova caracteres para prosseguir.`
      );
      return;
    }

    try {
      setEnviandoCorrecao(true);

      await aiService.correctEssay(
        user.id,
        null,
        essayData.theme.trim(),
        essayData.content,
        essayData.type
      );

      navigate('/aluno/redacao/historico');
    } catch (error) {
      console.error('Erro ao corrigir redação:', error);
      alert('Erro ao processar a correção. Tente novamente.');
    } finally {
      setEnviandoCorrecao(false);
    }
  };

  const handleSalvarRascunho = async () => {
    if (!user || !user.id) {
      alert('Erro: Usuário não autenticado');
      return;
    }

    if (!essayData.theme.trim() && !essayData.content.trim()) {
      alert('Preencha ao menos o tema ou conteúdo para salvar o rascunho.');
      return;
    }

    try {
      if (rascunhoAtualId) {
        const response = await fetch(`${API_URL}/RedacaoCorrecao/${rascunhoAtualId}/rascunho`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            tema: essayData.theme.trim() || 'Rascunho sem tema',
            textoRedacao: essayData.content
          })
        });

        if (!response.ok) {
          throw new Error('Erro ao atualizar rascunho');
        }
      } else {
        const resultado = await aiService.correctEssay(
          user.id,
          null,
          essayData.theme.trim() || 'Rascunho sem tema',
          essayData.content,
          'rascunho'
        );

        if (resultado?.id) {
          setRascunhoAtualId(resultado.id);
        }
      }

      navigate('/aluno/redacao/historico');
    } catch (error) {
      console.error('Erro ao salvar rascunho:', error);
      alert('Erro ao salvar rascunho. Tente novamente.');
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
    <>
    <div className={`min-h-screen transition-colors duration-300 ${darkMode
        ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900'
        : 'bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200'
      }`}>
      <AlunoSidebar darkMode={darkMode} onToggleTheme={() => setDarkMode(!darkMode)} />

                    {/* Validation Popup */}
                    {validationPopup.visible && (
                      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                        <div className="absolute inset-0 bg-black/50" onClick={() => setValidationPopup({ ...validationPopup, visible: false })}></div>
                        <div className={`relative w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-2xl ${darkMode ? 'bg-slate-800 text-white border border-slate-700' : 'bg-white text-slate-900'}`}>
                          <div className="p-6">
                            <div className="flex items-start gap-4">
                              <div className={`flex-shrink-0 rounded-full p-2 ${darkMode ? 'bg-slate-700' : 'bg-blue-50'}`}>
                                <svg className={`w-6 h-6 ${darkMode ? 'text-red-400' : 'text-blue-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 6v.01" />
                                </svg>
                              </div>
                              <div className="flex-1">
                                <h3 style={{ color: darkMode ? undefined : '#000' }} className="text-lg font-bold">{validationPopup.title}</h3>
                                <p style={{ color: darkMode ? undefined : '#000' }} className="text-base mt-2 font-bold opacity-100 dark:text-slate-200">{validationPopup.message}</p>
                              </div>
                              <button onClick={() => setValidationPopup({ ...validationPopup, visible: false })} className={`ml-4 p-1 rounded-md ${darkMode ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-500 hover:bg-slate-100'}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                              <button
                                onClick={() => setValidationPopup({ ...validationPopup, visible: false })}
                                className={`px-4 py-2 rounded-lg border ${darkMode ? 'border-slate-600 text-slate-200' : 'border-slate-200 text-slate-700'}`}
                              >
                                Continuar escrevendo
                              </button>
                              <button
                                onClick={async () => {
                                  setValidationPopup({ ...validationPopup, visible: false });
                                  await handleSalvarRascunho();
                                }}
                                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
                              >
                                Salvar Rascunho
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

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
                          maxLength={MAX_CHARS}
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
                              Caracteres
                            </div>
                            <div className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                              {essayData.charCount}
                            </div>
                            <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                              Min: {MIN_CHARS.toLocaleString('pt-BR')} / Max {MAX_CHARS.toLocaleString('pt-BR')}
                            </div>
                          </div>
                        </div>
                        <div className={essayData.charCount < MIN_CHARS ? 'text-sm font-bold text-red-600 dark:text-red-400' : 'text-sm text-slate-500'}>
                          {essayData.charCount >= MAX_CHARS
                            ? 'Limite atingido'
                            : (essayData.charCount < MIN_CHARS
                                ? `${(MIN_CHARS - essayData.charCount).toLocaleString('pt-BR')} caracteres para o mínimo`
                                : null)}
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

                {/* Ações */}
                <div className="w-full mt-6 grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    onClick={handleSalvarRascunho}
                    disabled={enviandoCorrecao}
                    className="w-full bg-slate-600 hover:bg-slate-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    Salvar Rascunho
                  </button>
                  <button
                    onClick={handleSubmitEssay}
                    disabled={enviandoCorrecao}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
      </div>

    </>
  );
}
