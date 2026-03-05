import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../../services/authService';
import type { User } from '../../../types';
import { NotificationDropdown, ProfileMenu } from '../../../components/Dashboard';
import { AlunoSidebar } from '../../../components/AlunoSidebar';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface RedacaoSubmissao {
  id: number;
  tema: string;
  dataEnvio: string;
  status: 'processando' | 'concluida' | 'erro' | 'rascunho';
  progresso: number;
  notaTotal?: number;
  tipoAvaliacao?: string;
}

export default function HistoricoRedacoes() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [filtroAtivo, setFiltroAtivo] = useState<'all' | 'processing' | 'completed' | 'drafts'>('all');
  const [filtroTema, setFiltroTema] = useState('');
  const [filtroNota, setFiltroNota] = useState<'all' | '0-399' | '400-699' | '700-1000'>('all');
  const [dataInicial, setDataInicial] = useState('');
  const [dataFinal, setDataFinal] = useState('');
  const [redacoes, setRedacoes] = useState<RedacaoSubmissao[]>([]);
  const [loading, setLoading] = useState(true);
  const [reenviandoId, setReenviandoId] = useState<number | null>(null);
  const activeStreamsRef = useRef<Map<number, AbortController>>(new Map());

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setUser(currentUser);
    if (currentUser.id) {
      loadRedacoes(currentUser.id);
    }
  }, [navigate]);

  const loadRedacoes = async (_userId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/RedacaoCorrecao/usuario/${_userId}`);
      const data = await response.json();
      setRedacoes(data);
    } catch (error) {
      console.error('Erro ao carregar redações:', error);
    } finally {
      setLoading(false);
    }
  };

  const iniciarStreamProgresso = (redacaoId: number) => {
    if (activeStreamsRef.current.has(redacaoId)) return;

    const controller = new AbortController();
    activeStreamsRef.current.set(redacaoId, controller);

    const executar = async () => {
      try {
        const response = await fetch(`${API_URL}/RedacaoCorrecao/progresso-stream/${redacaoId}`, {
          method: 'GET',
          signal: controller.signal,
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
      } finally {
        activeStreamsRef.current.delete(redacaoId);
      }
    };

    executar();
  };

  useEffect(() => {
    const idsProcessando = redacoes.filter(r => r.status === 'processando').map(r => r.id);

    idsProcessando.forEach((id) => {
      iniciarStreamProgresso(id);
    });
  }, [redacoes]);

  useEffect(() => {
    return () => {
      activeStreamsRef.current.forEach((controller) => controller.abort());
      activeStreamsRef.current.clear();
    };
  }, []);

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleUpdateUser = (updatedData: Partial<User>) => {
    const updatedUser = { ...user, ...updatedData } as User;
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'processando':
        return (
          <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
            🔄 Analisando
          </span>
        );
      case 'concluida':
        return (
          <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
            ✓ Completa
          </span>
        );
      case 'erro':
        return (
          <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
            ⚠️ Erro
          </span>
        );
      case 'rascunho':
        return (
          <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full">
            📝 Rascunho
          </span>
        );
      default:
        return null;
    }
  };

  const handleReenviar = async (redacaoId: number) => {
    if (!user?.id) return;

    try {
      setReenviandoId(redacaoId);

      const response = await fetch(`${API_URL}/RedacaoCorrecao/${redacaoId}/reenviar`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Falha ao reenviar redação');
      }

      const reenviada = await response.json();

      setRedacoes((prev) => {
        return prev.map((r) =>
          r.id === redacaoId
            ? {
                ...r,
                tema: reenviada.tema || r.tema,
                status: 'processando',
                progresso: reenviada.progresso ?? 0,
                notaTotal: undefined,
                dataEnvio: new Date().toISOString()
              }
            : r
        );
      });
    } catch (error) {
      console.error('Erro ao reenviar redação:', error);
      alert('Não foi possível reenviar a redação. Tente novamente.');
    } finally {
      setReenviandoId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) {
      return `${diffMins} ${diffMins === 1 ? 'minuto' : 'minutos'} atrás`;
    } else if (diffHours < 24) {
      return `${diffHours} ${diffHours === 1 ? 'hora' : 'horas'} atrás`;
    } else if (diffDays === 0) {
      return 'Hoje';
    } else {
      return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  };

  const redacoesFiltradas = redacoes
    .filter((r) => {
      if (filtroAtivo === 'all') return r.status !== 'rascunho';
      if (filtroAtivo === 'processing') return r.status === 'processando';
      if (filtroAtivo === 'completed') return r.status === 'concluida';
      if (filtroAtivo === 'drafts') {
        return (r.tipoAvaliacao || '').toLowerCase() === 'rascunho' || r.status === 'rascunho';
      }
      return false;
    })
    .filter((r) => {
      if (!filtroTema.trim()) return true;
      return r.tema.toLowerCase().includes(filtroTema.trim().toLowerCase());
    })
    .filter((r) => {
      if (filtroNota === 'all') return true;
      if (typeof r.notaTotal !== 'number') return false;

      if (filtroNota === '0-399') return r.notaTotal >= 0 && r.notaTotal <= 399;
      if (filtroNota === '400-699') return r.notaTotal >= 400 && r.notaTotal <= 699;
      return r.notaTotal >= 700 && r.notaTotal <= 1000;
    })
    .filter((r) => {
      if (!dataInicial && !dataFinal) return true;

      const dataRedacao = new Date(r.dataEnvio);
      if (dataInicial) {
        const inicio = new Date(`${dataInicial}T00:00:00`);
        if (dataRedacao < inicio) return false;
      }

      if (dataFinal) {
        const fim = new Date(`${dataFinal}T23:59:59`);
        if (dataRedacao > fim) return false;
      }

      return true;
    });

  const processandoCount = redacoes.filter(r => r.status === 'processando').length;

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
        {/* Header */}
        <div className={`backdrop-blur-sm px-6 py-4 border-b flex justify-between items-center sticky top-0 z-40 transition-colors duration-300 ${darkMode
            ? 'bg-slate-800/80 border-slate-700/50'
            : 'bg-white/90 border-slate-200 shadow-sm'
          }`}>
          <div>
            <h1 className={`text-xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Minhas Redações
            </h1>
            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Acompanhe suas correções, feedback e progresso ao longo do tempo.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/aluno/redacao/nova')}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nova Redação
            </button>
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
        <div className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* Filters */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setFiltroAtivo('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filtroAtivo === 'all'
                    ? 'bg-slate-900 text-white'
                    : darkMode
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setFiltroAtivo('processing')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                  filtroAtivo === 'processing'
                    ? 'bg-slate-900 text-white'
                    : darkMode
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                Em Análise
                {processandoCount > 0 && (
                  <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {processandoCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setFiltroAtivo('completed')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filtroAtivo === 'completed'
                    ? 'bg-slate-900 text-white'
                    : darkMode
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                Concluídas
              </button>
              <button
                onClick={() => setFiltroAtivo('drafts')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filtroAtivo === 'drafts'
                    ? 'bg-slate-900 text-white'
                    : darkMode
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                Rascunhos
              </button>

              <div className="ml-auto flex items-center gap-2 flex-wrap justify-end">
                <input
                  type="text"
                  value={filtroTema}
                  onChange={(e) => setFiltroTema(e.target.value)}
                  placeholder="Filtrar por tema"
                  className={`px-3 py-2 rounded-lg text-sm border ${
                    darkMode
                      ? 'bg-slate-800 text-slate-100 border-slate-700 placeholder-slate-400'
                      : 'bg-white text-slate-700 border-slate-300 placeholder-slate-400'
                  }`}
                />
                <select
                  value={filtroNota}
                  onChange={(e) => setFiltroNota(e.target.value as 'all' | '0-399' | '400-699' | '700-1000')}
                  className={`px-3 py-2 rounded-lg text-sm border ${
                    darkMode
                      ? 'bg-slate-800 text-slate-100 border-slate-700'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  <option value="all">Todas as notas</option>
                  <option value="0-399">Nota 0 a 399</option>
                  <option value="400-699">Nota 400 a 699</option>
                  <option value="700-1000">Nota 700 a 1000</option>
                </select>
                <input
                  type="date"
                  value={dataInicial}
                  onChange={(e) => setDataInicial(e.target.value)}
                  className={`px-3 py-2 rounded-lg text-sm border ${
                    darkMode
                      ? 'bg-slate-800 text-slate-100 border-slate-700'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                />
                <input
                  type="date"
                  value={dataFinal}
                  onChange={(e) => setDataFinal(e.target.value)}
                  className={`px-3 py-2 rounded-lg text-sm border ${
                    darkMode
                      ? 'bg-slate-800 text-slate-100 border-slate-700'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                />
              </div>
            </div>

            {/* Redação em processamento */}
            {redacoesFiltradas.filter(r => r.status === 'processando').length > 0 && (
              <div className="mb-6">
                <h3 className={`text-sm font-bold mb-3 uppercase tracking-wide ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Processando Agora
                </h3>
                <div className="space-y-4">
                  {redacoesFiltradas.filter(r => r.status === 'processando').map((redacao) => (
                    <div
                      key={redacao.id}
                      className={`rounded-2xl shadow-lg border overflow-hidden transition-all hover:shadow-xl ${darkMode
                          ? 'bg-slate-800 border-slate-700'
                          : 'bg-white border-slate-200'
                        }`}
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            {getStatusBadge(redacao.status)}
                            <h3 className={`text-lg font-bold mt-3 mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                              Redação: {redacao.tema}
                            </h3>
                            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                              📤 Enviado {formatDate(redacao.dataEnvio)}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className={`text-3xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                              {redacao.progresso}%
                            </div>
                            <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                              ID: #{redacao.id.toString().padStart(6, '0')}
                            </p>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className={`text-sm font-medium mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            Analisando competências e estrutura...
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${redacao.progresso}%` }}
                            ></div>
                          </div>
                        </div>

                        {/* Status Steps */}
                        <div className="flex items-center gap-4 mt-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                              Verificação Sintática
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                              Análise Estrutural
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${redacao.progresso >= 70 ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                            <span className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                              Avaliação de Competências
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rascunhos */}
            {redacoesFiltradas.filter(r => r.status === 'rascunho').length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-sm font-bold uppercase tracking-wide ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Rascunhos
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {redacoesFiltradas.filter(r => r.status === 'rascunho').map((redacao) => (
                    <div
                      key={redacao.id}
                      onClick={() => navigate(`/aluno/redacao/nova?rascunhoId=${redacao.id}`)}
                      className={`rounded-2xl shadow-lg border overflow-hidden transition-all hover:shadow-xl cursor-pointer ${darkMode
                          ? 'bg-slate-800 border-slate-700 hover:border-slate-600'
                          : 'bg-white border-slate-200 hover:border-blue-300'
                        }`}
                    >
                      <div className="h-40 bg-gradient-to-br from-slate-500 to-slate-600 flex items-center justify-center relative">
                        <svg className="w-20 h-20 text-white/30" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                        </svg>
                        <div className="absolute top-3 right-3">
                          {getStatusBadge(redacao.status)}
                        </div>
                        <div className="absolute top-3 left-3 bg-white text-slate-700 px-3 py-1 rounded-lg font-bold text-sm shadow">
                          RASCUNHO
                        </div>
                      </div>

                      <div className="p-4">
                        <h3 className={`font-bold mb-2 line-clamp-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {redacao.tema}
                        </h3>
                        <p className={`text-sm mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          Salvo {formatDate(redacao.dataEnvio)}
                        </p>

                        <button className="w-full text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center justify-center gap-2 py-2">
                          Continuar edição
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Redações com erro */}
            {redacoesFiltradas.filter(r => r.status === 'erro').length > 0 && (
              <div className="mb-6">
                <h3 className={`text-sm font-bold mb-3 uppercase tracking-wide ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Com Erro
                </h3>
                <div className="space-y-4">
                  {redacoesFiltradas.filter(r => r.status === 'erro').map((redacao) => (
                    <div
                      key={redacao.id}
                      className={`rounded-2xl shadow-lg border overflow-hidden transition-all hover:shadow-xl ${darkMode
                          ? 'bg-slate-800 border-slate-700'
                          : 'bg-white border-slate-200'
                        }`}
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            {getStatusBadge(redacao.status)}
                            <h3 className={`text-lg font-bold mt-3 mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                              Redação: {redacao.tema}
                            </h3>
                            <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                              📤 Enviado {formatDate(redacao.dataEnvio)}
                            </p>
                          </div>
                          <div className="text-right">
                            <button
                              onClick={() => handleReenviar(redacao.id)}
                              disabled={reenviandoId === redacao.id}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                              {reenviandoId === redacao.id ? 'Reenviando...' : 'Reenviar'}
                            </button>
                            <p className={`text-xs mt-2 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                              ID: #{redacao.id.toString().padStart(6, '0')}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Redações concluídas */}
            {redacoesFiltradas.filter(r => r.status === 'concluida').length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`text-sm font-bold uppercase tracking-wide ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                    Concluídas Recentemente
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {redacoesFiltradas.filter(r => r.status === 'concluida').map((redacao) => (
                    <div
                      key={redacao.id}
                      onClick={() => navigate(`/aluno/redacao/${redacao.id}`)}
                      className={`rounded-2xl shadow-lg border overflow-hidden transition-all hover:shadow-xl cursor-pointer ${darkMode
                          ? 'bg-slate-800 border-slate-700 hover:border-slate-600'
                          : 'bg-white border-slate-200 hover:border-blue-300'
                        }`}
                    >
                      {/* Image/Icon Area */}
                      <div className="h-40 bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center relative">
                        <svg className="w-20 h-20 text-white/30" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z"/>
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd"/>
                        </svg>
                        <div className="absolute top-3 right-3">
                          {getStatusBadge(redacao.status)}
                        </div>
                        {redacao.notaTotal && (
                          <div className="absolute top-3 left-3 bg-white text-teal-700 px-3 py-1 rounded-lg font-bold text-sm shadow">
                            NOTA: {redacao.notaTotal}
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className={`font-bold mb-2 line-clamp-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {redacao.tema}
                        </h3>
                        <p className={`text-sm mb-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          Enviado {formatDate(redacao.dataEnvio)}
                        </p>

                        {/* Competências Preview */}
                        <div className="flex items-center gap-1 mb-3">
                          {[1, 2, 3, 4, 5].map((comp) => (
                            <div key={comp} className="flex-1">
                              <div className={`text-xs font-bold mb-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                                C{comp}
                              </div>
                              <div className={`text-xs font-bold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                +{comp * 2}
                              </div>
                            </div>
                          ))}
                        </div>

                        <button className="w-full text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center justify-center gap-2 py-2">
                          Ver Feedback
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {redacoesFiltradas.length === 0 && !loading && (
              <div className={`text-center py-16 rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                <div className="text-6xl mb-4">📝</div>
                <h3 className={`text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Nenhuma redação encontrada
                </h3>
                <p className={`mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Comece sua jornada escrevendo sua primeira redação!
                </p>
                <button
                  onClick={() => navigate('/aluno/redacao/nova')}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Escrever Primeira Redação
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
