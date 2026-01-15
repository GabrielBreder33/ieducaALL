import { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import { atividadeService, EstatisticasUsuario } from '../../services/atividadeService';

interface ProgressItem {
  subject: string;
  chapter: string;
  progress: number;
  color: string;
}

interface ProgressCardsProps {
  darkMode?: boolean;
}

export default function ProgressCards({ darkMode = true }: ProgressCardsProps) {
  const [estatisticas, setEstatisticas] = useState<EstatisticasUsuario | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEstatisticas();
  }, []);

  const loadEstatisticas = async () => {
    try {
      const user = authService.getCurrentUser();
      if (!user || !user.id) return;

      const stats = await atividadeService.getEstatisticasUsuario(user.id);
      setEstatisticas(stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${minutes}min`;
    return `${minutes}min`;
  };

  const progressData: ProgressItem[] = estatisticas ? [
    { 
      subject: 'Total de Atividades', 
      chapter: `${estatisticas.totalAtividades || 0} concluídas`, 
      progress: 100, 
      color: 'from-purple-500 to-pink-500' 
    },
    { 
      subject: 'Total de Acertos', 
      chapter: `${estatisticas.acertos || 0} questões`, 
      progress: Math.min((estatisticas.acertos / 10) * 100, 100), 
      color: 'from-orange-500 to-red-500' 
    },
    { 
      subject: 'Média de Notas', 
      chapter: `${(estatisticas.mediaNotas || 0).toFixed(1)}/10`, 
      progress: ((estatisticas.mediaNotas || 0) / 10) * 100, 
      color: 'from-cyan-500 to-blue-500' 
    },
    { 
      subject: 'Tempo de Estudo', 
      chapter: formatTime(estatisticas.tempoTotalSegundos || 0), 
      progress: Math.min(((estatisticas.tempoTotalSegundos || 0) / 36000) * 100, 100), 
      color: 'from-emerald-500 to-teal-500' 
    },
  ] : [
    { subject: 'Total de Atividades', chapter: '0 concluídas', progress: 0, color: 'from-purple-500 to-pink-500' },
    { subject: 'Total de Acertos', chapter: '0 questões', progress: 0, color: 'from-orange-500 to-red-500' },
    { subject: 'Média de Notas', chapter: '0/10', progress: 0, color: 'from-cyan-500 to-blue-500' },
    { subject: 'Tempo de Estudo', chapter: '0min', progress: 0, color: 'from-emerald-500 to-teal-500' },
  ];

  return (
    <div className={`rounded-2xl p-6 backdrop-blur-sm border transition-colors ${
      darkMode
        ? 'bg-slate-800/50 border-slate-700/50'
        : 'bg-white border-slate-200 shadow-lg'
    }`}>
      <div className="flex justify-between items-center mb-6">
        <h3 className={`text-xl font-bold ${
          darkMode ? 'text-slate-100' : 'text-slate-800'
        }`}>Estatísticas de Progresso</h3>
        <button 
          onClick={loadEstatisticas}
          className={`px-3 py-1 rounded-lg text-sm border transition-colors ${
            darkMode
              ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
          }`}
        >
          {loading ? '🔄' : '↻'}
        </button>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-4">
        {progressData.map((item, index) => (
          <div key={index} className="group">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h4 className={`font-semibold ${
                  darkMode ? 'text-slate-100' : 'text-slate-800'
                }`}>{item.subject}</h4>
                <p className={`text-sm ${
                  darkMode ? 'text-slate-400' : 'text-slate-600'
                }`}>{item.chapter}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-bold text-lg ${
                  darkMode ? 'text-slate-100' : 'text-slate-800'
                }`}>{item.progress}%</span>
                <div className="relative w-12 h-12">
                  <svg className="transform -rotate-90 w-12 h-12">
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className={darkMode ? 'text-slate-700' : 'text-slate-200'}
                    />
                    <circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke="url(#gradient-${index})"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 20}`}
                      strokeDashoffset={`${2 * Math.PI * 20 * (1 - item.progress / 100)}`}
                      className="transition-all duration-500"
                    />
                    <defs>
                      <linearGradient id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" className={`bg-gradient-to-r ${item.color}`} stopColor="#a855f7" />
                        <stop offset="100%" className={`bg-gradient-to-r ${item.color}`} stopColor="#ec4899" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>
            </div>
            {index < progressData.length - 1 && (
              <div className={`h-px mt-4 ${
                darkMode ? 'bg-slate-700/50' : 'bg-slate-200'
              }`} />
            )}
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
