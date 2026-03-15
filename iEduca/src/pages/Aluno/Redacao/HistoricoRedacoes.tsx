import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../../services/authService';
import type { User } from '../../../types';
import { NotificationDropdown, ProfileMenu } from '../../../components/Dashboard';
import { AlunoSidebar } from '../../../components/AlunoSidebar';
import type { RedacaoSubmissao } from './types';
import { RedacaoCardProcessando } from './components/RedacaoCardProcessando';
import { RedacaoCardConcluida } from './components/RedacaoCardConcluida';
import { RedacaoCardRascunho } from './components/RedacaoCardRascunho';
import { RedacaoCardErro } from './components/RedacaoCardErro';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function HistoricoRedacoes() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
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
    if (!currentUser) { navigate('/login'); return; }
    setUser(currentUser);
    if (currentUser.id) loadRedacoes(currentUser.id);
  }, [navigate]);

  const loadRedacoes = async (userId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/RedacaoCorrecao/usuario/${userId}`);
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

    (async () => {
      try {
        await fetch(`${API_URL}/RedacaoCorrecao/progresso-stream/${redacaoId}`, {
          signal: controller.signal,
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        });
      } finally {
        activeStreamsRef.current.delete(redacaoId);
      }
    })();
  };

  useEffect(() => {
    redacoes.filter(r => r.status === 'processando').forEach(r => iniciarStreamProgresso(r.id));
  }, [redacoes]);

  useEffect(() => {
    return () => {
      activeStreamsRef.current.forEach(c => c.abort());
      activeStreamsRef.current.clear();
    };
  }, []);

  const handleLogout = () => { authService.logout(); navigate('/login'); };

  const handleUpdateUser = (updatedData: Partial<User>) => {
    const updatedUser = { ...user, ...updatedData } as User;
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const handleReenviar = async (redacaoId: number) => {
    if (!user?.id) return;
    try {
      setReenviandoId(redacaoId);
      const response = await fetch(`${API_URL}/RedacaoCorrecao/${redacaoId}/reenviar`, { method: 'POST' });
      if (!response.ok) throw new Error('Falha ao reenviar redação');
      const reenviada = await response.json();
      setRedacoes(prev =>
        prev.map(r =>
          r.id === redacaoId
            ? { ...r, tema: reenviada.tema || r.tema, status: 'processando' as const, progresso: reenviada.progresso ?? 0, notaTotal: undefined, dataEnvio: new Date().toISOString() }
            : r,
        ),
      );
    } catch (error) {
      console.error('Erro ao reenviar redação:', error);
      alert('Não foi possível reenviar a redação. Tente novamente.');
    } finally {
      setReenviandoId(null);
    }
  };

  const redacoesFiltradas = redacoes
    .filter(r => {
      if (filtroAtivo === 'all') return r.status !== 'rascunho';
      if (filtroAtivo === 'processing') return r.status === 'processando';
      if (filtroAtivo === 'completed') return r.status === 'concluida';
      if (filtroAtivo === 'drafts') return (r.tipoAvaliacao || '').toLowerCase() === 'rascunho' || r.status === 'rascunho';
      return false;
    })
    .filter(r => !filtroTema.trim() || r.tema.toLowerCase().includes(filtroTema.trim().toLowerCase()))
    .filter(r => {
      if (filtroNota === 'all') return true;
      if (typeof r.notaTotal !== 'number') return false;
      if (filtroNota === '0-399') return r.notaTotal >= 0 && r.notaTotal <= 399;
      if (filtroNota === '400-699') return r.notaTotal >= 400 && r.notaTotal <= 699;
      return r.notaTotal >= 700 && r.notaTotal <= 1000;
    })
    .filter(r => {
      if (!dataInicial && !dataFinal) return true;
      const d = new Date(r.dataEnvio);
      if (dataInicial && d < new Date(`${dataInicial}T00:00:00`)) return false;
      if (dataFinal && d > new Date(`${dataFinal}T23:59:59`)) return false;
      return true;
    });

  const processandoCount = redacoes.filter(r => r.status === 'processando').length;

  const byStatus = (s: RedacaoSubmissao['status']) => redacoesFiltradas.filter(r => r.status === s);

  if (!user) return null;
  const filterBtnCls = (active: boolean) =>
    `px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-sm whitespace-nowrap ${
      active
        ? 'bg-slate-900 text-white'
        : darkMode
        ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
        : 'bg-white text-slate-700 hover:bg-slate-100'
    }`;

  const inputCls = `flex-1 sm:flex-none px-3 py-2 rounded-lg text-xs sm:text-sm border ${
    darkMode ? 'bg-slate-800 text-slate-100 border-slate-700 placeholder-slate-400' : 'bg-white text-slate-700 border-slate-300 placeholder-slate-400'
  }`;

  return (
    <div className={`min-h-screen overflow-x-hidden transition-colors duration-300 ${darkMode ? 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900' : 'bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200'}`}>
      <AlunoSidebar darkMode={darkMode} onToggleTheme={() => setDarkMode(!darkMode)} />

      <div className="md:ml-52 min-h-screen flex flex-col overflow-x-hidden">
        <div className={`backdrop-blur-sm pl-14 pr-3 md:pl-6 md:pr-6 py-4 border-b flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 sticky top-0 z-30 transition-colors duration-300 ${darkMode ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white/90 border-slate-200 shadow-sm'}`}>
          <div className="flex-1">
            <h1 className={`text-lg sm:text-xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Minhas Redações</h1>
            <p className={`text-xs sm:text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Acompanhe suas correções, feedback e progresso ao longo do tempo.</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 self-end sm:self-auto flex-shrink-0">
            <button onClick={() => navigate('/aluno/redacao/nova')} className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-xs sm:text-sm whitespace-nowrap">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              <span className="hidden sm:inline">Nova Redação</span>
              <span className="sm:hidden">Nova</span>
            </button>
            <NotificationDropdown darkMode={darkMode} />
            <ProfileMenu user={user} darkMode={darkMode} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />
          </div>
        </div>

        <div className="flex-1 p-3 sm:p-4 md:p-6 overflow-x-hidden">
          <div className="max-w-7xl mx-auto w-full">
            <div className="flex flex-col gap-3 mb-4 sm:mb-6">
              <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide w-full">
                <button onClick={() => setFiltroAtivo('all')} className={filterBtnCls(filtroAtivo === 'all')}>Todas</button>
                <button onClick={() => setFiltroAtivo('processing')} className={`${filterBtnCls(filtroAtivo === 'processing')} flex items-center gap-2`}>
                  Em Análise
                  {processandoCount > 0 && <span className="bg-blue-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{processandoCount}</span>}
                </button>
                <button onClick={() => setFiltroAtivo('completed')} className={filterBtnCls(filtroAtivo === 'completed')}>Concluídas</button>
                <button onClick={() => setFiltroAtivo('drafts')} className={filterBtnCls(filtroAtivo === 'drafts')}>Rascunhos</button>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input type="text" value={filtroTema} onChange={e => setFiltroTema(e.target.value)} placeholder="Filtrar por tema" className={inputCls} />
                <select value={filtroNota} onChange={e => setFiltroNota(e.target.value as typeof filtroNota)} className={inputCls}>
                  <option value="all">Todas as notas</option>
                  <option value="0-399">0-399</option>
                  <option value="400-699">400-699</option>
                  <option value="700-1000">700-1000</option>
                </select>
                <input type="date" value={dataInicial} onChange={e => setDataInicial(e.target.value)} className={inputCls} />
                <input type="date" value={dataFinal} onChange={e => setDataFinal(e.target.value)} className={inputCls} />
              </div>
            </div>
            {byStatus('processando').length > 0 && (
              <div className="mb-4 sm:mb-6">
                <h3 className={`text-xs sm:text-sm font-bold mb-3 uppercase tracking-wide ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Processando Agora</h3>
                <div className="space-y-3 sm:space-y-4">
                  {byStatus('processando').map(r => <RedacaoCardProcessando key={r.id} redacao={r} darkMode={darkMode} />)}
                </div>
              </div>
            )}
            {byStatus('rascunho').length > 0 && (
              <div className="mb-4 sm:mb-6">
                <h3 className={`text-xs sm:text-sm font-bold mb-3 uppercase tracking-wide ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Rascunhos</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {byStatus('rascunho').map(r => <RedacaoCardRascunho key={r.id} redacao={r} darkMode={darkMode} />)}
                </div>
              </div>
            )}
            {byStatus('erro').length > 0 && (
              <div className="mb-4 sm:mb-6">
                <h3 className={`text-xs sm:text-sm font-bold mb-3 uppercase tracking-wide ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Com Erro</h3>
                <div className="space-y-3 sm:space-y-4">
                  {byStatus('erro').map(r => <RedacaoCardErro key={r.id} redacao={r} darkMode={darkMode} reenviandoId={reenviandoId} onReenviar={handleReenviar} />)}
                </div>
              </div>
            )}

            {byStatus('concluida').length > 0 && (
              <div>
                <h3 className={`text-xs sm:text-sm font-bold mb-3 uppercase tracking-wide ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Concluídas Recentemente</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                  {byStatus('concluida').map(r => <RedacaoCardConcluida key={r.id} redacao={r} darkMode={darkMode} />)}
                </div>
              </div>
            )}
            {redacoesFiltradas.length === 0 && !loading && (
              <div className={`text-center py-12 sm:py-16 px-4 rounded-xl sm:rounded-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
                <div className="text-5xl sm:text-6xl mb-4">📝</div>
                <h3 className={`text-lg sm:text-xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>Nenhuma redação encontrada</h3>
                <p className={`text-sm sm:text-base mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Comece sua jornada escrevendo sua primeira redação!</p>
                <button onClick={() => navigate('/aluno/redacao/nova')} className="px-5 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm sm:text-base">Escrever Primeira Redação</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
