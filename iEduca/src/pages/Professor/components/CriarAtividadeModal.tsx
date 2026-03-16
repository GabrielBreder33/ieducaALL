import type { CriarAtividadeProfessor } from '../../../services/professorService';
import type { Materia, AreaConhecimento } from '../../../services/conhecimentoService';
import type { User } from '../../../types';

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
  onFormChange: (updater: (prev: CriarAtividadeProfessor) => CriarAtividadeProfessor) => void;
  onAreaChange: (areaId: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function CriarAtividadeModal({
  darkMode, form, areas, materias, alunos, salvando,
  onFormChange, onAreaChange, onSubmit, onClose,
}: Props) {
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

        <form onSubmit={onSubmit} className="space-y-4">
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
          </div>

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
              disabled={salvando}
              className="flex-1 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {salvando ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Gerando com IA...
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
