import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { professorService } from '../../services/professorService';
import type { AtribuicaoAtividade, CriarAtividadeProfessor } from '../../services/professorService';
import { conhecimentoService } from '../../services/conhecimentoService';
import type { Materia, AreaConhecimento } from '../../services/conhecimentoService';
import type { User } from '../../types';
import { NotificationDropdown, ProfileMenu } from '../../components/Dashboard';
import CriarAtividadeModal from './components/CriarAtividadeModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Aluno extends User {
  id: number;
}

export default function GerenciarAtividades() {
  const navigate = useNavigate();
  const [professor, setProfessor] = useState<User | null>(null);
  const [darkMode] = useState(false);
  const [atribuicoes, setAtribuicoes] = useState<AtribuicaoAtividade[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [areas, setAreas] = useState<AreaConhecimento[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const [form, setForm] = useState<CriarAtividadeProfessor>({
    nome: '',
    descricao: '',
    materiaId: 0,
    tipo: 'Quiz',
    nivelDificuldade: 'Fácil',
    totalQuestoes: 10,
    professorId: 0,
    escolaId: 0,
    alunoId: undefined,
    prazo: '',
    instrucoes: '',
  });

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'Professor') {
      navigate('/login');
      return;
    }
    setProfessor(user);

    const escolaId = user.idEscola || 0;
    const professorId = user.id || 0;

    setForm(prev => ({ ...prev, professorId, escolaId }));
    carregarDados(professorId, escolaId);
  }, [navigate]);

  const carregarDados = async (professorId: number, escolaId: number) => {
    setLoading(true);
    try {
      const [atribResult, alunosResult, areasResult] = await Promise.allSettled([
        professorService.listarAtribuicoesProfessor(professorId),
        fetch(`${API_URL}/User/escola/${escolaId}/alunos`).then(r => r.json()),
        conhecimentoService.getAreasConhecimento(),
      ]);
      if (atribResult.status === 'fulfilled') setAtribuicoes(atribResult.value);
      if (alunosResult.status === 'fulfilled') setAlunos(alunosResult.value);
      if (areasResult.status === 'fulfilled') setAreas(areasResult.value);

      if (atribResult.status === 'rejected' && alunosResult.status === 'rejected' && areasResult.status === 'rejected') {
        setMensagem({ tipo: 'erro', texto: 'Erro ao carregar dados' });
      }
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Erro ao carregar dados' });
    } finally {
      setLoading(false);
    }
  };

  const handleAreaChange = async (areaId: number) => {
    if (areaId === 0) {
      setMaterias([]);
      setForm(prev => ({ ...prev, materiaId: 0 }));
      return;
    }
    try {
      const mats = await conhecimentoService.getMateriasByConhecimento(areaId);
      setMaterias(mats);
    } catch {
      setMaterias([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nome.trim() || form.materiaId === 0) {
      setMensagem({ tipo: 'erro', texto: 'Preencha nome e matéria' });
      return;
    }

    setSalvando(true);
    setMensagem(null);
    try {
      await professorService.criarAtividade({
        ...form,
        alunoId: form.alunoId || undefined,
        prazo: form.prazo || undefined,
      });
      setMensagem({ tipo: 'sucesso', texto: 'Atividade criada com sucesso!' });
      setShowModal(false);
      setForm(prev => ({
        ...prev,
        nome: '',
        descricao: '',
        materiaId: 0,
        tipo: 'Quiz',
        nivelDificuldade: 'Fácil',
        totalQuestoes: 10,
        alunoId: undefined,
        prazo: '',
        instrucoes: '',
      }));
      // Recarregar
      if (professor?.id) {
        const atribData = await professorService.listarAtribuicoesProfessor(professor.id);
        setAtribuicoes(atribData);
      }
    } catch (err: any) {
      setMensagem({ tipo: 'erro', texto: err.message || 'Erro ao criar atividade' });
    } finally {
      setSalvando(false);
    }
  };

  const handleEncerrar = async (atribuicaoId: number) => {
    if (!professor?.id) return;
    try {
      await professorService.encerrarAtribuicao(atribuicaoId, professor.id);
      setAtribuicoes(prev =>
        prev.map(a => a.id === atribuicaoId ? { ...a, status: 'Encerrada' } : a)
      );
      setMensagem({ tipo: 'sucesso', texto: 'Atribuição encerrada' });
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Erro ao encerrar' });
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

  if (!professor) return null;

  return (
    <div className={`min-h-screen overflow-x-hidden w-full transition-colors ${
      darkMode ? 'bg-slate-900' : 'bg-slate-50'
    }`}>
      {/* Header */}
      <div className={`sticky top-0 z-40 flex justify-between items-center px-3 sm:px-6 py-3 sm:py-4 backdrop-blur-lg border-b transition-colors ${
        darkMode ? 'bg-slate-800/80 border-slate-700 shadow-lg' : 'bg-white/90 border-slate-300 shadow-sm'
      }`}>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/professor/dashboard')} className={`text-sm font-medium transition-colors ${darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}>
            ← Dashboard
          </button>
          <h1 className={`text-xl sm:text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Gerenciar Atividades
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <NotificationDropdown darkMode={darkMode} />
          <ProfileMenu user={professor} darkMode={darkMode} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-3 sm:p-5">
        {/* Mensagem */}
        {mensagem && (
          <div className={`mb-4 p-4 rounded-xl font-medium ${
            mensagem.tipo === 'sucesso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {mensagem.texto}
          </div>
        )}

        {/* Botão Criar */}
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setShowModal(true)}
            className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nova Atividade
          </button>
        </div>

        {/* Lista de Atribuições */}
        {loading ? (
          <div className={`text-center py-12 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Carregando...</div>
        ) : atribuicoes.length === 0 ? (
          <div className={`text-center py-12 rounded-2xl ${darkMode ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-600'}`}>
            <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-lg font-medium">Nenhuma atividade cadastrada</p>
            <p className="text-sm mt-1">Clique em "Nova Atividade" para começar</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {atribuicoes.map(atrib => (
              <div key={atrib.id} className={`rounded-2xl p-5 shadow-lg transition-colors ${
                darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
              }`}>
                <div className="flex flex-col sm:flex-row justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                        {atrib.atividadeNome}
                      </h3>
                      <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                        atrib.status === 'Ativa'
                          ? 'bg-green-100 text-green-700'
                          : atrib.status === 'Encerrada'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {atrib.status}
                      </span>
                    </div>
                    <div className={`flex flex-wrap gap-4 text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      <span>Tipo: <strong>{atrib.atividadeTipo}</strong></span>
                      <span>Para: <strong>{atrib.alunoNome || 'Toda a escola'}</strong></span>
                      {atrib.prazo && (
                        <span>Prazo: <strong>{new Date(atrib.prazo).toLocaleDateString('pt-BR')}</strong></span>
                      )}
                      <span>Criado: <strong>{new Date(atrib.criadoEm).toLocaleDateString('pt-BR')}</strong></span>
                    </div>
                    {atrib.instrucoes && (
                      <p className={`mt-2 text-sm ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                        {atrib.instrucoes}
                      </p>
                    )}
                  </div>
                  {atrib.status === 'Ativa' && (
                    <button
                      onClick={() => handleEncerrar(atrib.id)}
                      className="self-start px-4 py-2 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 transition-colors"
                    >
                      Encerrar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Criar Atividade */}
      {showModal && (
        <CriarAtividadeModal
          darkMode={darkMode}
          form={form}
          areas={areas}
          materias={materias}
          alunos={alunos}
          salvando={salvando}
          onFormChange={setForm}
          onAreaChange={handleAreaChange}
          onSubmit={handleSubmit}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
