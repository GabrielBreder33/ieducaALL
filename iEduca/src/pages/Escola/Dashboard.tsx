import { useState, useEffect, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { escolaService } from '../../services/escolaService';
import { authService } from '../../services/authService';
import type { Escola } from '../../services/escolaService';
import type { User } from '../../types';
import { NotificationDropdown } from '../../components/Dashboard';
import Calendar from '../../components/Dashboard/Calendar';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const API_URL = 'http://localhost:5000/api';

interface Usuario extends User {
  id: number;
}

interface EstatisticasEscola {
  totalHorasEstudadas: number;
  totalAtividades: number;
  mediaAcertos: number;
  totalQuestoesRespondidas: number;
  totalAlunos: number;
  atividadesPorMes: number[];
  horasPorMes: number[];
}

interface EstatisticasAluno {
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

type TabType = 'usuarios' | 'cadastrar' | 'estatisticas' | 'alunos';

export default function EscolaDashboard() {
  const [escola, setEscola] = useState<Escola | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [usuariosFiltrados, setUsuariosFiltrados] = useState<Usuario[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('usuarios');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [estatisticas, setEstatisticas] = useState<EstatisticasEscola | null>(null);
  
  // Aluno selecionado
  const [alunoSelecionado, setAlunoSelecionado] = useState<Usuario | null>(null);
  const [estatisticasAluno, setEstatisticasAluno] = useState<EstatisticasAluno | null>(null);
  const [searchAluno, setSearchAluno] = useState('');
  const [alunosFiltrados, setAlunosFiltrados] = useState<Usuario[]>([]);
  
  // Form states
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [telefone, setTelefone] = useState('');
  const [role, setRole] = useState('Aluno');
  
  // Edit user modal
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  
  const navigate = useNavigate();

  useEffect(() => {
    const escolaLogada = escolaService.getCurrentEscola();
    if (!escolaLogada) {
      navigate('/login');
      return;
    }
    setEscola(escolaLogada);
    carregarUsuarios(escolaLogada.id);
    carregarEstatisticas(escolaLogada.id);
  }, [navigate]);

  useEffect(() => {
    if (searchTerm.trim() === '') {
      setUsuariosFiltrados(usuarios);
    } else {
      const filtered = usuarios.filter(user =>
        user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setUsuariosFiltrados(filtered);
    }
  }, [searchTerm, usuarios]);

  useEffect(() => {
    // Filtrar apenas alunos para a aba de desempenho
    const alunos = usuarios.filter(u => u.role === 'Aluno');
    if (searchAluno.trim() === '') {
      setAlunosFiltrados(alunos);
    } else {
      const filtered = alunos.filter(aluno =>
        aluno.nome.toLowerCase().includes(searchAluno.toLowerCase()) ||
        aluno.email.toLowerCase().includes(searchAluno.toLowerCase())
      );
      setAlunosFiltrados(filtered);
    }
  }, [searchAluno, usuarios]);

  const carregarUsuarios = async (escolaId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/User/escola/${escolaId}/usuarios`);
      if (!response.ok) throw new Error('Erro ao carregar usuários');
      const data = await response.json();
      setUsuarios(data);
      setUsuariosFiltrados(data);
    } catch (err) {
      setError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const carregarEstatisticas = async (escolaId: number) => {
    try {
      const response = await fetch(`${API_URL}/AtividadeExecucoes/escola/${escolaId}/estatisticas`);
      if (!response.ok) throw new Error('Erro ao carregar estatísticas');
      const data = await response.json();
      setEstatisticas(data);
    } catch (err) {
      console.error('Erro ao carregar estatísticas:', err);
    }
  };

  const carregarEstatisticasAluno = async (userId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/AtividadeExecucoes/usuario/${userId}/estatisticas`);
      if (!response.ok) throw new Error('Erro ao carregar estatísticas do aluno');
      const data = await response.json();
      setEstatisticasAluno(data);
    } catch (err) {
      setError('Erro ao carregar estatísticas do aluno');
    } finally {
      setLoading(false);
    }
  };

  const handleSelecionarAluno = async (aluno: Usuario, event?: React.MouseEvent) => {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    setAlunoSelecionado(aluno);
    await carregarEstatisticasAluno(aluno.id);
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length <= 11) {
      if (value.length <= 10) {
        value = value.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, '($1) $2-$3');
      } else {
        value = value.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, '($1) $2-$3');
      }
      setTelefone(value);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    if (!escola) return;

    setLoading(true);
    try {
      await authService.register(nome, email, password, telefone, role, true, escola.id);
      setSuccess(`${role} cadastrado com sucesso!`);
      
      // Limpar form
      setNome('');
      setEmail('');
      setPassword('');
      setTelefone('');
      setRole('Aluno');
      
      // Recarregar lista
      await carregarUsuarios(escola.id);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!editingUser || newPassword.length < 6) {
      setError('Senha deve ter no mínimo 6 caracteres');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/User/${editingUser.id}/reset-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novaSenha: newPassword }),
      });

      if (!response.ok) throw new Error('Erro ao resetar senha');

      setSuccess('Senha resetada com sucesso!');
      setShowResetPassword(false);
      setEditingUser(null);
      setNewPassword('');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erro ao resetar senha');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return;

    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/User/${userId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Erro ao excluir usuário');

      setSuccess('Usuário excluído com sucesso!');
      if (escola) await carregarUsuarios(escola.id);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Erro ao excluir usuário');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    escolaService.logout();
    navigate('/login');
  };

  // Estatísticas
  const totalAlunos = usuarios.filter(u => u.role === 'Aluno').length;
  const totalProfessores = usuarios.filter(u => u.role === 'Professor').length;
  const totalUsuarios = usuarios.length;

  const dadosPorRole = {
    labels: ['Alunos', 'Professores'],
    datasets: [{
      data: [totalAlunos, totalProfessores],
      backgroundColor: ['rgba(99, 102, 241, 0.8)', 'rgba(168, 85, 247, 0.8)'],
      borderColor: ['rgb(99, 102, 241)', 'rgb(168, 85, 247)'],
      borderWidth: 2,
    }],
  };

  // Gerar labels dos últimos 6 meses
  const mesesLabels = [];
  for (let i = 5; i >= 0; i--) {
    const data = new Date();
    data.setMonth(data.getMonth() - i);
    mesesLabels.push(data.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''));
  }

  const dadosAtividade = {
    labels: mesesLabels,
    datasets: [{
      label: 'Atividades Concluídas',
      data: estatisticas?.atividadesPorMes || [0, 0, 0, 0, 0, 0],
      backgroundColor: 'rgba(34, 197, 94, 0.8)',
      borderColor: 'rgb(34, 197, 94)',
      borderWidth: 2,
    }],
  };

  const dadosHorasEstudo = {
    labels: mesesLabels,
    datasets: [{
      label: 'Horas de Estudo',
      data: estatisticas?.horasPorMes || [0, 0, 0, 0, 0, 0],
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 2,
    }],
  };

  // Gráficos do aluno individual
  const dadosEvolucaoAluno = {
    labels: estatisticasAluno?.ultimasAtividades.slice(-10).map((_, i) => `Atv ${i + 1}`) || [],
    datasets: [{
      label: 'Nota (%)',
      data: estatisticasAluno?.ultimasAtividades.slice(-10).map(a => a.nota) || [],
      borderColor: 'rgb(99, 102, 241)',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      tension: 0.4,
    }],
  };

  const dadosAcertosErrosAluno = {
    labels: ['Acertos', 'Erros'],
    datasets: [{
      data: [estatisticasAluno?.acertos || 0, estatisticasAluno?.erros || 0],
      backgroundColor: ['rgba(34, 197, 94, 0.8)', 'rgba(239, 68, 68, 0.8)'],
      borderColor: ['rgb(34, 197, 94)', 'rgb(239, 68, 68)'],
      borderWidth: 2,
    }],
  };

  if (!escola) return null;

  return (
    <div className={`min-h-screen transition-colors ${
      darkMode ? 'bg-slate-900' : 'bg-slate-50'
    }`}>
      {/* Header */}
      <div className={`sticky top-0 z-40 flex justify-between items-center px-6 py-4 backdrop-blur-lg border-b transition-colors ${
        darkMode 
          ? 'bg-slate-800/80 border-slate-700 shadow-lg'
          : 'bg-white/90 border-slate-300 shadow-sm'
      }`}>
        <div className="flex items-center">
          <h1 className={`text-2xl font-bold tracking-wide transition-colors ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}>IEDUCA</h1>
        </div>

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

        <div className="flex items-center gap-4">
          <NotificationDropdown darkMode={darkMode} />
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-medium transition-all"
          >
            Sair
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-5">
        {/* Info da Escola */}
        <div className={`rounded-3xl p-6 mb-6 shadow-2xl transition-colors ${
          darkMode ? 'bg-slate-800' : 'bg-white'
        }`}>
          <h2 className={`text-3xl font-bold mb-2 transition-colors ${
            darkMode ? 'text-white' : 'text-slate-900'
          }`}>{escola.nome}</h2>
          <p className={`transition-colors ${
            darkMode ? 'text-slate-400' : 'text-slate-600'
          }`}>{escola.email}</p>
        </div>

        {/* Alertas */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-xl mb-5">
            <span>⚠️ {error}</span>
          </div>
        )}
        {success && (
          <div className="bg-green-500/10 border border-green-500 text-green-500 px-4 py-3 rounded-xl mb-5">
            <span>✓ {success}</span>
          </div>
        )}

        {/* Tabs */}
        <div className={`rounded-2xl p-1 mb-6 shadow-xl transition-colors ${
          darkMode ? 'bg-slate-800' : 'bg-white'
        }`}>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('usuarios')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                activeTab === 'usuarios'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : darkMode
                  ? 'text-slate-400 hover:bg-slate-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              👥 Usuários
            </button>
            <button
              onClick={() => setActiveTab('alunos')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                activeTab === 'alunos'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : darkMode
                  ? 'text-slate-400 hover:bg-slate-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              🎓 Desempenho
            </button>
            <button
              onClick={() => setActiveTab('cadastrar')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                activeTab === 'cadastrar'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : darkMode
                  ? 'text-slate-400 hover:bg-slate-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              ➕ Cadastrar
            </button>
            <button
              onClick={() => setActiveTab('estatisticas')}
              className={`flex-1 py-3 px-4 rounded-xl font-semibold transition-all ${
                activeTab === 'estatisticas'
                  ? 'bg-indigo-600 text-white shadow-lg'
                  : darkMode
                  ? 'text-slate-400 hover:bg-slate-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              📊 Estatísticas
            </button>
          </div>
        </div>

        {/* Conteúdo das Tabs */}
        {activeTab === 'usuarios' && (
          <div className={`rounded-3xl p-6 shadow-2xl transition-colors ${
            darkMode ? 'bg-slate-800' : 'bg-white'
          }`}>
            <h3 className={`text-2xl font-bold mb-4 transition-colors ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}>Usuários da Escola</h3>

            {/* Busca */}
            <div className="mb-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar por nome, email ou tipo..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full px-4 py-3 pl-10 rounded-xl border-2 transition-all focus:outline-none ${
                    darkMode
                      ? 'bg-slate-700 border-slate-600 text-slate-100 placeholder-slate-400 focus:border-indigo-500'
                      : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500 focus:border-indigo-500'
                  }`}
                />
                <svg className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${
                  darkMode ? 'text-slate-400' : 'text-slate-500'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              {searchTerm && (
                <p className={`text-sm mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {usuariosFiltrados.length} usuário(s) encontrado(s)
                </p>
              )}
            </div>

            {/* Lista de usuários */}
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {usuariosFiltrados.map((user) => (
                <div key={user.id} className={`rounded-xl p-4 flex items-center justify-between transition-colors ${
                  darkMode ? 'bg-slate-700' : 'bg-slate-100'
                }`}>
                  <div className="flex-1">
                    <p className={`font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {user.nome}
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      {user.email}
                    </p>
                    <div className="flex gap-2 mt-1">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        user.role === 'Aluno'
                          ? 'bg-indigo-500/20 text-indigo-400'
                          : 'bg-purple-500/20 text-purple-400'
                      }`}>
                        {user.role}
                      </span>
                      {user.telefone && (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          darkMode ? 'bg-slate-600 text-slate-300' : 'bg-slate-200 text-slate-700'
                        }`}>
                          📞 {user.telefone}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingUser(user);
                        setShowResetPassword(true);
                      }}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all"
                      title="Resetar senha"
                    >
                      🔑
                    </button>
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-all"
                      title="Excluir usuário"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
              {usuariosFiltrados.length === 0 && (
                <p className={`text-center py-8 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  {searchTerm ? 'Nenhum usuário encontrado' : 'Nenhum usuário cadastrado'}
                </p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'alunos' && (
          <div className={`rounded-3xl p-6 shadow-2xl transition-colors ${
            darkMode ? 'bg-slate-800' : 'bg-white'
          }`}>
            <h3 className={`text-2xl font-bold mb-4 transition-colors ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}>Desempenho Individual dos Alunos</h3>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Lista de Alunos */}
              <div className={`rounded-2xl p-4 transition-colors ${
                darkMode ? 'bg-slate-700' : 'bg-slate-100'
              }`}>
                <h4 className={`text-lg font-semibold mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Selecionar Aluno
                </h4>
                
                {/* Busca */}
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Buscar aluno..."
                    value={searchAluno}
                    onChange={(e) => setSearchAluno(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border transition-all focus:outline-none ${
                      darkMode
                        ? 'bg-slate-600 border-slate-500 text-slate-100 focus:border-indigo-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                    }`}
                  />
                </div>

                {/* Lista */}
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {alunosFiltrados.length === 0 ? (
                    <p className={`text-sm text-center py-4 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Nenhum aluno encontrado
                    </p>
                  ) : (
                    alunosFiltrados.map((aluno) => (
                      <button
                        type="button"
                        key={aluno.id}
                        onClick={(e) => handleSelecionarAluno(aluno, e)}
                        className={`w-full text-left p-3 rounded-lg transition-all ${
                          alunoSelecionado?.id === aluno.id
                            ? 'bg-indigo-600 text-white shadow-lg'
                            : darkMode
                            ? 'bg-slate-600 text-slate-100 hover:bg-slate-500'
                            : 'bg-white text-slate-900 hover:bg-slate-200'
                        }`}
                      >
                        <p className="font-medium">{aluno.nome}</p>
                        <p className={`text-xs ${
                          alunoSelecionado?.id === aluno.id
                            ? 'text-indigo-200'
                            : darkMode
                            ? 'text-slate-400'
                            : 'text-slate-600'
                        }`}>
                          {aluno.email}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>

              {/* Estatísticas do Aluno Selecionado */}
              <div className="lg:col-span-2">
                {!alunoSelecionado ? (
                  <div className={`rounded-2xl p-12 text-center transition-colors ${
                    darkMode ? 'bg-slate-700' : 'bg-slate-100'
                  }`}>
                    <p className={`text-lg ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Selecione um aluno para ver as estatísticas
                    </p>
                  </div>
                ) : loading ? (
                  <div className={`rounded-2xl p-12 text-center transition-colors ${
                    darkMode ? 'bg-slate-700' : 'bg-slate-100'
                  }`}>
                    <p className={`text-lg ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Carregando estatísticas...
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Header do Aluno */}
                    <div className={`rounded-2xl p-6 transition-colors ${
                      darkMode ? 'bg-slate-700' : 'bg-slate-100'
                    }`}>
                      <h4 className={`text-xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {alunoSelecionado.nome}
                      </h4>
                      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                        {alunoSelecionado.email}
                      </p>
                    </div>

                    {/* Cards de Estatísticas */}
                    <div className="grid md:grid-cols-3 gap-4">
                      <div className={`rounded-xl p-4 transition-colors ${
                        darkMode ? 'bg-slate-700' : 'bg-slate-100'
                      }`}>
                        <p className={`text-sm mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          Atividades
                        </p>
                        <p className="text-3xl font-bold text-indigo-400">
                          {estatisticasAluno?.totalAtividades || 0}
                        </p>
                      </div>
                      <div className={`rounded-xl p-4 transition-colors ${
                        darkMode ? 'bg-slate-700' : 'bg-slate-100'
                      }`}>
                        <p className={`text-sm mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          Média de Notas
                        </p>
                        <p className="text-3xl font-bold text-purple-400">
                          {estatisticasAluno?.mediaNotas.toFixed(1) || '0.0'}%
                        </p>
                      </div>
                      <div className={`rounded-xl p-4 transition-colors ${
                        darkMode ? 'bg-slate-700' : 'bg-slate-100'
                      }`}>
                        <p className={`text-sm mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          Tempo Total
                        </p>
                        <p className="text-3xl font-bold text-blue-400">
                          {((estatisticasAluno?.tempoTotalSegundos || 0) / 3600).toFixed(1)}h
                        </p>
                      </div>
                    </div>

                    {/* Gráficos */}
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className={`rounded-2xl p-5 transition-colors ${
                        darkMode ? 'bg-slate-700' : 'bg-slate-100'
                      }`}>
                        <h5 className={`text-base font-bold mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          Evolução das Notas
                        </h5>
                        <Line
                          data={dadosEvolucaoAluno}
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

                      <div className={`rounded-2xl p-5 transition-colors ${
                        darkMode ? 'bg-slate-700' : 'bg-slate-100'
                      }`}>
                        <h5 className={`text-base font-bold mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          Acertos vs Erros
                        </h5>
                        <Doughnut
                          data={dadosAcertosErrosAluno}
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
                    <div className={`rounded-2xl p-5 transition-colors ${
                      darkMode ? 'bg-slate-700' : 'bg-slate-100'
                    }`}>
                      <h5 className={`text-base font-bold mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        Calendário de Frequência
                      </h5>
                      <Calendar darkMode={darkMode} userId={alunoSelecionado.id} />
                    </div>

                    {/* Tabela de Últimas Atividades */}
                    {estatisticasAluno?.ultimasAtividades && estatisticasAluno.ultimasAtividades.length > 0 && (
                      <div className={`rounded-2xl p-5 transition-colors ${
                        darkMode ? 'bg-slate-700' : 'bg-slate-100'
                      }`}>
                        <h5 className={`text-base font-bold mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          Últimas Atividades
                        </h5>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className={`border-b ${darkMode ? 'border-slate-600' : 'border-slate-300'}`}>
                                <th className={`px-4 py-2 text-left text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                  Data
                                </th>
                                <th className={`px-4 py-2 text-left text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                  Nota
                                </th>
                                <th className={`px-4 py-2 text-left text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                  Acertos
                                </th>
                                <th className={`px-4 py-2 text-left text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                  Erros
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {estatisticasAluno.ultimasAtividades.slice(-5).reverse().map((ativ, idx) => (
                                <tr key={idx} className={`border-b ${darkMode ? 'border-slate-600' : 'border-slate-300'}`}>
                                  <td className={`px-4 py-3 text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                    {new Date(ativ.data).toLocaleDateString('pt-BR')}
                                  </td>
                                  <td className={`px-4 py-3 text-sm font-semibold ${
                                    ativ.nota >= 70 ? 'text-green-500' : 'text-red-500'
                                  }`}>
                                    {ativ.nota.toFixed(0)}%
                                  </td>
                                  <td className={`px-4 py-3 text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                                    {ativ.acertos}
                                  </td>
                                  <td className={`px-4 py-3 text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                                    {ativ.erros}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'cadastrar' && (
          <div className={`rounded-3xl p-8 shadow-2xl transition-colors ${
            darkMode ? 'bg-slate-800' : 'bg-white'
          }`}>
            <h3 className={`text-2xl font-bold mb-6 transition-colors ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}>Cadastrar Novo Usuário</h3>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <label className={`block mb-2 font-medium text-sm ${
                    darkMode ? 'text-slate-400' : 'text-slate-700'
                  }`}>Nome Completo</label>
                  <input
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    required
                    placeholder="Nome do usuário"
                    className={`w-full px-4 py-3.5 border-2 rounded-xl transition-all focus:outline-none ${
                      darkMode
                        ? 'bg-slate-700 border-slate-600 text-slate-100 focus:border-indigo-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block mb-2 font-medium text-sm ${
                    darkMode ? 'text-slate-400' : 'text-slate-700'
                  }`}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="email@exemplo.com"
                    className={`w-full px-4 py-3.5 border-2 rounded-xl transition-all focus:outline-none ${
                      darkMode
                        ? 'bg-slate-700 border-slate-600 text-slate-100 focus:border-indigo-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block mb-2 font-medium text-sm ${
                    darkMode ? 'text-slate-400' : 'text-slate-700'
                  }`}>Telefone</label>
                  <input
                    type="tel"
                    value={telefone}
                    onChange={handleTelefoneChange}
                    required
                    placeholder="(00) 00000-0000"
                    maxLength={15}
                    className={`w-full px-4 py-3.5 border-2 rounded-xl transition-all focus:outline-none ${
                      darkMode
                        ? 'bg-slate-700 border-slate-600 text-slate-100 focus:border-indigo-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                    }`}
                  />
                </div>

                <div>
                  <label className={`block mb-2 font-medium text-sm ${
                    darkMode ? 'text-slate-400' : 'text-slate-700'
                  }`}>Tipo de Usuário</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                    className={`w-full px-4 py-3.5 border-2 rounded-xl transition-all focus:outline-none ${
                      darkMode
                        ? 'bg-slate-700 border-slate-600 text-slate-100 focus:border-indigo-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                    }`}
                  >
                    <option value="Aluno">Aluno</option>
                    <option value="Professor">Professor</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className={`block mb-2 font-medium text-sm ${
                    darkMode ? 'text-slate-400' : 'text-slate-700'
                  }`}>Senha</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    minLength={6}
                    className={`w-full px-4 py-3.5 border-2 rounded-xl transition-all focus:outline-none ${
                      darkMode
                        ? 'bg-slate-700 border-slate-600 text-slate-100 focus:border-indigo-500'
                        : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                    }`}
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-3.5 mt-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-base font-semibold transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/40 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? 'Cadastrando...' : `Cadastrar ${role}`}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'estatisticas' && (
          <div className="space-y-6">
            {/* Cards de estatísticas */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className={`rounded-2xl p-6 shadow-xl transition-colors ${
                darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
              }`}>
                <p className={`text-sm mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Total de Usuários
                </p>
                <p className="text-4xl font-bold text-indigo-400">{totalUsuarios}</p>
              </div>
              <div className={`rounded-2xl p-6 shadow-xl transition-colors ${
                darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
              }`}>
                <p className={`text-sm mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Total de Alunos
                </p>
                <p className="text-4xl font-bold text-blue-400">{totalAlunos}</p>
              </div>
              <div className={`rounded-2xl p-6 shadow-xl transition-colors ${
                darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
              }`}>
                <p className={`text-sm mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Horas de Estudo
                </p>
                <p className="text-4xl font-bold text-green-400">
                  {estatisticas?.totalHorasEstudadas.toFixed(1) || '0.0'}h
                </p>
              </div>
              <div className={`rounded-2xl p-6 shadow-xl transition-colors ${
                darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
              }`}>
                <p className={`text-sm mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Média de Acertos
                </p>
                <p className="text-4xl font-bold text-purple-400">
                  {estatisticas?.mediaAcertos.toFixed(1) || '0.0'}%
                </p>
              </div>
            </div>

            {/* Segunda linha de cards */}
            <div className="grid md:grid-cols-2 gap-4">
              <div className={`rounded-2xl p-6 shadow-xl transition-colors ${
                darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
              }`}>
                <p className={`text-sm mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Atividades Concluídas
                </p>
                <p className="text-4xl font-bold text-emerald-400">
                  {estatisticas?.totalAtividades || 0}
                </p>
              </div>
              <div className={`rounded-2xl p-6 shadow-xl transition-colors ${
                darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
              }`}>
                <p className={`text-sm mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  Questões Respondidas
                </p>
                <p className="text-4xl font-bold text-cyan-400">
                  {estatisticas?.totalQuestoesRespondidas || 0}
                </p>
              </div>
            </div>

            {/* Gráficos */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className={`rounded-3xl p-6 shadow-2xl transition-colors ${
                darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
              }`}>
                <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Horas de Estudo (Últimos 6 Meses)
                </h3>
                <Bar 
                  data={dadosHorasEstudo}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: { color: darkMode ? '#94a3b8' : '#64748b' },
                        grid: { color: darkMode ? '#334155' : '#e2e8f0' },
                      },
                      x: {
                        ticks: { color: darkMode ? '#94a3b8' : '#64748b' },
                        grid: { color: darkMode ? '#334155' : '#e2e8f0' },
                      },
                    },
                  }}
                />
              </div>

              <div className={`rounded-3xl p-6 shadow-2xl transition-colors ${
                darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
              }`}>
                <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Atividades por Mês
                </h3>
                <Bar 
                  data={dadosAtividade}
                  options={{
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: { color: darkMode ? '#94a3b8' : '#64748b', stepSize: 5 },
                        grid: { color: darkMode ? '#334155' : '#e2e8f0' },
                      },
                      x: {
                        ticks: { color: darkMode ? '#94a3b8' : '#64748b' },
                        grid: { color: darkMode ? '#334155' : '#e2e8f0' },
                      },
                    },
                  }}
                />
              </div>

              <div className={`rounded-3xl p-6 shadow-2xl transition-colors ${
                darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
              }`}>
                <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Distribuição por Tipo
                </h3>
                <Doughnut 
                  data={dadosPorRole}
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

              <div className={`rounded-3xl p-6 shadow-xl transition-colors ${
                darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
              }`}>
                <h3 className={`text-lg font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  Resumo Geral
                </h3>
                <div className="space-y-4">
                  <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Professores
                    </p>
                    <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {totalProfessores}
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Taxa de Conclusão
                    </p>
                    <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {estatisticas && estatisticas.totalAlunos > 0 
                        ? ((estatisticas.totalAtividades / estatisticas.totalAlunos).toFixed(1))
                        : '0.0'} 
                      <span className="text-sm ml-1">atv/aluno</span>
                    </p>
                  </div>
                  <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                    <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Tempo Médio por Aluno
                    </p>
                    <p className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      {estatisticas && estatisticas.totalAlunos > 0
                        ? (estatisticas.totalHorasEstudadas / estatisticas.totalAlunos).toFixed(1)
                        : '0.0'}h
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Reset de Senha */}
      {showResetPassword && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className={`rounded-3xl p-8 max-w-md w-full shadow-2xl transition-colors ${
            darkMode ? 'bg-slate-800' : 'bg-white'
          }`}>
            <h3 className={`text-2xl font-bold mb-4 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
              Resetar Senha
            </h3>
            <p className={`mb-6 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
              Resetar senha para: <strong>{editingUser.nome}</strong>
            </p>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Nova senha (mín. 6 caracteres)"
              minLength={6}
              className={`w-full px-4 py-3.5 border-2 rounded-xl mb-4 transition-all focus:outline-none ${
                darkMode
                  ? 'bg-slate-700 border-slate-600 text-slate-100 focus:border-indigo-500'
                  : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
              }`}
            />
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowResetPassword(false);
                  setEditingUser(null);
                  setNewPassword('');
                }}
                className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                  darkMode
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleResetPassword}
                disabled={loading || newPassword.length < 6}
                className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Resetando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
