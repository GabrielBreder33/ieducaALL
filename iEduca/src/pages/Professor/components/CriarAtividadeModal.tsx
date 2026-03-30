import { useState, useEffect } from 'react';
import type { CriarAtividadeProfessor } from '../../../services/professorService';
import type { Materia, AreaConhecimento } from '../../../services/conhecimentoService';
import type { User } from '../../../types';
import { materialService } from '../../../services/materialService';
import type { MaterialItem, QuestaoExtraida } from '../../../services/materialService';

interface Aluno extends User {
  id: number;
}

interface Props {
  darkMode: boolean;
  form: CriarAtividadeProfessor;
  areas: AreaConhecimento[];
  materias: Materia[];
  alunos: Aluno[];
  salvando: boolean;
  professorId: number;
  onFormChange: (updater: (prev: CriarAtividadeProfessor) => CriarAtividadeProfessor) => void;
  onAreaChange: (areaId: number) => void;
  onSubmit: (e: React.FormEvent, materialData?: { materialId: number; questoesSelecionadas: number[] }) => void;
  onClose: () => void;
}

export default function CriarAtividadeModal({
  darkMode, form, areas, materias, alunos, salvando, professorId,
  onFormChange, onAreaChange, onSubmit, onClose,
}: Props) {
  const [fonte, setFonte] = useState<'ia' | 'material'>('ia');
  const [materiaisDisponiveis, setMateriaisDisponiveis] = useState<MaterialItem[]>([]);
  const [materialSelecionado, setMaterialSelecionado] = useState<MaterialItem | null>(null);
  const [questoesMaterial, setQuestoesMaterial] = useState<QuestaoExtraida[]>([]);
  const [questoesSelecionadas, setQuestoesSelecionadas] = useState<Set<number>>(new Set());
  const [loadingMateriais, setLoadingMateriais] = useState(false);

  useEffect(() => {
    if (fonte === 'material' && professorId > 0) {
      setLoadingMateriais(true);
      materialService.listarPorProfessor(professorId)
        .then(data => {
          // Mostrar materiais concluídos (com ou sem totalQuestoes, pois pode ter questões no JSON)
          const concluidos = data.filter(m => m.status === 'Concluido');
          // Recalcular totalQuestoes a partir do JSON real
          const comQuestoes = concluidos.filter(m => {
            if (m.totalQuestoes > 0) return true;
            const parsed = materialService.parseQuestoes(m.questoesJson);
            return parsed && parsed.questoes.length > 0;
          });
          setMateriaisDisponiveis(comQuestoes);
        })
        .catch(() => setMateriaisDisponiveis([]))
        .finally(() => setLoadingMateriais(false));
    }
  }, [fonte, professorId]);

  const handleSelecionarMaterial = (mat: MaterialItem) => {
    setMaterialSelecionado(mat);
    const parsed = materialService.parseQuestoes(mat.questoesJson);
    if (parsed && parsed.questoes.length > 0) {
      setQuestoesMaterial(parsed.questoes);
      setQuestoesSelecionadas(new Set(parsed.questoes.map(q => q.numero)));
    } else {
      setQuestoesMaterial([]);
      setQuestoesSelecionadas(new Set());
    }
  };

  const toggleQuestao = (numero: number) => {
    setQuestoesSelecionadas(prev => {
      const next = new Set(prev);
      if (next.has(numero)) next.delete(numero);
      else next.add(numero);
      return next;
    });
  };

  const toggleTodas = () => {
    if (questoesSelecionadas.size === questoesMaterial.length) {
      setQuestoesSelecionadas(new Set());
    } else {
      setQuestoesSelecionadas(new Set(questoesMaterial.map(q => q.numero)));
    }
  };

  const handleSubmitWrapper = (e: React.FormEvent) => {
    e.preventDefault();
    if (fonte === 'material' && materialSelecionado && questoesSelecionadas.size > 0) {
      onSubmit(e, {
        materialId: materialSelecionado.id,
        questoesSelecionadas: Array.from(questoesSelecionadas),
      });
    } else {
      onSubmit(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl p-6 shadow-2xl ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        <div className="flex justify-between items-center mb-6">
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Nova Atividade
          </h2>
          <button onClick={onClose} className={`p-2 rounded-full hover:bg-slate-200 ${darkMode ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-600'}`}>
            ✕
          </button>
        </div>

        {/* Seletor de Fonte */}
        <div className={`flex gap-2 mb-5 p-1 rounded-xl ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
          <button
            type="button"
            onClick={() => setFonte('ia')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              fonte === 'ia'
                ? 'bg-indigo-600 text-white shadow-md'
                : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>🤖</span> Gerar com IA
          </button>
          <button
            type="button"
            onClick={() => setFonte('material')}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
              fonte === 'material'
                ? 'bg-emerald-600 text-white shadow-md'
                : darkMode ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <span>📄</span> Usar Material
          </button>
        </div>

        <form onSubmit={handleSubmitWrapper} className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Nome da Atividade *
            </label>
            <input
              type="text"
              value={form.nome}
              onChange={e => onFormChange(prev => ({ ...prev, nome: e.target.value }))}
              className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-colors ${
                darkMode ? 'bg-slate-700 border-slate-600 text-white focus:border-indigo-500' : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
              }`}
              placeholder="Ex: Geometria Plana - Revisão"
            />
          </div>

          <div>
            <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
              Descrição
            </label>
            <textarea
              value={form.descricao || ''}
              onChange={e => onFormChange(prev => ({ ...prev, descricao: e.target.value }))}
              rows={3}
              className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none transition-colors resize-none ${
                darkMode ? 'bg-slate-700 border-slate-600 text-white focus:border-indigo-500' : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
              }`}
              placeholder="Descreva a atividade..."
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Área de Conhecimento
              </label>
              <select
                onChange={e => onAreaChange(Number(e.target.value))}
                className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none ${
                  darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value={0}>Selecione...</option>
                {areas.map(a => <option key={a.id} value={a.id}>{a.nome}</option>)}
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Matéria *
              </label>
              <select
                value={form.materiaId}
                onChange={e => onFormChange(prev => ({ ...prev, materiaId: Number(e.target.value) }))}
                className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none ${
                  darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value={0}>Selecione...</option>
                {materias.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Tipo
              </label>
              <select
                value={form.tipo}
                onChange={e => onFormChange(prev => ({ ...prev, tipo: e.target.value }))}
                className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none ${
                  darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="Quiz">Quiz</option>
                <option value="Redação">Redação</option>
                <option value="Simulado">Simulado</option>
              </select>
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                Dificuldade
              </label>
              <select
                value={form.nivelDificuldade}
                onChange={e => onFormChange(prev => ({ ...prev, nivelDificuldade: e.target.value }))}
                className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none ${
                  darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
                }`}
              >
                <option value="Fácil">Fácil</option>
                <option value="Médio">Médio</option>
                <option value="Difícil">Difícil</option>
              </select>
            </div>
            {fonte === 'ia' && (
              <div>
                <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  Questões
                </label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  value={form.totalQuestoes}
                  onChange={e => onFormChange(prev => ({ ...prev, totalQuestoes: Number(e.target.value) }))}
                  className={`w-full px-4 py-3 rounded-xl border-2 focus:outline-none ${
                    darkMode ? 'bg-slate-700 border-slate-600 text-white' : 'bg-white border-slate-300 text-slate-900'
                  }`}
                />
              </div>
            )}
            {fonte === 'material' && (
              <div className="flex items-end">
                <div className={`w-full px-4 py-3 rounded-xl border-2 text-center ${
                  darkMode ? 'bg-slate-700 border-slate-600 text-emerald-400' : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                }`}>
                  <span className="text-lg font-bold">{questoesSelecionadas.size}</span>
                  <span className="text-xs ml-1">selecionadas</span>
                </div>
              </div>
            )}
          </div>

          {/* Seção Material */}
          {fonte === 'material' && (
            <div className="space-y-3">
              {!materialSelecionado ? (
                <div>
                  <label className={`block text-sm font-semibold mb-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                    Selecione um Material
                  </label>
                  {loadingMateriais ? (
                    <div className="space-y-2">
                      {[1,2].map(i => <div key={i} className={`h-16 rounded-xl animate-pulse ${darkMode ? 'bg-slate-700' : 'bg-slate-100'}`} />)}
                    </div>
                  ) : materiaisDisponiveis.length === 0 ? (
                    <div className={`p-6 rounded-xl text-center border-2 border-dashed ${
                      darkMode ? 'border-slate-600 text-slate-500' : 'border-slate-200 text-slate-400'
                    }`}>
                      <p className="text-sm">Nenhum material com questões disponível</p>
                      <p className="text-xs mt-1">Envie um PDF na aba Material primeiro</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {materiaisDisponiveis.map(mat => (
                        <button
                          key={mat.id}
                          type="button"
                          onClick={() => handleSelecionarMaterial(mat)}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 ${
                            darkMode
                              ? 'bg-slate-700 border-slate-600 hover:border-emerald-500 text-white'
                              : 'bg-white border-slate-200 hover:border-emerald-400 hover:shadow-md text-slate-900'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            darkMode ? 'bg-emerald-900/50' : 'bg-emerald-100'
                          }`}>
                            <span className="text-emerald-600 text-lg">📄</span>
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-sm truncate">{mat.nome}</p>
                            <p className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                              {(() => {
                                const parsed = materialService.parseQuestoes(mat.questoesJson);
                                const total = parsed ? parsed.questoes.length : mat.totalQuestoes;
                                return `${total} questões`;
                              })()} • {mat.materiaNome || 'Sem matéria'}
                            </p>
                          </div>
                          <svg className={`w-5 h-5 flex-shrink-0 ${darkMode ? 'text-slate-500' : 'text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">📄</span>
                      <span className={`text-sm font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{materialSelecionado.nome}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={toggleTodas}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                          darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {questoesSelecionadas.size === questoesMaterial.length ? 'Desmarcar Todas' : 'Selecionar Todas'}
                      </button>
                      <button
                        type="button"
                        onClick={() => { setMaterialSelecionado(null); setQuestoesMaterial([]); setQuestoesSelecionadas(new Set()); }}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                          darkMode ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50' : 'bg-red-50 text-red-600 hover:bg-red-100'
                        }`}
                      >
                        Trocar Material
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {questoesMaterial.map(q => {
                      const selecionada = questoesSelecionadas.has(q.numero);
                      return (
                        <button
                          key={q.numero}
                          type="button"
                          onClick={() => toggleQuestao(q.numero)}
                          className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                            selecionada
                              ? darkMode
                                ? 'border-emerald-500 bg-emerald-900/20'
                                : 'border-emerald-400 bg-emerald-50'
                              : darkMode
                              ? 'border-slate-600 bg-slate-700/50 opacity-60'
                              : 'border-slate-200 bg-slate-50 opacity-60'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors ${
                              selecionada
                                ? 'bg-emerald-500 border-emerald-500 text-white'
                                : darkMode ? 'border-slate-500' : 'border-slate-300'
                            }`}>
                              {selecionada && (
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className={`text-xs font-bold mb-0.5 ${
                                selecionada ? 'text-emerald-600' : darkMode ? 'text-slate-400' : 'text-slate-500'
                              }`}>Questão {q.numero}</p>
                              <p className={`text-sm line-clamp-2 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                                {q.enunciado}
                              </p>
                              {q.gabarito && (
                                <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                                  darkMode ? 'bg-slate-600 text-slate-300' : 'bg-slate-200 text-slate-600'
                                }`}>Gabarito: {q.gabarito}</span>
                              )}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Info Box */}
          {fonte === 'ia' && (
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-indigo-900/30 border border-indigo-700' : 'bg-indigo-50 border border-indigo-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">🤖</span>
                <span className={`text-sm font-semibold ${darkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>Geração com IA</span>
              </div>
              <p className={`text-xs ${darkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
                As questões serão geradas automaticamente pela IA com base na matéria e descrição. 
                Você poderá revisar, editar e adicionar questões antes de enviar para os alunos.
              </p>
            </div>
          )}

          {fonte === 'material' && materialSelecionado && questoesSelecionadas.size > 0 && (
            <div className={`p-4 rounded-xl ${darkMode ? 'bg-emerald-900/30 border border-emerald-700' : 'bg-emerald-50 border border-emerald-200'}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">📄</span>
                <span className={`text-sm font-semibold ${darkMode ? 'text-emerald-300' : 'text-emerald-700'}`}>
                  {questoesSelecionadas.size} questões do material
                </span>
              </div>
              <p className={`text-xs ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                As questões selecionadas serão importadas do material. Você poderá revisar e editar antes de enviar.
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                darkMode ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={salvando || (fonte === 'material' && (!materialSelecionado || questoesSelecionadas.size === 0))}
              className={`flex-1 py-3 font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                fonte === 'material'
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              {salvando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  {fonte === 'material' ? 'Criando...' : 'Gerando com IA...'}
                </>
              ) : fonte === 'material' ? (
                <>
                  <span>📄</span>
                  Criar com Material
                </>
              ) : (
                <>
                  <span>🤖</span>
                  Gerar Atividade com IA
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
