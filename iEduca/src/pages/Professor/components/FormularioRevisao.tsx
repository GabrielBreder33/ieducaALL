import type { CompetenciaRevisaoItem, ProfessorRedacaoRevisao, RedacaoDetalhada } from '../../../services/professorService';

const COMPETENCIA_NOMES = [
  'Domínio da Norma Culta',
  'Compreensão da Proposta',
  'Seleção e Organização',
  'Conhecimento dos Mecanismos Linguísticos',
  'Proposta de Intervenção',
];

interface Props {
  darkMode: boolean;
  redacao: RedacaoDetalhada;
  revisaoExistente: ProfessorRedacaoRevisao | null;
  competencias: CompetenciaRevisaoItem[];
  notaTotal: number;
  comentarioGeral: string;
  salvando: boolean;
  onCompetenciaChange: (numero: number, field: 'notaProfessor' | 'comentarioProfessor', value: number | string) => void;
  onComentarioGeralChange: (valor: string) => void;
  onSalvar: () => void;
}

export default function FormularioRevisao({
  darkMode, redacao, revisaoExistente, competencias, notaTotal, comentarioGeral, salvando,
  onCompetenciaChange, onComentarioGeralChange, onSalvar,
}: Props) {
  return (
    <div className={`rounded-2xl shadow-lg overflow-hidden border-2 ${
      darkMode ? 'bg-slate-800 border-indigo-500/30' : 'bg-white border-indigo-200'
    }`}>
      <div className={`px-5 py-4 border-b ${darkMode ? 'border-slate-700 bg-indigo-900/20' : 'border-indigo-100 bg-indigo-50/50'}`}>
        <h3 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
          {revisaoExistente ? 'Editar Revisão' : 'Sua Revisão'}
        </h3>
      </div>
      <div className="p-5 space-y-4">
        {competencias.map(comp => (
          <div key={comp.numeroCompetencia} className={`p-4 rounded-xl ${
            darkMode ? 'bg-slate-900' : 'bg-slate-50 border border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row justify-between gap-3">
              <div className="flex-1">
                <label className={`text-sm font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  C{comp.numeroCompetencia}: {COMPETENCIA_NOMES[comp.numeroCompetencia - 1]}
                </label>
                <div className={`text-xs mt-1 ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
                  Nota IA: {redacao.competencias?.find(c => c.numeroCompetencia === comp.numeroCompetencia)?.nota ?? 'N/A'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={200}
                  step={20}
                  value={comp.notaProfessor}
                  onChange={e => onCompetenciaChange(comp.numeroCompetencia, 'notaProfessor', Number(e.target.value))}
                  className={`w-24 px-3 py-2 rounded-lg border-2 text-center font-bold focus:outline-none ${
                    darkMode ? 'bg-slate-800 border-slate-600 text-white focus:border-indigo-500' : 'bg-white border-slate-300 text-slate-900 focus:border-indigo-500'
                  }`}
                />
                <span className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>/200</span>
              </div>
            </div>
            <textarea
              value={comp.comentarioProfessor || ''}
              onChange={e => onCompetenciaChange(comp.numeroCompetencia, 'comentarioProfessor', e.target.value)}
              placeholder="Comentário sobre esta competência..."
              rows={2}
              className={`w-full mt-3 px-3 py-2 rounded-lg border-2 text-sm resize-none focus:outline-none ${
                darkMode ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-600 focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500'
              }`}
            />
          </div>
        ))}

        <div className={`p-4 rounded-xl flex justify-between items-center ${
          darkMode ? 'bg-indigo-900/30' : 'bg-indigo-100'
        }`}>
          <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Nota Total do Professor
          </span>
          <span className="text-2xl font-bold text-indigo-500">{notaTotal}</span>
        </div>

        <div>
          <label className={`block text-sm font-medium mb-1 ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            Comentário Geral
          </label>
          <textarea
            value={comentarioGeral}
            onChange={e => onComentarioGeralChange(e.target.value)}
            rows={3}
            placeholder="Observações gerais sobre a redação do aluno..."
            className={`w-full px-4 py-3 rounded-xl border-2 text-sm resize-none focus:outline-none ${
              darkMode ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-600 focus:border-indigo-500' : 'bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-indigo-500'
            }`}
          />
        </div>

        <button
          onClick={onSalvar}
          disabled={salvando}
          className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : revisaoExistente ? 'Atualizar Revisão' : 'Salvar Revisão'}
        </button>
      </div>
    </div>
  );
}
