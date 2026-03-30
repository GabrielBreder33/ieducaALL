import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { materialService } from '../../services/materialService';
import { conhecimentoService } from '../../services/conhecimentoService';
import type { MaterialItem, QuestoesParseadas } from '../../services/materialService';
import type { Materia, AreaConhecimento } from '../../services/conhecimentoService';
import type { User } from '../../types';
import { NotificationDropdown, ProfileMenu } from '../../components/Dashboard';

export default function MaterialPage() {
  const navigate = useNavigate();
  const [professor, setProfessor] = useState<User | null>(null);
  const [darkMode] = useState(false);
  const [materiais, setMateriais] = useState<MaterialItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [materialSelecionado, setMaterialSelecionado] = useState<MaterialItem | null>(null);
  const [questoesParseadas, setQuestoesParseadas] = useState<QuestoesParseadas | null>(null);
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null);

  // Form
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [areas, setAreas] = useState<AreaConhecimento[]>([]);
  const [materiasList, setMateriasList] = useState<Materia[]>([]);
  const [areaId, setAreaId] = useState<number>(0);
  const [materiaId, setMateriaId] = useState<number>(0);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (!user || user.role !== 'Professor') {
      navigate('/login');
      return;
    }
    setProfessor(user);
    carregarMateriais(user.id || 0);
    carregarAreas();
  }, [navigate]);

  useEffect(() => {
    if (areaId > 0) {
      conhecimentoService.getMateriasByConhecimento(areaId).then(setMateriasList);
    } else {
      setMateriasList([]);
    }
  }, [areaId]);

  const carregarMateriais = async (professorId: number) => {
    try {
      setLoading(true);
      const data = await materialService.listarPorProfessor(professorId);
      setMateriais(data);
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Erro ao carregar materiais' });
    } finally {
      setLoading(false);
    }
  };

  const carregarAreas = async () => {
    try {
      const data = await conhecimentoService.getAreasConhecimento();
      setAreas(data);
    } catch {
      // silenciar
    }
  };

  const handleUpload = async () => {
    if (!arquivo || !nome.trim() || !professor) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('Arquivo', arquivo);
      formData.append('Nome', nome.trim());
      formData.append('ProfessorId', String(professor.id || 0));
      if (descricao.trim()) formData.append('Descricao', descricao.trim());
      if (materiaId > 0) formData.append('MateriaId', String(materiaId));

      await materialService.upload(formData);
      setMensagem({ tipo: 'sucesso', texto: 'Material enviado e processado com sucesso!' });
      resetForm();
      setShowUploadModal(false);
      await carregarMateriais(professor.id || 0);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao enviar material';
      setMensagem({ tipo: 'erro', texto: msg });
    } finally {
      setUploading(false);
    }
  };

  const handleDeletar = async (id: number) => {
    if (!professor) return;
    try {
      await materialService.deletar(id);
      setMensagem({ tipo: 'sucesso', texto: 'Material removido' });
      if (materialSelecionado?.id === id) {
        setMaterialSelecionado(null);
        setQuestoesParseadas(null);
      }
      await carregarMateriais(professor.id || 0);
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Erro ao remover material' });
    }
  };

  const handleReprocessar = async (id: number) => {
    if (!professor) return;
    try {
      setMensagem({ tipo: 'sucesso', texto: 'Reprocessando material...' });
      await materialService.reprocessar(id);
      setMensagem({ tipo: 'sucesso', texto: 'Material reprocessado!' });
      await carregarMateriais(professor.id || 0);
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Erro ao reprocessar' });
    }
  };

  const handleVerQuestoes = (material: MaterialItem) => {
    setMaterialSelecionado(material);
    const parsed = materialService.parseQuestoes(material.questoesJson);
    setQuestoesParseadas(parsed);
  };

  const resetForm = () => {
    setNome('');
    setDescricao('');
    setAreaId(0);
    setMateriaId(0);
    setArquivo(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
    <div className={`min-h-screen overflow-x-hidden w-full max-w-full transition-colors ${darkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
      {/* Header */}
      <div className={`sticky top-0 z-40 flex justify-between items-center px-3 sm:px-6 py-3 sm:py-4 backdrop-blur-lg border-b transition-colors ${
        darkMode ? 'bg-slate-800/80 border-slate-700 shadow-lg' : 'bg-white/90 border-slate-300 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/professor/dashboard')} className={`p-2 rounded-xl transition-colors ${
            darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'
          }`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className={`text-xl sm:text-2xl font-bold tracking-wide ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Material
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <NotificationDropdown darkMode={darkMode} />
          <ProfileMenu user={professor} darkMode={darkMode} onLogout={handleLogout} onUpdateUser={handleUpdateUser} />
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-3 sm:p-5 w-full">
        {/* Mensagem */}
        {mensagem && (
          <div className={`mb-4 p-4 rounded-2xl text-sm font-medium flex items-center justify-between ${
            mensagem.tipo === 'sucesso'
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <span>{mensagem.texto}</span>
            <button onClick={() => setMensagem(null)} className="ml-3 font-bold text-lg leading-none">&times;</button>
          </div>
        )}

        {/* Header + Botão Upload */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>Meus Materiais</h2>
            <p className={`text-sm mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
              Envie PDFs com questões e a IA extrai automaticamente
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200/50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Enviar PDF
          </button>
        </div>

        {/* Lista de Materiais */}
        {loading && !materiais.length ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className={`h-24 rounded-2xl animate-pulse ${darkMode ? 'bg-slate-800' : 'bg-slate-200'}`} />
            ))}
          </div>
        ) : materiais.length === 0 ? (
          <div className={`text-center py-20 rounded-3xl border-2 border-dashed ${
            darkMode ? 'border-slate-700 text-slate-500' : 'border-slate-200 text-slate-400'
          }`}>
            <svg className="w-16 h-16 mx-auto mb-4 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            <p className="text-lg font-semibold mb-1">Nenhum material ainda</p>
            <p className="text-sm">Envie seu primeiro PDF para começar</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {materiais.map(mat => (
              <div
                key={mat.id}
                className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                  materialSelecionado?.id === mat.id
                    ? 'border-indigo-400 bg-indigo-50/50 shadow-lg shadow-indigo-100/50'
                    : darkMode
                    ? 'bg-slate-800 border-slate-700 hover:border-slate-600'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-md'
                }`}
                onClick={() => handleVerQuestoes(mat)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                      mat.status === 'Concluido' ? 'bg-emerald-100 text-emerald-600'
                      : mat.status === 'Processando' ? 'bg-amber-100 text-amber-600'
                      : 'bg-red-100 text-red-600'
                    }`}>
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div className="min-w-0">
                      <h3 className={`font-bold text-base truncate ${darkMode ? 'text-white' : 'text-slate-900'}`}>{mat.nome}</h3>
                      {mat.descricao && (
                        <p className={`text-sm mt-0.5 truncate ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>{mat.descricao}</p>
                      )}
                      <div className="flex items-center gap-3 mt-2 flex-wrap">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          mat.status === 'Concluido' ? 'bg-emerald-100 text-emerald-700'
                          : mat.status === 'Processando' ? 'bg-amber-100 text-amber-700'
                          : 'bg-red-100 text-red-700'
                        }`}>
                          {mat.status === 'Concluido' ? '✓ Concluído' : mat.status}
                        </span>
                        {(() => {
                          const parsed = materialService.parseQuestoes(mat.questoesJson);
                          const total = parsed ? parsed.questoes.length : mat.totalQuestoes;
                          return total > 0 ? (
                            <span className={`text-xs font-semibold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                              📝 {total} questões extraídas
                            </span>
                          ) : null;
                        })()}
                        {mat.materiaNome && (
                          <span className={`text-xs px-2.5 py-1 rounded-full ${
                            darkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'
                          }`}>{mat.materiaNome}</span>
                        )}
                        <span className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                          {new Date(mat.criadoEm).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      {mat.status === 'Concluido' && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleVerQuestoes(mat); }}
                          className={`mt-2 inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                            materialSelecionado?.id === mat.id
                              ? 'bg-indigo-600 text-white'
                              : darkMode
                              ? 'bg-indigo-900/30 text-indigo-400 hover:bg-indigo-900/50'
                              : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                          }`}
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          {materialSelecionado?.id === mat.id ? 'Visualizando Questões' : 'Ver Questões e Gabarito'}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    {mat.status === 'Erro' && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleReprocessar(mat.id); }}
                        className="p-2 rounded-xl text-amber-600 hover:bg-amber-50 transition-colors"
                        title="Reprocessar"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleDeletar(mat.id); }}
                      className="p-2 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                      title="Remover"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>

                {mat.status === 'Erro' && mat.erroProcessamento && (
                  <div className="mt-3 p-3 rounded-xl bg-red-50 border border-red-200">
                    <p className="text-xs text-red-600">{mat.erroProcessamento}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Visualização de Questões */}
        {materialSelecionado && materialSelecionado.status === 'Concluido' && questoesParseadas && (
          <div className={`mt-6 rounded-3xl border p-6 ${darkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                Questões — {materialSelecionado.nome}
              </h3>
              <button
                onClick={() => { setMaterialSelecionado(null); setQuestoesParseadas(null); }}
                className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {questoesParseadas.conteudo_extra && (
              <div className={`mb-5 p-4 rounded-2xl ${darkMode ? 'bg-slate-700' : 'bg-blue-50 border border-blue-200'}`}>
                <p className={`text-xs font-semibold mb-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Conteúdo Extra</p>
                <p className={`text-sm whitespace-pre-wrap ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  {questoesParseadas.conteudo_extra}
                </p>
              </div>
            )}

            {questoesParseadas.questoes.length === 0 ? (
              <p className={`text-center py-8 text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Nenhuma questão encontrada neste material
              </p>
            ) : (
              <div className="space-y-5">
                {questoesParseadas.questoes.map((q, idx) => (
                  <div key={idx} className={`p-5 rounded-2xl border ${darkMode ? 'bg-slate-700/50 border-slate-600' : 'bg-slate-50 border-slate-200'}`}>
                    <p className={`font-semibold text-sm mb-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                      <span className="text-indigo-600 font-bold mr-2">Questão {q.numero}</span>
                      {q.enunciado}
                    </p>
                    <div className="space-y-2 ml-1">
                      {q.alternativas.map((alt) => (
                        <div
                          key={alt.letra}
                          className={`flex items-start gap-2 p-2.5 rounded-xl text-sm ${
                            q.gabarito === alt.letra
                              ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                              : darkMode ? 'text-slate-300' : 'text-slate-700'
                          }`}
                        >
                          <span className={`font-bold flex-shrink-0 ${
                            q.gabarito === alt.letra ? 'text-emerald-600' : 'text-indigo-500'
                          }`}>{alt.letra})</span>
                          <span>{alt.texto}</span>
                          {q.gabarito === alt.letra && (
                            <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 ml-auto mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      ))}
                    </div>
                    {q.explicacao && (
                      <div className={`mt-3 p-3 rounded-xl text-sm ${darkMode ? 'bg-slate-600 text-slate-300' : 'bg-indigo-50 text-indigo-700 border border-indigo-200'}`}>
                        <span className="font-semibold">Explicação: </span>{q.explicacao}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Upload */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className={`w-full max-w-lg rounded-3xl p-6 shadow-2xl ${darkMode ? 'bg-slate-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-5">
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>Enviar Material (PDF)</h3>
              <button
                onClick={() => { setShowUploadModal(false); resetForm(); }}
                className={`p-2 rounded-xl transition-colors ${darkMode ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'}`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Nome do Material *
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                  placeholder="Ex: Prova de Matemática 2026"
                  className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                    darkMode
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-400 focus:bg-white'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Descrição
                </label>
                <textarea
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                  placeholder="Descrição opcional do material..."
                  rows={2}
                  className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none ${
                    darkMode
                      ? 'bg-slate-700 border-slate-600 text-white placeholder-slate-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-400 focus:bg-white'
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`block text-sm font-semibold mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Área
                  </label>
                  <select
                    value={areaId}
                    onChange={e => { setAreaId(Number(e.target.value)); setMateriaId(0); }}
                    className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                      darkMode
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-400 focus:bg-white'
                    }`}
                  >
                    <option value={0}>Selecione...</option>
                    {areas.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-semibold mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Matéria
                  </label>
                  <select
                    value={materiaId}
                    onChange={e => setMateriaId(Number(e.target.value))}
                    disabled={!materiasList.length}
                    className={`w-full px-4 py-3 rounded-xl border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
                      darkMode
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-indigo-400 focus:bg-white'
                    } ${!materiasList.length ? 'opacity-50' : ''}`}
                  >
                    <option value={0}>Selecione...</option>
                    {materiasList.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-1.5 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Arquivo PDF *
                </label>
                <div
                  className={`relative border-2 border-dashed rounded-2xl p-6 text-center transition-colors cursor-pointer ${
                    arquivo
                      ? 'border-indigo-400 bg-indigo-50/50'
                      : darkMode
                      ? 'border-slate-600 hover:border-slate-500'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) setArquivo(file);
                    }}
                  />
                  {arquivo ? (
                    <div className="flex items-center justify-center gap-3">
                      <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <div className="text-left">
                        <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{arquivo.name}</p>
                        <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                          {(arquivo.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <svg className={`w-10 h-10 mx-auto mb-2 ${darkMode ? 'text-slate-500' : 'text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <p className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        Clique para selecionar ou arraste o PDF
                      </p>
                      <p className={`text-xs mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Máximo 10MB</p>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => { setShowUploadModal(false); resetForm(); }}
                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-colors ${
                  darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Cancelar
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !arquivo || !nome.trim()}
                className="flex-1 py-3 rounded-xl font-semibold text-sm bg-indigo-600 text-white hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Processando...
                  </>
                ) : 'Enviar e Processar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
