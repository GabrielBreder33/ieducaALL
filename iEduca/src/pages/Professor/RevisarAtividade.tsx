import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { authService } from '../../services/authService';
import { professorService } from '../../services/professorService';
import type { AtividadeComQuestoes, QuestaoEditada, Alternativa, ConfirmarAtividadeProfessor } from '../../services/professorService';
import type { User } from '../../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface Aluno extends User { id: number; }

export default function RevisarAtividade() {
  const navigate = useNavigate();
  const { atividadeId } = useParams<{ atividadeId: string }>();
  const [searchParams] = useSearchParams();
  const isNew = searchParams.get('nova') === '1';

  const [professor, setProfessor] = useState<User | null>(null);
  const [atividade, setAtividade] = useState<AtividadeComQuestoes | null>(null);
  const [questoes, setQuestoes] = useState<QuestaoEditada[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [editandoQuestao, setEditandoQuestao] = useState<number | null>(null);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  const [showEnviarModal, setShowEnviarModal] = useState(false);
  const [alunoId, setAlunoId] = useState<number | undefined>(undefined);
  const [prazo, setPrazo] = useState('');
  const [instrucoes, setInstrucoes] = useState('');

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'Professor') { navigate('/login'); return; }
    setProfessor(user);

    if (atividadeId) {
      carregarAtividade(parseInt(atividadeId));
      carregarAlunos(user.idEscola || 0);
    }
  }, [navigate, atividadeId]);

  const carregarAtividade = async (id: number) => {
    setLoading(true);
    try {
      const data = await professorService.obterAtividadeComQuestoes(id);
      setAtividade(data);
      setQuestoes(data.questoes);
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Erro ao carregar atividade' });
    } finally {
      setLoading(false);
    }
  };

  const carregarAlunos = async (escolaId: number) => {
    try {
      const resp = await fetch(`${API_URL}/User/escola/${escolaId}/alunos`);
      if (resp.ok) setAlunos(await resp.json());
    } catch { /* silencioso */ }
  };

  const handleEditarQuestao = (numero: number) => {
    setEditandoQuestao(editandoQuestao === numero ? null : numero);
  };

  const handleQuestaoChange = (numero: number, field: string, value: string) => {
    setQuestoes(prev => prev.map(q =>
      q.numero === numero ? { ...q, [field]: value } : q
    ));
  };

  const handleAlternativaChange = (questaoNumero: number, altId: string, texto: string) => {
    setQuestoes(prev => prev.map(q =>
      q.numero === questaoNumero
        ? { ...q, alternativas: q.alternativas.map(a => a.id === altId ? { ...a, texto } : a) }
        : q
    ));
  };

  const handleRespostaCorretaChange = (questaoNumero: number, respostaCorreta: string) => {
    setQuestoes(prev => prev.map(q =>
      q.numero === questaoNumero ? { ...q, respostaCorreta } : q
    ));
  };

  const handleRemoverQuestao = (numero: number) => {
    setQuestoes(prev => {
      const filtered = prev.filter(q => q.numero !== numero);
      return filtered.map((q, i) => ({ ...q, numero: i + 1 }));
    });
  };

  const handleAdicionarQuestao = () => {
    const novaQuestao: QuestaoEditada = {
      numero: questoes.length + 1,
      enunciado: '',
      alternativas: [
        { id: 'A', texto: '' },
        { id: 'B', texto: '' },
        { id: 'C', texto: '' },
        { id: 'D', texto: '' },
      ],
      respostaCorreta: 'A',
    };
    setQuestoes(prev => [...prev, novaQuestao]);
    setEditandoQuestao(novaQuestao.numero);
  };

  const handleSalvarQuestoes = async () => {
    if (!professor?.id || !atividade) return;
    setSalvando(true);
    try {
      const data = await professorService.atualizarQuestoes(atividade.id, professor.id, questoes);
      setAtividade(data);
      setQuestoes(data.questoes);
      setMensagem({ tipo: 'sucesso', texto: 'Questões salvas com sucesso!' });
      setEditandoQuestao(null);
    } catch (err: any) {
      setMensagem({ tipo: 'erro', texto: err.message || 'Erro ao salvar' });
    } finally {
      setSalvando(false);
    }
  };

  const handleEnviar = async () => {
    if (!professor?.id || !atividade) return;
    setSalvando(true);
    try {
      const dto: ConfirmarAtividadeProfessor = {
        atividadeId: atividade.id,
        professorId: professor.id,
        alunoId: alunoId || undefined,
        prazo: prazo || undefined,
        instrucoes: instrucoes || undefined,
        questoesEditadas: questoes,
      };
      await professorService.confirmarEEnviarAtividade(dto);
      setMensagem({ tipo: 'sucesso', texto: 'Atividade enviada para os alunos!' });
      setShowEnviarModal(false);
      setTimeout(() => navigate('/professor/atividades'), 1500);
    } catch (err: any) {
      setMensagem({ tipo: 'erro', texto: err.message || 'Erro ao enviar' });
    } finally {
      setSalvando(false);
    }
  };

  if (!professor) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-200 border-t-indigo-600 mx-auto mb-4" />
          <p className="text-slate-600 font-medium">
            {isNew ? 'Gerando questões com IA...' : 'Carregando atividade...'}
          </p>
          {isNew && <p className="text-sm text-slate-400 mt-2">Isso pode levar alguns segundos</p>}
        </div>
      </div>
    );
  }

  if (!atividade) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-slate-600">Atividade não encontrada</p>
          <button onClick={() => navigate('/professor/atividades')} className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl">
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-lg border-b border-slate-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/professor/atividades')} className="text-slate-500 hover:text-slate-900 transition-colors">
              ← Voltar
            </button>
            <div>
              <h1 className="text-lg font-bold text-slate-900">{atividade.nome}</h1>
              <p className="text-xs text-slate-500">
                {atividade.materiaNome} • {atividade.nivelDificuldade} • {questoes.length} questões
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSalvarQuestoes}
              disabled={salvando}
              className="px-4 py-2 bg-slate-200 text-slate-700 font-medium rounded-xl hover:bg-slate-300 transition-colors text-sm disabled:opacity-50"
            >
              {salvando ? 'Salvando...' : 'Salvar Rascunho'}
            </button>
            <button
              onClick={() => setShowEnviarModal(true)}
              className="px-5 py-2 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors text-sm flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
              Enviar para Alunos
            </button>
          </div>
        </div>
      </div>

      {mensagem && (
        <div className="max-w-5xl mx-auto px-4 mt-4">
          <div className={`p-4 rounded-xl font-medium text-sm ${
            mensagem.tipo === 'sucesso' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {mensagem.texto}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto p-4 pb-20">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <p className="text-xs text-slate-500">Matéria</p>
            <p className="font-bold text-slate-900">{atividade.materiaNome}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <p className="text-xs text-slate-500">Tipo</p>
            <p className="font-bold text-slate-900">{atividade.tipo}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <p className="text-xs text-slate-500">Dificuldade</p>
            <p className="font-bold text-slate-900">{atividade.nivelDificuldade}</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-slate-200">
            <p className="text-xs text-slate-500">Questões</p>
            <p className="font-bold text-slate-900">{questoes.length}</p>
          </div>
        </div>

        <div className="space-y-4">
          {questoes.map((questao) => {
            const isEditing = editandoQuestao === questao.numero;
            return (
              <div key={questao.numero} className={`bg-white rounded-2xl border-2 transition-all ${
                isEditing ? 'border-indigo-400 shadow-lg' : 'border-slate-200 hover:border-slate-300'
              }`}>
                <div className="flex items-center justify-between p-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center text-sm font-bold">
                      {questao.numero}
                    </span>
                    <span className="text-sm text-slate-500">
                      Resposta correta: <strong className="text-green-600">{questao.respostaCorreta}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEditarQuestao(questao.numero)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        isEditing ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {isEditing ? '✓ Fechar' : '✏️ Editar'}
                    </button>
                    {questoes.length > 1 && (
                      <button
                        onClick={() => handleRemoverQuestao(questao.numero)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  {isEditing ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Enunciado</label>
                        <textarea
                          value={questao.enunciado}
                          onChange={e => handleQuestaoChange(questao.numero, 'enunciado', e.target.value)}
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:outline-none resize-none text-sm text-slate-900"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="block text-xs font-medium text-slate-500">Alternativas</label>
                        {questao.alternativas.map((alt) => (
                          <div key={alt.id} className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleRespostaCorretaChange(questao.numero, alt.id)}
                              className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${
                                questao.respostaCorreta === alt.id
                                  ? 'bg-green-500 text-white'
                                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                              }`}
                              title={questao.respostaCorreta === alt.id ? 'Resposta correta' : 'Marcar como correta'}
                            >
                              {alt.id}
                            </button>
                            <input
                              type="text"
                              value={alt.texto}
                              onChange={e => handleAlternativaChange(questao.numero, alt.id, e.target.value)}
                              className="flex-1 px-3 py-2 rounded-lg border-2 border-slate-200 focus:border-indigo-400 focus:outline-none text-sm text-slate-900"
                              placeholder={`Alternativa ${alt.id}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-slate-800 font-medium mb-3">{questao.enunciado}</p>
                      <div className="space-y-2">
                        {questao.alternativas.map((alt) => (
                          <div
                            key={alt.id}
                            className={`flex items-center gap-3 p-3 rounded-xl text-sm transition-colors ${
                              questao.respostaCorreta === alt.id
                                ? 'bg-green-50 border-2 border-green-300'
                                : 'bg-slate-50 border-2 border-transparent'
                            }`}
                          >
                            <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                              questao.respostaCorreta === alt.id
                                ? 'bg-green-500 text-white'
                                : 'bg-slate-200 text-slate-600'
                            }`}>
                              {alt.id}
                            </span>
                            <span className={questao.respostaCorreta === alt.id ? 'text-green-800 font-medium' : 'text-slate-700'}>
                              {alt.texto}
                            </span>
                            {questao.respostaCorreta === alt.id && (
                              <span className="ml-auto text-green-600 text-xs font-bold">✓ Correta</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <button
          onClick={handleAdicionarQuestao}
          className="w-full mt-4 p-4 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 hover:border-indigo-400 hover:text-indigo-600 transition-colors font-medium flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Adicionar Questão
        </button>
      </div>

      {showEnviarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white rounded-2xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Enviar Atividade</h2>
            <p className="text-sm text-slate-500 mb-6">
              {atividade.nome} • {questoes.length} questões
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Destinatário</label>
                <select
                  value={alunoId || ''}
                  onChange={e => setAlunoId(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:outline-none text-slate-900"
                >
                  <option value="">Todos os alunos da escola</option>
                  {alunos.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Prazo</label>
                <input
                  type="date"
                  value={prazo}
                  onChange={e => setPrazo(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:outline-none text-slate-900"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Instruções para o aluno</label>
                <textarea
                  value={instrucoes}
                  onChange={e => setInstrucoes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-indigo-400 focus:outline-none resize-none text-slate-900"
                  placeholder="Instruções específicas..."
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowEnviarModal(false)}
                className="flex-1 py-3 bg-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleEnviar}
                disabled={salvando}
                className="flex-1 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {salvando ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Enviar
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
