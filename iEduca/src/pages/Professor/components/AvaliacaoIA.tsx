import type { RedacaoDetalhada } from '../../../services/professorService';

interface Props {
  redacao: RedacaoDetalhada;
  darkMode: boolean;
}

export default function AvaliacaoIA({ redacao, darkMode }: Props) {
  return (
    <>
      <div className={`rounded-2xl shadow-lg overflow-hidden ${darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'}`}>
        <div className={`px-5 py-4 border-b ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
          <h3 className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
            Avaliação da IA (Nota: {redacao.notaTotal})
          </h3>
        </div>
        <div className="p-5 space-y-2">
          {redacao.competencias?.map(c => (
            <div key={c.numeroCompetencia} className={`flex justify-between items-center p-3 rounded-lg ${
              darkMode ? 'bg-slate-900' : 'bg-slate-50'
            }`}>
              <span className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                C{c.numeroCompetencia}: {c.nomeCompetencia}
              </span>
              <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>{c.nota}</span>
            </div>
          ))}
        </div>
      </div>

      
    </>
  );
}
