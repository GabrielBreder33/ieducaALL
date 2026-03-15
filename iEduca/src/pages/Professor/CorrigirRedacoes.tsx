import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { professorService } from '../../services/professorService';
import type { RedacaoAlunoList } from '../../services/professorService';
import type { User } from '../../types';
import { NotificationDropdown, ProfileMenu } from '../../components/Dashboard';

type FiltroStatus = 'todas' | 'pendentes' | 'revisadas';
type Ordenacao = 'data_desc' | 'data_asc' | 'nota_desc' | 'nota_asc' | 'aluno_az';

export default function CorrigirRedacoes() {
  const navigate = useNavigate();
  const [professor, setProfessor] = useState<User | null>(null);
  const [darkMode] = useState(false);
  const [redacoes, setRedacoes] = useState<RedacaoAlunoList[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroStatus, setFiltroStatus] = useState<FiltroStatus>('todas');
  const [busca, setBusca] = useState('');
  const [ordenacao, setOrdenacao] = useState<Ordenacao>('data_desc');
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'Professor') {
      navigate('/login');
      return;
    }
    setProfessor(user);
    carregarRedacoes(user.idEscola || 0);
  }, [navigate]);

  const carregarRedacoes = async (escolaId: number) => {
    setLoading(true);
    try {
      const data = await professorService.listarRedacoesAlunos(escolaId);
      setRedacoes(data);
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Erro ao carregar redações' });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const handleUpdateUser = (updatedUser: Partial<User>) => {
    if (updatedUser.nome && updatedUser.email && updatedUser.role) {
      const fullUser = { ...professor!, ...updatedUser } as User;
      setProfessor(fullUser);
      localStorage.setItem('user', JSON.stringify(fullUser));
    }
  };

  const pendentes = redacoes.filter(r => !r.revisadaPorProfessor && r.status !== 'processando');
  const revisadas = redacoes.filter(r => r.revisadaPorProfessor);

  const redacoesFiltradas = useMemo(() => {
    let lista = redacoes.filter(r => {
      if (filtroStatus === 'pendentes') return !r.revisadaPorProfessor && r.status !== 'processando';
      if (filtroStatus === 'revisadas') return r.revisadaPorProfessor;
      return true;
    });

    if (busca.trim()) {
      const q = busca.trim().toLowerCase();
      lista = lista.filter(r =>
        r.alunoNome?.toLowerCase().includes(q) ||
        r.tema?.toLowerCase().includes(q)
      );
    }

    lista = [...lista].sort((a, b) => {
      switch (ordenacao) {
        case 'data_desc': return new Date(b.dataEnvio || 0).getTime() - new Date(a.dataEnvio || 0).getTime();
        case 'data_asc':  return new Date(a.dataEnvio || 0).getTime() - new Date(b.dataEnvio || 0).getTime();
        case 'nota_desc': return (b.notaTotal ?? 0) - (a.notaTotal ?? 0);
        case 'nota_asc':  return (a.notaTotal ?? 0) - (b.notaTotal ?? 0);
        case 'aluno_az':  return (a.alunoNome || '').localeCompare(b.alunoNome || '', 'pt-BR');
        default: return 0;
      }
    });

    return lista;
  }, [redacoes, filtroStatus, busca, ordenacao]);

  const getStatusInfo = (r: RedacaoAlunoList) => {
    if (r.status === 'processando')
      return { label: 'Processando', classes: 'bg-blue-100 text-blue-700 border border-blue-200' };
    if (r.revisadaPorProfessor)
      return { label: 'Revisada', classes: 'bg-emerald-100 text-emerald-700 border border-emerald-200' };
    if (r.status?.toLowerCase().includes('conclu'))
      return { label: 'Pendente', classes: 'bg-amber-100 text-amber-700 border border-amber-200' };
    return { label: r.status || 'N/A', classes: 'bg-slate-100 text-slate-600 border border-slate-200' };
  };

  const getInitials = (nome: string) =>
    nome.split(' ').slice(0, 2).map(p => p[0]).join('').toUpperCase();

  if (!professor) return null;

  return (
    <div className={`min-h-screen overflow-x-hidden w-full transition-colors ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-40 flex justify-between items-center px-4 sm:px-6 py-3 sm:py-4 backdrop-blur-lg border-b transition-colors ${
        darkMode ? 'bg-slate-800/90 border-slate-700 shadow-lg' : 'bg-white/95 border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/professor/dashboard')}
            className={`flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
              darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Dashboard
          </button>
          <span className="text-slate-300">|</span>
          <h1 className={`text-lg sm:text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Redações
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <NotificationDropdown darkMode={darkMode} />
          <ProfileMenu user={professor} darkMode={darkMode} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 sm:p-6">
        {mensagem && (
          <div className={`mb-5 p-4 rounded-xl font-medium text-sm flex items-center gap-2 ${
            mensagem.tipo === 'sucesso' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {mensagem.texto}
          </div>
        )}

        {/* Stat cards */}
        {!loading && (
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
            <div className={`rounded-2xl p-4 sm:p-5 ${
              darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
            }`}>
              <p className={`text-xs sm:text-sm font-medium mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>Total</p>
              <p className={`text-2xl sm:text-3xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>{redacoes.length}</p>
            </div>
            <div className={`rounded-2xl p-4 sm:p-5 ${darkMode ? 'bg-amber-900/30' : 'bg-amber-50 border border-amber-100'}`}>
              <p className={`text-xs sm:text-sm font-medium mb-1 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>Pendentes</p>
              <p className={`text-2xl sm:text-3xl font-black ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>{pendentes.length}</p>
            </div>
            <div className={`rounded-2xl p-4 sm:p-5 ${darkMode ? 'bg-emerald-900/30' : 'bg-emerald-50 border border-emerald-100'}`}>
              <p className={`text-xs sm:text-sm font-medium mb-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Revisadas</p>
              <p className={`text-2xl sm:text-3xl font-black ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>{revisadas.length}</p>
            </div>
          </div>
        )}

        {/* Barra de filtros */}
        <div className={`rounded-2xl p-3 sm:p-4 mb-5 space-y-3 ${
          darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
        }`}>
          {/* Linha 1: busca + ordenação */}
          <div className="flex gap-2 sm:gap-3">
            <div className="relative flex-1">
              <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${
                darkMode ? 'text-slate-500' : 'text-slate-400'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={busca}
                onChange={e => setBusca(e.target.value)}
                placeholder="Buscar por aluno ou tema..."
                className={`w-full pl-9 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                  darkMode
                    ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500 focus:border-indigo-500'
                    : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-400 focus:bg-white'
                }`}
              />
              {busca && (
                <button
                  onClick={() => setBusca('')}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-slate-500 hover:text-slate-300' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            <select
              value={ordenacao}
              onChange={e => setOrdenacao(e.target.value as Ordenacao)}
              className={`px-3 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all ${
                darkMode
                  ? 'bg-slate-700 border-slate-600 text-white focus:border-indigo-500'
                  : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-400'
              }`}
            >
              <option value="data_desc">Mais recentes</option>
              <option value="data_asc">Mais antigas</option>
              <option value="nota_desc">Maior nota</option>
              <option value="nota_asc">Menor nota</option>
              <option value="aluno_az">Aluno (A-Z)</option>
            </select>
          </div>

          {/* Linha 2: tabs de status */}
          <div className={`flex gap-1 p-1 rounded-xl ${darkMode ? 'bg-slate-700/50' : 'bg-slate-100'}`}>
            {([
              { key: 'todas',     label: 'Todas',     count: redacoes.length },
              { key: 'pendentes', label: 'Pendentes', count: pendentes.length },
              { key: 'revisadas', label: 'Revisadas', count: revisadas.length },
            ] as const).map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFiltroStatus(key)}
                className={`flex-1 px-3 py-2 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                  filtroStatus === key
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {label}
                <span className={`text-xs rounded-full px-1.5 py-0.5 font-bold ${
                  filtroStatus === key
                    ? 'bg-white/20 text-white'
                    : darkMode ? 'bg-slate-600 text-slate-300' : 'bg-white text-slate-600'
                }`}>{count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Resultado da busca */}
        {busca && !loading && (
          <p className={`text-sm mb-3 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
            {redacoesFiltradas.length} resultado{redacoesFiltradas.length !== 1 ? 's' : ''} para "<strong>{busca}</strong>"
          </p>
        )}

        {/* Lista */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-24 rounded-2xl animate-pulse ${darkMode ? 'bg-slate-800' : 'bg-white'}`} />
            ))}
          </div>
        ) : redacoesFiltradas.length === 0 ? (
          <div className={`text-center py-16 rounded-2xl ${
            darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
          }`}>
            <svg className={`w-12 h-12 mx-auto mb-3 ${darkMode ? 'text-slate-600' : 'text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className={`font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              {busca ? 'Nenhuma redação encontrada para essa busca' : 'Nenhuma redação encontrada'}
            </p>
            {busca && (
              <button onClick={() => setBusca('')} className="mt-2 text-sm text-indigo-500 hover:underline">
                Limpar busca
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {redacoesFiltradas.map(r => {
              const status = getStatusInfo(r);
              return (
                <button
                  key={r.id}
                  onClick={() => navigate(`/professor/redacoes/${r.id}`)}
                  className={`w-full rounded-2xl overflow-hidden transition-all text-left group ${
                    darkMode
                      ? 'bg-slate-800 border border-slate-700 hover:border-indigo-500/50'
                      : 'bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100/50'
                  }`}
                >
                  {/* Status bar */}
                  <div className={`h-1 w-full ${
                    r.revisadaPorProfessor ? 'bg-emerald-400' :
                    r.status === 'processando' ? 'bg-blue-400' :
                    r.status?.toLowerCase().includes('conclu') ? 'bg-amber-400' : 'bg-slate-300'
                  }`} />
                  <div className="p-4 sm:p-5 flex items-center gap-4">
                    {/* Avatar */}
                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex-shrink-0 flex items-center justify-center font-bold text-sm ${
                      darkMode ? 'bg-indigo-900/50 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {getInitials(r.alunoNome || '?')}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className={`font-bold truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>{r.tema}</h3>
                        <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${status.classes}`}>
                          {status.label}
                        </span>
                      </div>
                      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {r.alunoNome}
                        {r.dataEnvio && (
                          <span className="ml-2 opacity-70">· {new Date(r.dataEnvio).toLocaleDateString('pt-BR')}</span>
                        )}
                      </p>
                    </div>

                    {/* Notas */}
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-center">
                        <p className={`text-xs font-medium ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>IA</p>
                        <p className={`text-lg font-black ${darkMode ? 'text-slate-200' : 'text-slate-800'}`}>{r.notaTotal ?? '-'}</p>
                      </div>
                      {r.notaProfessor != null && (
                        <div className={`text-center px-3 py-1 rounded-xl ${darkMode ? 'bg-indigo-900/40' : 'bg-indigo-50'}`}>
                          <p className={`text-xs font-medium ${darkMode ? 'text-indigo-400' : 'text-indigo-500'}`}>Prof.</p>
                          <p className="text-lg font-black text-indigo-600">{r.notaProfessor}</p>
                        </div>
                      )}
                      <svg className={`w-5 h-5 transition-transform group-hover:translate-x-0.5 ${
                        darkMode ? 'text-slate-600' : 'text-slate-300'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
