import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import type { User } from '../../types';
import { NotificationDropdown, ProfileMenu } from '../../components/Dashboard';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import EstatisticasAluno from './components/EstatisticasAluno';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Aluno extends User {
  id: number;
}

interface Estatisticas {
  totalAtividades: number;
  acertos: number;
  erros: number;
  mediaNotas: number;
  tempoTotalSegundos: number;
  ultimasAtividades: Array<{
    data: string;
    nota: number;
    acertos: number;
    erros: number;
  }>;
}

export default function ProfessorDashboard() {
  const [professor, setProfessor] = useState<User | null>(null);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [alunosFiltrados, setAlunosFiltrados] = useState<Aluno[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [alunoSelecionado, setAlunoSelecionado] = useState<Aluno | null>(null);
  const [estatisticas, setEstatisticas] = useState<Estatisticas | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'Professor') {
      navigate('/login');
      return;
    }
    setProfessor(user);
    carregarAlunos(user.idEscola || 0);
  }, [navigate]);

  useEffect(() => {
    // Filtrar alunos quando o termo de busca mudar
    if (searchTerm.trim() === '') {
      setAlunosFiltrados(alunos);
    } else {
      const filtered = alunos.filter(aluno =>
        aluno.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        aluno.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setAlunosFiltrados(filtered);
    }
  }, [searchTerm, alunos]);

  const carregarAlunos = async (escolaId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/User/escola/${escolaId}/alunos`);
      if (!response.ok) throw new Error('Erro ao carregar alunos');
      const data = await response.json();
      setAlunos(data);
      setAlunosFiltrados(data);
    } catch (err) {
      setError('Erro ao carregar alunos');
    } finally {
      setLoading(false);
    }
  };

  const carregarEstatisticas = async (alunoId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/AtividadeExecucoes/usuario/${alunoId}/estatisticas`);
      if (!response.ok) throw new Error('Erro ao carregar estatísticas');
      const data = await response.json();
      setEstatisticas(data);
    } catch (err) {
      setError('Erro ao carregar estatísticas do aluno');
    } finally {
      setLoading(false);
    }
  };

  const handleSelecionarAluno = async (aluno: Aluno, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setAlunoSelecionado(aluno);
    await carregarEstatisticas(aluno.id);
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

  if (!professor) return null;

  return (
    <div className={`min-h-screen overflow-x-hidden w-full max-w-full transition-colors ${
      darkMode ? 'bg-slate-900' : 'bg-slate-50'
    }`}>
      {/* Header igual ao do aluno */}
      <div className={`sticky top-0 z-40 flex justify-between items-center px-3 sm:px-6 py-3 sm:py-4 backdrop-blur-lg border-b transition-colors ${
        darkMode 
          ? 'bg-slate-800/80 border-slate-700 shadow-lg'
          : 'bg-white/90 border-slate-300 shadow-sm'
      }`}>
        {/* Logo */}
        <div className="flex items-center">
          <h1 className={`text-xl sm:text-2xl font-bold tracking-wide transition-colors ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}>IEDUCA</h1>
        </div>

        {/* Right Side - Notificações e Profile */}
        <div className="flex items-center gap-2 sm:gap-4">
          <NotificationDropdown darkMode={darkMode} />
          <ProfileMenu 
            user={professor} 
            darkMode={darkMode} 
            onLogout={handleLogout}
            onUpdateUser={handleUpdateUser}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-3 sm:p-5 w-full">
        {/* Welcome + Nav */}
        <div className="mb-5 sm:mb-6">
          <div className={`rounded-2xl sm:rounded-3xl p-5 sm:p-6 mb-4 transition-colors ${
            darkMode
              ? 'bg-gradient-to-r from-indigo-900/60 to-slate-800 border border-indigo-700/40'
              : 'bg-gradient-to-r from-indigo-600 to-indigo-500'
          }`}>
            <p className={`text-sm font-medium mb-1 ${
              darkMode ? 'text-indigo-300' : 'text-indigo-200'
            }`}>Bem-vindo de volta,</p>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              {professor.nome.split(' ')[0]}
            </h2>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/professor/atividades')}
              className={`flex items-center gap-4 p-4 sm:p-5 rounded-2xl text-left transition-all group ${
                darkMode
                  ? 'bg-slate-800 border border-slate-700 hover:border-indigo-500/50'
                  : 'bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-100/50'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                darkMode ? 'bg-indigo-900/50' : 'bg-indigo-100'
              }`}>
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className={`font-bold text-sm ${
                  darkMode ? 'text-white' : 'text-slate-900'
                }`}>Atividades</p>
                <p className={`text-xs mt-0.5 ${
                  darkMode ? 'text-slate-500' : 'text-slate-400'
                }`}>Gerenciar e criar</p>
              </div>
              <svg className={`w-4 h-4 ml-auto flex-shrink-0 transition-transform group-hover:translate-x-0.5 ${
                darkMode ? 'text-slate-600' : 'text-slate-300'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>

            <button
              onClick={() => navigate('/professor/redacoes')}
              className={`flex items-center gap-4 p-4 sm:p-5 rounded-2xl text-left transition-all group ${
                darkMode
                  ? 'bg-slate-800 border border-slate-700 hover:border-purple-500/50'
                  : 'bg-white border border-slate-200 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-100/50'
              }`}
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
                darkMode ? 'bg-purple-900/50' : 'bg-purple-100'
              }`}>
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div className="min-w-0">
                <p className={`font-bold text-sm ${
                  darkMode ? 'text-white' : 'text-slate-900'
                }`}>Redações</p>
                <p className={`text-xs mt-0.5 ${
                  darkMode ? 'text-slate-500' : 'text-slate-400'
                }`}>Corrigir e revisar</p>
              </div>
              <svg className={`w-4 h-4 ml-auto flex-shrink-0 transition-transform group-hover:translate-x-0.5 ${
                darkMode ? 'text-slate-600' : 'text-slate-300'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Lista de Alunos */}
          <div className="lg:col-span-1">
            <div className={`rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm transition-colors ${
              darkMode ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-200'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-base font-bold ${
                  darkMode ? 'text-white' : 'text-slate-900'
                }`}>Alunos</h2>
                {alunos.length > 0 && (
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                  }`}>{alunos.length}</span>
                )}
              </div>

              {/* Campo de busca */}
              <div className="mb-3">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar aluno..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full px-4 py-2.5 pl-9 rounded-xl text-sm border transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                      darkMode
                        ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-500 focus:border-indigo-500'
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-400 focus:bg-white'
                    }`}
                  />
                  <svg
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${
                      darkMode ? 'text-slate-500' : 'text-slate-400'
                    }`}
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>

              {loading && !alunoSelecionado && (
                <div className="space-y-2 mt-2">
                  {[1,2,3].map(i => (
                    <div key={i} className={`h-14 rounded-xl animate-pulse ${
                      darkMode ? 'bg-slate-700' : 'bg-slate-100'
                    }`} />
                  ))}
                </div>
              )}

              {error && !alunos.length && (
                <p className="text-red-400 text-center py-8 text-sm">{error}</p>
              )}

              <div className="space-y-1.5 max-h-[520px] overflow-y-auto">
                {alunosFiltrados.map((aluno) => {
                  const initials = aluno.nome.split(' ').slice(0, 2).map((p: string) => p[0]).join('').toUpperCase();
                  const isSelected = alunoSelecionado?.id === aluno.id;
                  return (
                    <button
                      type="button"
                      key={aluno.id}
                      onClick={(e) => handleSelecionarAluno(aluno, e)}
                      className={`w-full text-left px-3 py-3 rounded-xl transition-all flex items-center gap-3 ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : darkMode
                          ? 'hover:bg-slate-700 text-slate-300'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-lg flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                        isSelected
                          ? 'bg-white/20 text-white'
                          : darkMode ? 'bg-slate-700 text-indigo-400' : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm truncate">{aluno.nome}</p>
                        <p className={`text-xs truncate ${
                          isSelected ? 'text-indigo-200' : darkMode ? 'text-slate-500' : 'text-slate-400'
                        }`}>{aluno.email}</p>
                      </div>
                    </button>
                  );
                })}

                {!loading && alunosFiltrados.length === 0 && (
                  <p className={`text-center py-8 text-sm ${
                    darkMode ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    {searchTerm ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Área de Dados do Aluno */}
          <div className="lg:col-span-2">
            <EstatisticasAluno
              darkMode={darkMode}
              aluno={alunoSelecionado}
              estatisticas={estatisticas}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
