import { Line, Doughnut } from 'react-chartjs-2';
import Calendar from '../../../components/Dashboard/Calendar';
import type { User } from '../../../types';

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

interface Props {
  darkMode: boolean;
  aluno: Aluno | null;
  estatisticas: Estatisticas | null;
  loading: boolean;
}

export default function EstatisticasAluno({ darkMode, aluno, estatisticas, loading }: Props) {
  if (!aluno) {
    return (
      <div className={`rounded-2xl sm:rounded-3xl p-8 sm:p-12 shadow-2xl text-center transition-colors ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        <svg className={`w-24 h-24 mx-auto mb-4 transition-colors ${
          darkMode ? 'text-slate-600' : 'text-slate-300'
        }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        <h3 className={`text-lg sm:text-xl font-semibold mb-2 transition-colors ${
          darkMode ? 'text-slate-400' : 'text-slate-600'
        }`}>
          Selecione um Aluno
        </h3>
        <p className={`transition-colors ${darkMode ? 'text-slate-500' : 'text-slate-500'}`}>
          Escolha um aluno da lista para visualizar seu desempenho
        </p>
      </div>
    );
  }
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

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header do Aluno */}
      <div className={`rounded-2xl p-4 sm:p-6 transition-colors ${
        darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
      }`}>
        <h4 className={`text-lg sm:text-xl font-bold mb-1 transition-colors ${
          darkMode ? 'text-white' : 'text-slate-900'
        }`}>{aluno.nome}</h4>
        <p className={`text-sm transition-colors ${
          darkMode ? 'text-slate-400' : 'text-slate-600'
        }`}>{aluno.email}</p>
      </div>

      {loading ? (
        <p className={`text-center py-8 transition-colors ${
          darkMode ? 'text-slate-400' : 'text-slate-600'
        }`}>Carregando estatísticas...</p>
      ) : estatisticas && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            <div className={`rounded-2xl p-5 shadow-xl transition-colors ${
              darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
            }`}>
              <p className={`text-sm mb-1 transition-colors ${
                darkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>Atividades</p>
              <p className="text-3xl sm:text-4xl font-bold text-indigo-400">{estatisticas.totalAtividades}</p>
            </div>
            <div className={`rounded-2xl p-4 sm:p-5 shadow-xl transition-colors ${
              darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
            }`}>
              <p className={`text-xs sm:text-sm mb-1 transition-colors ${
                darkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>Média de Notas</p>
              <p className="text-3xl sm:text-4xl font-bold text-purple-400">{estatisticas.mediaNotas.toFixed(1)}%</p>
            </div>
            <div className={`rounded-2xl p-4 sm:p-5 shadow-xl transition-colors ${
              darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
            }`}>
              <p className={`text-xs sm:text-sm mb-1 transition-colors ${
                darkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>Tempo Total</p>
              <p className="text-3xl sm:text-4xl font-bold text-blue-400">
                {((estatisticas.tempoTotalSegundos || 0) / 3600).toFixed(1)}h
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className={`rounded-2xl p-4 sm:p-5 shadow-2xl transition-colors ${
              darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
            }`}>
              <h5 className={`text-sm sm:text-base font-bold mb-3 transition-colors ${
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

            <div className={`rounded-2xl p-4 sm:p-5 shadow-2xl transition-colors ${
              darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
            }`}>
              <h5 className={`text-sm sm:text-base font-bold mb-3 transition-colors ${
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

          <div className={`rounded-2xl p-4 sm:p-5 shadow-2xl transition-colors ${
            darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
          }`}>
            <h5 className={`text-sm sm:text-base font-bold mb-3 transition-colors ${
              darkMode ? 'text-white' : 'text-slate-900'
            }`}>Calendário de Frequência</h5>
            <Calendar darkMode={darkMode} userId={aluno.id} />
          </div>

          {estatisticas.ultimasAtividades && estatisticas.ultimasAtividades.length > 0 && (
            <div className={`rounded-2xl p-4 sm:p-5 transition-colors ${
              darkMode ? 'bg-slate-800' : 'bg-white border border-slate-200'
            }`}>
              <h5 className={`text-sm sm:text-base font-bold mb-3 transition-colors ${
                darkMode ? 'text-white' : 'text-slate-900'
              }`}>Últimas Atividades</h5>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b transition-colors ${
                      darkMode ? 'border-slate-600' : 'border-slate-300'
                    }`}>
                      <th className={`px-4 py-2 text-left text-sm transition-colors ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Data</th>
                      <th className={`px-4 py-2 text-left text-sm transition-colors ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Nota</th>
                      <th className={`px-4 py-2 text-left text-sm transition-colors ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Acertos</th>
                      <th className={`px-4 py-2 text-left text-sm transition-colors ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Erros</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estatisticas.ultimasAtividades.slice(-5).reverse().map((ativ, idx) => (
                      <tr key={idx} className={`border-b transition-colors ${
                        darkMode ? 'border-slate-600' : 'border-slate-300'
                      }`}>
                        <td className={`px-4 py-3 text-sm transition-colors ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                          {new Date(ativ.data).toLocaleDateString('pt-BR')}
                        </td>
                        <td className={`px-4 py-3 text-sm font-semibold ${ativ.nota >= 70 ? 'text-green-500' : 'text-red-500'}`}>
                          {ativ.nota.toFixed(0)}%
                        </td>
                        <td className={`px-4 py-3 text-sm ${darkMode ? 'text-green-400' : 'text-green-600'}`}>{ativ.acertos}</td>
                        <td className={`px-4 py-3 text-sm ${darkMode ? 'text-red-400' : 'text-red-600'}`}>{ativ.erros}</td>
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
  );
}
