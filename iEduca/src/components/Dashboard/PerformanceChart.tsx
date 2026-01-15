import { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import { atividadeService } from '../../services/atividadeService';
import { AtividadeExecucao } from '../../services/atividadeService';

interface PerformanceChartProps {
  darkMode?: boolean;
}

interface DataPoint {
  x: number;
  y: number;
  data: string;
  nota: number;
  acertos: number;
  totalQuestoes: number;
}

export default function PerformanceChart({ darkMode = true }: PerformanceChartProps) {
  const [dataPoints, setDataPoints] = useState<DataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredPoint, setHoveredPoint] = useState<number | null>(null);
  const [stats, setStats] = useState({
    mediaNotas: 0,
    melhorNota: 0,
    piorNota: 0,
    tendencia: 'estável' as 'subindo' | 'descendo' | 'estável'
  });

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    try {
      const user = authService.getCurrentUser();
      if (!user) return;

      const historico = await atividadeService.getHistoricoUsuario(user.id);
      
      // Filtrar apenas atividades concluídas e pegar as últimas 10
      const atividadesConcluidas = historico
        .filter(h => h.status === 'Concluída' && h.nota !== undefined && h.nota !== null)
        .slice(0, 10)
        .reverse();

      if (atividadesConcluidas.length === 0) {
        setDataPoints([]);
        setLoading(false);
        return;
      }

      // Transformar em pontos do gráfico com informações completas
      const points: DataPoint[] = atividadesConcluidas.map((atividade, index) => ({
        x: index + 1,
        y: atividade.nota || 0,
        data: new Date(atividade.dataFim || atividade.dataInicio).toLocaleDateString('pt-BR'),
        nota: atividade.nota || 0,
        acertos: atividade.acertos,
        totalQuestoes: atividade.totalQuestoes
      }));

      setDataPoints(points);

      // Calcular estatísticas
      const notas = points.map(p => p.nota);
      const media = notas.reduce((a, b) => a + b, 0) / notas.length;
      const melhor = Math.max(...notas);
      const pior = Math.min(...notas);

      // Calcular tendência (média das últimas 3 vs média das primeiras 3)
      let tendencia: 'subindo' | 'descendo' | 'estável' = 'estável';
      if (points.length >= 4) {
        const primeiras3 = points.slice(0, 3).reduce((a, b) => a + b.nota, 0) / 3;
        const ultimas3 = points.slice(-3).reduce((a, b) => a + b.nota, 0) / 3;
        if (ultimas3 > primeiras3 + 0.5) tendencia = 'subindo';
        else if (ultimas3 < primeiras3 - 0.5) tendencia = 'descendo';
      }

      setStats({
        mediaNotas: media,
        melhorNota: melhor,
        piorNota: pior,
        tendencia
      });

    } catch (error) {
      console.error('Erro ao carregar dados de performance:', error);
      setDataPoints([]);
    } finally {
      setLoading(false);
    }
  };


  const maxY = 10; // Notas de 0 a 10
  const maxX = dataPoints.length > 0 ? Math.max(...dataPoints.map(p => p.x)) : 10;

  // Gerar path SVG suave (curva)
  const generateSmoothPath = () => {
    if (dataPoints.length === 0) return '';
    
    const points = dataPoints.map(point => ({
      x: (point.x / maxX) * 100,
      y: 100 - (point.y / maxY) * 100
    }));

    let path = `M ${points[0].x} ${points[0].y}`;
    
    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const controlX = (current.x + next.x) / 2;
      
      path += ` Q ${controlX} ${current.y}, ${controlX} ${(current.y + next.y) / 2}`;
      path += ` Q ${controlX} ${next.y}, ${next.x} ${next.y}`;
    }
    
    return path;
  };

  const getTendenciaIcon = () => {
    if (stats.tendencia === 'subindo') return '📈';
    if (stats.tendencia === 'descendo') return '📉';
    return '➡️';
  };

  const getTendenciaColor = () => {
    if (stats.tendencia === 'subindo') return darkMode ? 'text-green-400' : 'text-green-600';
    if (stats.tendencia === 'descendo') return darkMode ? 'text-red-400' : 'text-red-600';
    return darkMode ? 'text-yellow-400' : 'text-yellow-600';
  };

  return (
    <div className={`rounded-2xl p-6 backdrop-blur-sm border transition-colors ${
      darkMode
        ? 'bg-slate-800/50 border-slate-700/50'
        : 'bg-white border-slate-200 shadow-lg'
    }`}>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h3 className={`text-xl font-bold ${
            darkMode ? 'text-slate-100' : 'text-slate-800'
          }`}>
            📊 Evolução de Performance
          </h3>
          <p className={`text-sm mt-1 ${
            darkMode ? 'text-slate-400' : 'text-slate-600'
          }`}>
            Suas últimas {dataPoints.length} atividades concluídas
          </p>
        </div>
        <button 
          onClick={loadPerformanceData}
          disabled={loading}
          className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
            darkMode
              ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600 disabled:opacity-50'
              : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50 disabled:opacity-50'
          }`}
        >
          {loading ? '🔄' : '↻'} Atualizar
        </button>
      </div>

      {loading ? (
        <div className="h-80 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : dataPoints.length === 0 ? (
        <div className="h-80 flex flex-col items-center justify-center">
          <div className="text-6xl mb-4">📈</div>
          <p className={`text-center text-lg font-medium ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
            Nenhuma atividade concluída ainda
          </p>
          <p className={`text-center text-sm mt-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
            Complete suas primeiras atividades para ver seu<br />
            progresso de performance ao longo do tempo!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Estatísticas */}
          <div className="grid grid-cols-4 gap-4">
            <div className={`p-4 rounded-xl border ${
              darkMode ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`text-xs mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Média Geral
              </div>
              <div className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                {stats.mediaNotas.toFixed(1)}
              </div>
            </div>
            <div className={`p-4 rounded-xl border ${
              darkMode ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`text-xs mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Melhor Nota
              </div>
              <div className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                {stats.melhorNota.toFixed(1)}
              </div>
            </div>
            <div className={`p-4 rounded-xl border ${
              darkMode ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`text-xs mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Menor Nota
              </div>
              <div className={`text-2xl font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                {stats.piorNota.toFixed(1)}
              </div>
            </div>
            <div className={`p-4 rounded-xl border ${
              darkMode ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-50 border-slate-200'
            }`}>
              <div className={`text-xs mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Tendência
              </div>
              <div className={`text-2xl font-bold ${getTendenciaColor()}`}>
                {getTendenciaIcon()}
              </div>
            </div>
          </div>

          {/* Gráfico */}
          <div className="relative">
            <div className={`absolute -top-6 left-0 text-sm font-medium ${
              darkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Nota (0-10)
            </div>
            <div className="relative h-64 ml-8 mt-4">
              <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                {/* Grid lines com labels */}
                {[0, 2.5, 5, 7.5, 10].map((value) => {
                  const y = 100 - (value / maxY) * 100;
                  return (
                    <g key={value}>
                      <line 
                        x1="0" 
                        y1={y} 
                        x2="100" 
                        y2={y} 
                        stroke={darkMode ? '#334155' : '#e2e8f0'} 
                        strokeWidth="0.3"
                        strokeDasharray={value === 5 ? "0" : "2,2"}
                      />
                    </g>
                  );
                })}
                
                {/* Gradient fill */}
                <defs>
                  <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                
                {/* Fill area */}
                <path
                  d={`${generateSmoothPath()} L 100 100 L 0 100 Z`}
                  fill="url(#chartGradient)"
                />
                
                {/* Line */}
                <path
                  d={generateSmoothPath()}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  vectorEffect="non-scaling-stroke"
                />
                
                {/* Points com hover */}
                {dataPoints.map((point, i) => {
                  const x = (point.x / maxX) * 100;
                  const y = 100 - (point.y / maxY) * 100;
                  const isHovered = hoveredPoint === i;
                  return (
                    <g key={i}>
                      <circle
                        cx={x}
                        cy={y}
                        r={isHovered ? "4" : "3"}
                        fill="#fff"
                        stroke="#3b82f6"
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                        className="cursor-pointer transition-all"
                        onMouseEnter={() => setHoveredPoint(i)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    </g>
                  );
                })}
              </svg>
              
              {/* Y-axis labels */}
              <div className={`absolute left-0 top-0 h-full flex flex-col justify-between text-xs -ml-8 ${
                darkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>
                <span className="font-medium">10</span>
                <span>7.5</span>
                <span className="font-medium">5.0</span>
                <span>2.5</span>
                <span className="font-medium">0</span>
              </div>
              
              {/* Tooltip */}
              {hoveredPoint !== null && (
                <div 
                  className={`absolute rounded-lg p-3 shadow-xl border text-sm z-10 ${
                    darkMode 
                      ? 'bg-slate-700 border-slate-600 text-slate-100' 
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                  style={{
                    left: `${(dataPoints[hoveredPoint].x / maxX) * 100}%`,
                    top: `${100 - (dataPoints[hoveredPoint].y / maxY) * 100}%`,
                    transform: 'translate(-50%, -120%)'
                  }}
                >
                  <div className="font-bold text-blue-500 mb-1">
                    Atividade #{dataPoints[hoveredPoint].x}
                  </div>
                  <div className={`text-xs ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                    {dataPoints[hoveredPoint].data}
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-600">
                    <div className="font-bold text-lg">
                      Nota: {dataPoints[hoveredPoint].nota.toFixed(1)}
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      Acertos: {dataPoints[hoveredPoint].acertos}/{dataPoints[hoveredPoint].totalQuestoes}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* X-axis label */}
            <div className={`text-center mt-2 text-sm font-medium ${
              darkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              Atividades (mais antigas → mais recentes)
            </div>
          </div>

          {/* Legenda */}
          <div className={`flex items-center justify-center gap-6 pt-4 border-t ${
            darkMode ? 'border-slate-700' : 'border-slate-200'
          }`}>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Suas notas
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-0.5 bg-slate-400 opacity-50"></div>
              <span className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                Média: {stats.mediaNotas.toFixed(1)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
