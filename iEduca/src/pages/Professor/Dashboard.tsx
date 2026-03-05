import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import type { User } from '../../types';
import { NotificationDropdown, ProfileMenu } from '../../components/Dashboard';
import Calendar from '../../components/Dashboard/Calendar';
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
import { Line, Doughnut } from 'react-chartjs-2';

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

  // Dados para gráficos
  const dadosEvolucao = {
    labels: estatisticas?.ultimasAtividades.slice(-10).map((_, i) => `Atv ${i + 1}`) || [],
    datasets: [{
      label: 'Nota (%)',
      data: estatisticas?.ultimasAtividades.slice(-10).map(a => a.nota) || [],
      borderColor: 'rgb(99, 102, 241)',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      tension: 0.4,
    }],
  };

  const dadosAcertosErros = {
    labels: ['Acertos', 'Erros'],
    datasets: [{
      data: [estatisticas?.acertos || 0, estatisticas?.erros || 0],
      backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(239, 68, 68, 0.8)'],
      borderColor: ['rgb(34, 197, 94)', 'rgb(239, 68, 68)'],
      borderWidth: 2,
    }],
  };

  if (!professor) return null;

  return (
    <div className={`min-h-screen transition-colors ${
      darkMode ? 'bg-slate-900' : 'bg-slate-50'
    }`}>
      {/* Header igual ao do aluno */}
      <div className={`sticky top-0 z-40 flex justify-between items-center px-6 py-4 backdrop-blur-lg border-b transition-colors ${
        darkMode 
          ? 'bg-slate-800/80 border-slate-700 shadow-lg'
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
            user={professor} 
            darkMode={darkMode} 
            onLogout={handleLogout}
            onUpdateUser={handleUpdateUser}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-5">
        {/* Título do Dashboard */}
        <div className={`rounded-3xl p-6 mb-6 shadow-2xl transition-colors ${
          darkMode ? 'bg-slate-800' : 'bg-white'
        }`}>
          <h2 className={`text-3xl font-bold mb-2 transition-colors ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}>
            Dashboard do Professor
          </h2>
          <p className={`transition-colors ${
            darkMode ? 'text-slate-400' : 'text-slate-600'
          }`}>{professor.nome}</p>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Lista de Alunos */}
          <div className="lg:col-span-1">
            <div className={`rounded-3xl p-6 shadow-2xl transition-colors ${
              darkMode ? 'bg-slate-800' : 'bg-white'
            }`}>
              <h2 className={`text-xl font-bold mb-4 transition-colors ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}>Alunos da Escola</h2>
              
              {/* Campo de busca */}
              <div className="mb-4">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar aluno..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className={`w-full px-4 py-3 pl-10 rounded-xl border-2 transition-all focus:outline-none ${
                      darkMode
                        ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-indigo-500'
                        : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500 focus:border-indigo-500'
                    }`}
                  />
                  <svg
                    className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${
                      darkMode ? 'text-slate-400' : 'text-slate-500'
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                </div>
                {searchTerm && (
                  <p className={`text-sm mt-2 transition-colors ${
                    darkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {alunosFiltrados.length} aluno(s) encontrado(s)
                  </p>
                )}
              </div>
              
              {loading && !alunoSelecionado && (
                <p className={`text-center py-8 transition-colors ${
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>Carregando...</p>
              )}

              {error && !alunos.length && (
                <p className="text-red-400 text-center py-8">{error}</p>
              )}

              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {alunosFiltrados.map((aluno) => (
                  <button
                    type="button"
                    key={aluno.id}
                    onClick={(e) => handleSelecionarAluno(aluno, e)}
                    className={`w-full text-left p-4 rounded-xl transition-all ${
                      alunoSelecionado?.id === aluno.id
                        ? 'bg-indigo-600 text-white'
                        : darkMode
                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <p className="font-semibold">{aluno.nome}</p>
                    <p className="text-sm opacity-75">{aluno.email}</p>
                  </button>
                ))}

                {!loading && alunosFiltrados.length === 0 && (
                  <p className={`text-center py-8 transition-colors ${
                    darkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}>
                    {searchTerm ? 'Nenhum aluno encontrado' : 'Nenhum aluno cadastrado'}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Área de Dados do Aluno */}
          <div className="lg:col-span-2">
            {!alunoSelecionado ? (
              <div className={`rounded-3xl p-12 shadow-2xl text-center transition-colors ${
                darkMode ? 'bg-slate-800' : 'bg-white'
              }`}>
                <svg className={`w-24 h-24 mx-auto mb-4 transition-colors ${
                  darkMode ? 'text-slate-600' : 'text-slate-300'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className={`text-xl font-semibold mb-2 transition-colors ${
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>
                  Selecione um Aluno
                </h3>
                <p className={`transition-colors ${
                  darkMode ? 'text-slate-500' : 'text-slate-500'
                }`}>
                  Escolha um aluno da lista para visualizar seu desempenho
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Header do Aluno */}
                <div className={`rounded-2xl p-6 transition-colors ${
                  darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
                }`}>
                  <h4 className={`text-xl font-bold mb-1 transition-colors ${
                    darkMode ? 'text-white' : 'text-slate-900'
                  }`}>{alunoSelecionado.nome}</h4>
                  <p className={`text-sm transition-colors ${
                    darkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}>{alunoSelecionado.email}</p>
                </div>

                {/* Cards de Estatísticas */}
                {loading ? (
                  <p className={`text-center py-8 transition-colors ${
                    darkMode ? 'text-slate-400' : 'text-slate-600'
                  }`}>Carregando estatísticas...</p>
                ) : estatisticas && (
                  <>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className={`rounded-2xl p-5 shadow-xl transition-colors ${
                        darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
                      }`}>
                        <p className={`text-sm mb-1 transition-colors ${
                          darkMode ? 'text-slate-400' : 'text-slate-600'
                        }`}>Atividades</p>
                        <p className="text-4xl font-bold text-indigo-400">{estatisticas.totalAtividades}</p>
                      </div>
                      <div className={`rounded-2xl p-5 shadow-xl transition-colors ${
                        darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
                      }`}>
                        <p className={`text-sm mb-1 transition-colors ${
                          darkMode ? 'text-slate-400' : 'text-slate-600'
                        }`}>Média de Notas</p>
                        <p className="text-4xl font-bold text-purple-400">{estatisticas.mediaNotas.toFixed(1)}%</p>
                      </div>
                      <div className={`rounded-2xl p-5 shadow-xl transition-colors ${
                        darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
                      }`}>
                        <p className={`text-sm mb-1 transition-colors ${
                          darkMode ? 'text-slate-400' : 'text-slate-600'
                        }`}>Tempo Total</p>
                        <p className="text-4xl font-bold text-blue-400">
                          {((estatisticas.tempoTotalSegundos || 0) / 3600).toFixed(1)}h
                        </p>
                      </div>
                    </div>

                    {/* Gráficos */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className={`rounded-2xl p-5 shadow-2xl transition-colors ${
                        darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
                      }`}>
                        <h5 className={`text-base font-bold mb-3 transition-colors ${
                          darkMode ? 'text-white' : 'text-slate-900'
                        }`}>Evolução das Notas</h5>
                        <Line
                          data={dadosEvolucao}
                          options={{
                            responsive: true,
                            plugins: { legend: { display: false } },
                            scales: {
                              y: {
                                beginAtZero: true,
                                max: 100,
                                ticks: { color: darkMode ? '#94a3b8' : '#64748b' },
                                grid: { color: darkMode ? '#475569' : '#e2e8f0' },
                              },
                              x: {
                                ticks: { color: darkMode ? '#94a3b8' : '#64748b' },
                                grid: { color: darkMode ? '#475569' : '#e2e8f0' },
                              },
                            },
                          }}
                        />
                      </div>

                      <div className={`rounded-2xl p-5 shadow-2xl transition-colors ${
                        darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
                      }`}>
                        <h5 className={`text-base font-bold mb-3 transition-colors ${
                          darkMode ? 'text-white' : 'text-slate-900'
                        }`}>Acertos vs Erros</h5>
                        <Doughnut
                          data={dadosAcertosErros}
                          options={{
                            responsive: true,
                            plugins: {
                              legend: {
                                position: 'bottom',
                                labels: { color: darkMode ? '#94a3b8' : '#64748b' },
                              },
                            },
                          }}
                        />
                      </div>
                    </div>

                    {/* Calendário de Frequência */}
                    <div className={`rounded-2xl p-5 shadow-2xl transition-colors ${
                      darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
                    }`}>
                      <h5 className={`text-base font-bold mb-3 transition-colors ${
                        darkMode ? 'text-white' : 'text-slate-900'
                      }`}>Calendário de Frequência</h5>
                      <Calendar darkMode={darkMode} userId={alunoSelecionado.id} />
                    </div>

                    {/* Tabela de Últimas Atividades */}
                    {estatisticas.ultimasAtividades && estatisticas.ultimasAtividades.length > 0 && (
                      <div className={`rounded-2xl p-5 transition-colors ${
                        darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
                      }`}>
                        <h5 className={`text-base font-bold mb-3 transition-colors ${
                          darkMode ? 'text-white' : 'text-slate-900'
                        }`}>Últimas Atividades</h5>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className={`border-b transition-colors ${
                                darkMode ? 'border-slate-600' : 'border-slate-300'
                              }`}>
                                <th className={`px-4 py-2 text-left text-sm transition-colors ${
                                  darkMode ? 'text-slate-400' : 'text-slate-600'
                                }`}>Data</th>
                                <th className={`px-4 py-2 text-left text-sm transition-colors ${
                                  darkMode ? 'text-slate-400' : 'text-slate-600'
                                }`}>Nota</th>
                                <th className={`px-4 py-2 text-left text-sm transition-colors ${
                                  darkMode ? 'text-slate-400' : 'text-slate-600'
                                }`}>Acertos</th>
                                <th className={`px-4 py-2 text-left text-sm transition-colors ${
                                  darkMode ? 'text-slate-400' : 'text-slate-600'
                                }`}>Erros</th>
                              </tr>
                            </thead>
                            <tbody>
                              {estatisticas.ultimasAtividades.slice(-5).reverse().map((ativ, idx) => (
                                <tr key={idx} className={`border-b transition-colors ${
                                  darkMode ? 'border-slate-600' : 'border-slate-300'
                                }`}>
                                  <td className={`px-4 py-3 text-sm transition-colors ${
                                    darkMode ? 'text-slate-300' : 'text-slate-700'
                                  }`}>
                                    {new Date(ativ.data).toLocaleDateString('pt-BR')}
                                  </td>
                                  <td className={`px-4 py-3 text-sm font-semibold ${
                                    ativ.nota >= 70 ? 'text-green-500' : 'text-red-500'
                                  }`}>
                                    {ativ.nota.toFixed(0)}%
                                  </td>
                                  <td className={`px-4 py-3 text-sm ${
                                    darkMode ? 'text-green-400' : 'text-green-600'
                                  }`}>{ativ.acertos}</td>
                                  <td className={`px-4 py-3 text-sm ${
                                    darkMode ? 'text-red-400' : 'text-red-600'
                                  }`}>{ativ.erros}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
