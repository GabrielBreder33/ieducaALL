import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../../services/authService';
import { aiService } from '../../../services/aiService';
import type { User } from '../../../types';
import { NotificationDropdown, ProfileMenu } from '../../../components/Dashboard';
import { AlunoSidebar } from '../../../components/AlunoSidebar';

interface Alternativa {
  letra: string;
  texto: string;
}

interface Questao {
  numero: number;
  enunciado: string;
  alternativas?: Alternativa[];
}

interface Gabarito {
  questao: number;
  respostaCorreta: string;
  explicacao: string;
}

interface AtividadeGerada {
  id: string;
  configuracao: any;
  criadaEm: string;
  questoes: Questao[];
  gabarito: Gabarito[];
}

interface Resposta {
  questao: number;
  resposta: string;
}

export default function ExecutarAtividade() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  
  // Estado da atividade
  const [atividade, setAtividade] = useState<AtividadeGerada | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [questaoAtual, setQuestaoAtual] = useState(0);
  const [respostas, setRespostas] = useState<Resposta[]>([]);
  const [tempoDecorrido, setTempoDecorrido] = useState(0);
  const [mostrarConfirmacao, setMostrarConfirmacao] = useState(false);
  const [respondendo, setRespondendo] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    
    // Carregar atividade do localStorage
    const atividadeStr = localStorage.getItem('atividadeAtual');
    if (atividadeStr) {
      try {
        const atividadeData = JSON.parse(atividadeStr);
        setAtividade(atividadeData);
        setCarregando(false);
      } catch (error) {
        console.error('Erro ao carregar atividade:', error);
        setCarregando(false);
      }
    } else {
      setCarregando(false);
    }
  }, [navigate]);

  // Timer
  useEffect(() => {
    if (!respondendo) return;
    
    const interval = setInterval(() => {
      setTempoDecorrido(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [respondendo]);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleUpdateUser = (updatedData: Partial<User>) => {
    const updatedUser = { ...user, ...updatedData } as User;
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const formatTempo = (segundos: number) => {
    const mins = Math.floor(segundos / 60);
    const secs = segundos % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getRespostaAtual = () => {
    if (!atividade || !atividade.questoes[questaoAtual]) return '';
    const questao = atividade.questoes[questaoAtual];
    return respostas.find(r => r.questao === questao.numero)?.resposta || '';
  };

  const handleResposta = (resposta: string) => {
    if (!atividade || !atividade.questoes[questaoAtual]) return;
    const questao = atividade.questoes[questaoAtual];
    
    setRespostas(prev => {
      const existente = prev.findIndex(r => r.questao === questao.numero);
      if (existente >= 0) {
        const novas = [...prev];
        novas[existente] = { questao: questao.numero, resposta };
        return novas;
      }
      return [...prev, { questao: questao.numero, resposta }];
    });
  };

  const handleProxima = () => {
    if (!atividade) return;
    if (questaoAtual < atividade.questoes.length - 1) {
      setQuestaoAtual(prev => prev + 1);
    }
  };

  const handleAnterior = () => {
    if (questaoAtual > 0) {
      setQuestaoAtual(prev => prev - 1);
    }
  };

  const handleFinalizar = () => {
    setMostrarConfirmacao(true);
  };

  const handleConfirmarFinalizacao = async () => {
    if (!atividade || !user) return;
    
    setSalvando(true);
    setMostrarConfirmacao(false);
    setRespondendo(false);
    
    try {
      // Converter respostas para o formato esperado pela API
      const respostasFormatadas = respostas.map(r => ({
        questao: r.questao,
        resposta: r.resposta
      }));
      
      // Gerar ID único da atividade (pode usar timestamp + userId)
      const atividadeId = `${user.id}_${Date.now()}`;
      
      // Corrigir e salvar a atividade
      await aiService.corrigirAtividade(
        atividadeId,
        atividade.gabarito,
        respostasFormatadas,
        atividade
      );
      
      console.log('✅ Atividade salva com sucesso!');
      
      // Navegar para resultado
      navigate('/aluno/atividades');
    } catch (error) {
      console.error('❌ Erro ao salvar atividade:', error);
      alert('Erro ao salvar atividade. Por favor, tente novamente.');
      setRespondendo(true);
    } finally {
      setSalvando(false);
    }
  };

  const getQuestoesRespondidas = () => {
    return respostas.filter(r => r.resposta.trim() !== '').length;
  };

  const isQuestaoRespondida = (numeroQuestao: number) => {
    return respostas.some(r => r.questao === numeroQuestao && r.resposta.trim() !== '');
  };

  if (!user) {
    return null;
  }
if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando atividade...</p>
        </div>
      </div>
    );
  }

  if (!atividade || !atividade.questoes || atividade.questoes.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-slate-600 mb-4">❌ Nenhuma atividade encontrada</p>
          <button
            onClick={() => navigate('/aluno/atividades')}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700"
          >
            Voltar para Atividades
          </button>
        </div>
      </div>
    );
  }

  const questao = atividade.questoes[questaoAtual];
  const progressoPercentual = ((questaoAtual + 1) / atividade.questoes.length) * 100;
  
  // Verifica se tem alternativas válidas (para múltipla escolha)
  // Se alternativas não existir, for null, undefined ou array vazio = questão discursiva
  const temAlternativas = Boolean(
    questao?.alternativas && 
    Array.isArray(questao.alternativas) && 
    questao.alternativas.length > 0
  );

  console.log('=== DEBUG QUESTÃO COMPLETA ===');
  console.log('Questão número:', questao.numero);
  console.log('Enunciado:', questao.enunciado);
  console.log('Alternativas (raw):', questao?.alternativas);
  console.log('Alternativas (tipo):', typeof questao?.alternativas);
  console.log('É array?', Array.isArray(questao?.alternativas));
  console.log('Tamanho:', questao?.alternativas?.length);
  console.log('Tem alternativas (múltipla)?', temAlternativas);
  console.log('É DISCURSIVA?', !temAlternativas);
  console.log('Resposta atual:', getRespostaAtual());
  console.log('============================');

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
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/aluno/atividades')}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {atividade.configuracao?.conteudo || 'Atividade'}
              </h1>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {atividade.configuracao?.materia || 'Matéria'} • Nível {atividade.configuracao?.nivel || 'Médio'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              darkMode ? 'bg-slate-700' : 'bg-slate-100'
            }`}>
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className={`font-mono font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                {formatTempo(tempoDecorrido)}
              </span>
            </div>
            <NotificationDropdown darkMode={darkMode} />
            <ProfileMenu
              user={user}
              darkMode={darkMode}
              onLogout={handleLogout}
              onUpdateUser={handleUpdateUser}
            />
          </div>
        </div>

        {/* Progress Bar */}
        <div className={`px-6 py-3 border-b ${
          darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'
        }`}>
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className={`text-sm font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Questão {questaoAtual + 1} de {atividade.questoes.length}
              </span>
              <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                {getQuestoesRespondidas()} respondidas
              </span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressoPercentual}%` }}
              />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Navegação de Questões - Sidebar */}
              <div className="lg:col-span-1">
                <div className={`rounded-2xl border p-6 sticky top-24 ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                }`}>
                  <h3 className={`font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    📋 Navegação
                  </h3>
                  <div className="grid grid-cols-5 gap-2">
                    {atividade.questoes.map((q, index) => (
                      <button
                        key={q.numero}
                        onClick={() => setQuestaoAtual(index)}
                        className={`aspect-square rounded-lg font-bold text-sm transition-all ${
                          index === questaoAtual
                            ? 'bg-blue-600 text-white shadow-lg scale-110'
                            : isQuestaoRespondida(q.numero)
                            ? darkMode
                              ? 'bg-green-600 text-white'
                              : 'bg-green-100 text-green-700 border-2 border-green-300'
                            : darkMode
                            ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {q.numero}
                      </button>
                    ))}
                  </div>
                  
                  <div className="mt-6 space-y-2">
                    <div className="flex items-center gap-2 text-xs">
                      <div className="w-4 h-4 rounded bg-blue-600"></div>
                      <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Atual</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className={`w-4 h-4 rounded ${darkMode ? 'bg-green-600' : 'bg-green-100 border-2 border-green-300'}`}></div>
                      <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Respondida</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <div className={`w-4 h-4 rounded ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}></div>
                      <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Não respondida</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Questão Atual */}
              <div className="lg:col-span-3">
                <div className={`rounded-2xl border p-8 mb-6 ${
                  darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'
                }`}>
                  {/* Tipo da Questão */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      temAlternativas
                        ? 'bg-purple-100 text-purple-700 border border-purple-300'
                        : 'bg-orange-100 text-orange-700 border border-orange-300'
                    }`}>
                      {temAlternativas ? '🎯 Múltipla Escolha' : '📝 Discursiva'}
                    </span>
                  </div>

                  {/* Enunciado */}
                  <div className="mb-8">
                    <h2 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      Questão {questao.numero}
                    </h2>
                    <p className={`text-lg leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                      {questao.enunciado}
                    </p>
                  </div>

                  {/* Alternativas (Múltipla Escolha) */}
                  {temAlternativas && questao.alternativas && (
                    <div className="space-y-3">
                      {questao.alternativas.map((alt) => (
                        <button
                          key={alt.letra}
                          onClick={() => handleResposta(alt.letra)}
                          className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                            getRespostaAtual() === alt.letra
                              ? 'border-blue-600 bg-blue-50 shadow-lg'
                              : darkMode
                              ? 'border-slate-700 bg-slate-700/50 hover:border-slate-600 hover:bg-slate-700'
                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-start gap-4">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold flex-shrink-0 ${
                              getRespostaAtual() === alt.letra
                                ? 'bg-blue-600 text-white'
                                : darkMode
                                ? 'bg-slate-600 text-slate-300'
                                : 'bg-slate-200 text-slate-700'
                            }`}>
                              {alt.letra}
                            </div>
                            <p className={`text-base leading-relaxed flex-1 ${
                              getRespostaAtual() === alt.letra
                                ? 'text-blue-900 font-medium'
                                : darkMode ? 'text-slate-300' : 'text-slate-700'
                            }`}>
                              {alt.texto}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Resposta Discursiva */}
                  {!temAlternativas && (
                    <div className="space-y-3">
                      {/* DEBUG: Indicador visual */}
                      <div className="bg-orange-100 border-2 border-orange-400 rounded-lg p-3 text-orange-800 text-sm font-semibold">
                        📝 QUESTÃO DISCURSIVA - Digite sua resposta abaixo
                      </div>
                      
                      <label className={`block text-sm font-semibold mb-2 ${
                        darkMode ? 'text-slate-300' : 'text-slate-700'
                      }`}>
                        Sua resposta:
                      </label>
                      <textarea
                        value={getRespostaAtual()}
                        onChange={(e) => handleResposta(e.target.value)}
                        rows={8}
                        className={`w-full px-4 py-3 rounded-xl border-2 transition-colors ${
                          darkMode
                            ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-400 focus:border-blue-500'
                            : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400 focus:border-blue-600'
                        } focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                        placeholder="Digite sua resposta aqui... Seja claro e objetivo."
                      />
                      <p className={`text-xs mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {getRespostaAtual().length} caracteres
                      </p>
                    </div>
                  )}

                  {/* DEBUG: Caso nenhum tipo seja renderizado */}
                  {temAlternativas === undefined && (
                    <div className="bg-red-100 border-2 border-red-400 rounded-lg p-4 text-red-800">
                      <p className="font-bold">⚠️ ERRO: Tipo de questão indefinido</p>
                      <p className="text-sm mt-2">alternativas: {JSON.stringify(questao?.alternativas)}</p>
                    </div>
                  )}
                </div>

                {/* Botões de Navegação */}
                <div className="flex items-center justify-between gap-4">
                  <button
                    onClick={handleAnterior}
                    disabled={questaoAtual === 0}
                    className={`px-6 py-3 rounded-xl font-bold transition-all ${
                      questaoAtual === 0
                        ? 'opacity-50 cursor-not-allowed bg-slate-300'
                        : darkMode
                        ? 'bg-slate-700 text-white hover:bg-slate-600'
                        : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                    }`}
                  >
                    ← Anterior
                  </button>

                  <div className="flex-1"></div>

                  {questaoAtual < atividade.questoes.length - 1 ? (
                    <button
                      onClick={handleProxima}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl"
                    >
                      Próxima →
                    </button>
                  ) : (
                    <button
                      onClick={handleFinalizar}
                      className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl"
                    >
                      ✓ Finalizar Atividade
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação */}
      {mostrarConfirmacao && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`max-w-md w-full rounded-2xl p-8 ${
            darkMode ? 'bg-slate-800' : 'bg-white'
          }`}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Finalizar Atividade?
              </h3>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Você respondeu <strong>{getQuestoesRespondidas()}</strong> de <strong>{atividade.questoes.length}</strong> questões.
              </p>
              {getQuestoesRespondidas() < atividade.questoes.length && (
                <p className="text-sm text-orange-600 mt-2">
                  ⚠️ Ainda há questões não respondidas!
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setMostrarConfirmacao(false)}
                className={`flex-1 px-6 py-3 rounded-xl font-bold transition-all ${
                  darkMode
                    ? 'bg-slate-700 text-white hover:bg-slate-600'
                    : 'bg-slate-200 text-slate-900 hover:bg-slate-300'
                }`}
              >
                Revisar
              </button>
              <button
                onClick={handleConfirmarFinalizacao}
                className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Salvando */}
      {salvando && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`max-w-md w-full rounded-2xl p-8 ${
            darkMode ? 'bg-slate-800' : 'bg-white'
          }`}>
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Salvando sua atividade...
              </h3>
              <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Aguarde enquanto processamos suas respostas
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
