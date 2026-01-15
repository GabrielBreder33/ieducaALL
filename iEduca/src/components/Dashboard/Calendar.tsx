import { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import { atividadeService } from '../../services/atividadeService';

interface CalendarDay {
  day: number;
  atividadesCount: number;
  atividades: {
    id: number;
    nota: number;
    status: string;
    hora: string;
  }[];
  isToday: boolean;
  isCurrentMonth: boolean;
}

interface CalendarProps {
  darkMode?: boolean;
  userId?: number; // ID do usuário para visualizar o calendário
}

export default function Calendar({ darkMode = true, userId }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  
  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  useEffect(() => {
    loadCalendarData();
  }, [currentDate, userId]);

  const loadCalendarData = async () => {
    try {
      // Se userId foi passado, usar ele; caso contrário, pegar do usuário logado
      let userIdToUse = userId;
      if (!userIdToUse) {
        const user = authService.getCurrentUser();
        if (!user) return;
        userIdToUse = user.id;
      }

      // Buscar histórico de atividades
      const historico = await atividadeService.getHistoricoUsuario(userIdToUse);
      
      // Gerar dias do calendário
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startDayOfWeek = firstDay.getDay(); // 0 = Domingo
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const days: CalendarDay[] = [];
      
      // Dias do mês anterior (para completar a primeira semana)
      const prevMonthLastDay = new Date(year, month, 0).getDate();
      for (let i = startDayOfWeek - 1; i >= 0; i--) {
        days.push({
          day: prevMonthLastDay - i,
          atividadesCount: 0,
          atividades: [],
          isToday: false,
          isCurrentMonth: false
        });
      }

      // Dias do mês atual
      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        date.setHours(0, 0, 0, 0);
        
        // Filtrar atividades deste dia
        const atividadesDoDia = historico.filter(atividade => {
          const atividadeDate = new Date(atividade.dataFim || atividade.dataInicio);
          atividadeDate.setHours(0, 0, 0, 0);
          return atividadeDate.getTime() === date.getTime();
        });

        days.push({
          day,
          atividadesCount: atividadesDoDia.length,
          atividades: atividadesDoDia.map(a => ({
            id: a.id,
            nota: a.nota || 0,
            status: a.status,
            hora: new Date(a.dataFim || a.dataInicio).toLocaleTimeString('pt-BR', { 
              hour: '2-digit', 
              minute: '2-digit' 
            })
          })),
          isToday: date.getTime() === today.getTime(),
          isCurrentMonth: true
        });
      }

      // Dias do próximo mês (para completar a última semana)
      const remainingDays = 42 - days.length; // 6 semanas x 7 dias
      for (let day = 1; day <= remainingDays; day++) {
        days.push({
          day,
          atividadesCount: 0,
          atividades: [],
          isToday: false,
          isCurrentMonth: false
        });
      }

      setCalendarDays(days);
    } catch (error) {
      console.error('Erro ao carregar dados do calendário:', error);
    } finally {
      setLoading(false);
    }
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };


  const getDayColor = (atividadesCount: number, isCurrentMonth: boolean) => {
    if (!isCurrentMonth) {
      return darkMode ? 'bg-slate-800/20 text-slate-600' : 'bg-slate-50 text-slate-400';
    }
    
    if (atividadesCount === 0) {
      return darkMode 
        ? 'bg-slate-700/30 text-slate-400 hover:bg-slate-700/50' 
        : 'bg-slate-100 text-slate-600 hover:bg-slate-200';
    }
    
    // Gradiente de cores baseado na quantidade de atividades
    if (atividadesCount === 1) {
      return darkMode
        ? 'bg-emerald-500/30 text-emerald-200 border-emerald-500/50 hover:bg-emerald-500/40'
        : 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200';
    } else if (atividadesCount === 2) {
      return darkMode
        ? 'bg-emerald-500/50 text-emerald-100 border-emerald-500/70 hover:bg-emerald-500/60'
        : 'bg-emerald-200 text-emerald-800 border-emerald-400 hover:bg-emerald-300';
    } else if (atividadesCount >= 3) {
      return darkMode
        ? 'bg-emerald-500 text-white border-emerald-400 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20'
        : 'bg-emerald-500 text-white border-emerald-600 hover:bg-emerald-600 shadow-lg shadow-emerald-500/30';
    }
    
    return '';
  };

  const getStreakInfo = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    
    const sortedDays = [...calendarDays]
      .filter(d => d.isCurrentMonth)
      .sort((a, b) => b.day - a.day);

    for (const day of sortedDays) {
      if (day.atividadesCount > 0) {
        tempStreak++;
        if (tempStreak > maxStreak) maxStreak = tempStreak;
      } else {
        if (currentStreak === 0) currentStreak = tempStreak;
        tempStreak = 0;
      }
    }

    return { currentStreak: currentStreak || tempStreak, maxStreak };
  };

  const streak = getStreakInfo();

  return (
    <div className={`rounded-2xl p-6 backdrop-blur-sm border transition-colors ${
      darkMode 
        ? 'bg-slate-800/50 border-slate-700/50' 
        : 'bg-white border-slate-200 shadow-lg'
    }`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className={`text-xl font-bold ${
            darkMode ? 'text-slate-100' : 'text-slate-800'
          }`}>
            📅 Meu Progresso
          </h3>
          <p className={`text-sm mt-1 ${
            darkMode ? 'text-slate-400' : 'text-slate-600'
          }`}>
            {calendarDays.filter(d => d.isCurrentMonth && d.atividadesCount > 0).length} dias de estudo este mês
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => changeMonth('prev')}
            className={`p-2 rounded-lg border transition-colors ${
              darkMode
                ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            ◀
          </button>
          <button 
            onClick={goToToday}
            className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
              darkMode
                ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            Hoje
          </button>
          <button 
            onClick={() => changeMonth('next')}
            className={`p-2 rounded-lg border transition-colors ${
              darkMode
                ? 'bg-slate-700 text-slate-300 border-slate-600 hover:bg-slate-600'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            ▶
          </button>
        </div>
      </div>

      {/* Mês/Ano */}
      <div className={`text-center mb-4 text-lg font-bold ${
        darkMode ? 'text-slate-200' : 'text-slate-800'
      }`}>
        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
        </div>
      ) : (
        <>
          {/* Dias da semana */}
          <div className="grid grid-cols-7 gap-2 mb-3">
            {daysOfWeek.map((day) => (
              <div key={day} className={`text-center text-xs font-bold ${
                darkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>
                {day}
              </div>
            ))}
          </div>

          {/* Grade do calendário */}
          <div className="grid grid-cols-7 gap-2 relative">
            {calendarDays.map((item, index) => (
              <div key={index} className="relative">
                <button
                  onMouseEnter={() => item.isCurrentMonth && setHoveredDay(index)}
                  onMouseLeave={() => setHoveredDay(null)}
                  className={`
                    w-full aspect-square rounded-lg flex flex-col items-center justify-center
                    text-sm font-semibold transition-all border
                    ${getDayColor(item.atividadesCount, item.isCurrentMonth)}
                    ${item.isToday ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-slate-800' : 'border-transparent'}
                    ${item.isCurrentMonth ? 'hover:scale-110' : 'cursor-default'}
                  `}
                >
                  <span>{item.day}</span>
                  {item.atividadesCount > 0 && (
                    <span className="text-[10px] mt-0.5 opacity-80">
                      {item.atividadesCount} {item.atividadesCount === 1 ? 'ativ' : 'ativs'}
                    </span>
                  )}
                </button>

                {/* Tooltip */}
                {hoveredDay === index && item.atividades.length > 0 && (
                  <div 
                    className={`absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 p-3 rounded-lg shadow-xl border min-w-[200px] ${
                      darkMode 
                        ? 'bg-slate-700 border-slate-600 text-slate-100' 
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    <div className="font-bold mb-2 text-emerald-400">
                      {item.day} de {monthNames[currentDate.getMonth()]}
                    </div>
                    <div className="space-y-2">
                      {item.atividades.map((atividade, i) => (
                        <div key={i} className={`text-xs p-2 rounded border ${
                          darkMode ? 'bg-slate-600/50 border-slate-500' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Atividade #{atividade.id}</span>
                            <span className={`font-bold ${
                              atividade.nota >= 7 ? 'text-green-400' : 
                              atividade.nota >= 5 ? 'text-yellow-400' : 'text-red-400'
                            }`}>
                              {atividade.nota.toFixed(1)}
                            </span>
                          </div>
                          <div className={`text-[10px] mt-1 ${
                            darkMode ? 'text-slate-400' : 'text-slate-600'
                          }`}>
                            {atividade.hora} • {atividade.status}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Estatísticas e Legenda */}
          <div className="mt-6 space-y-4">
            {/* Sequências */}
            <div className="grid grid-cols-2 gap-3">
              <div className={`p-3 rounded-xl border ${
                darkMode ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`text-xs mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  🔥 Sequência Atual
                </div>
                <div className={`text-2xl font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                  {streak.currentStreak} {streak.currentStreak === 1 ? 'dia' : 'dias'}
                </div>
              </div>
              <div className={`p-3 rounded-xl border ${
                darkMode ? 'bg-slate-700/30 border-slate-600' : 'bg-slate-50 border-slate-200'
              }`}>
                <div className={`text-xs mb-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                  🏆 Melhor Sequência
                </div>
                <div className={`text-2xl font-bold ${darkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
                  {streak.maxStreak} {streak.maxStreak === 1 ? 'dia' : 'dias'}
                </div>
              </div>
            </div>

            {/* Legenda */}
            <div className={`pt-4 border-t ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
              <div className="flex items-center justify-between text-xs">
                <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
                  Menos atividades
                </span>
                <div className="flex gap-1.5">
                  <div className={`w-5 h-5 rounded ${darkMode ? 'bg-slate-700/30' : 'bg-slate-100'}`}></div>
                  <div className={`w-5 h-5 rounded ${darkMode ? 'bg-emerald-500/30' : 'bg-emerald-100'}`}></div>
                  <div className={`w-5 h-5 rounded ${darkMode ? 'bg-emerald-500/50' : 'bg-emerald-200'}`}></div>
                  <div className={`w-5 h-5 rounded ${darkMode ? 'bg-emerald-500' : 'bg-emerald-500'}`}></div>
                </div>
                <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>
                  Mais atividades
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
