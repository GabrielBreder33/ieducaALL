import { useState, useEffect } from 'react';
import { authService } from '../../services/authService';
import { atividadeService } from '../../services/atividadeService';

interface CalendarDay {
  day: number;
  atividadesCount: number;
  atividades: {
    id: number;
    tipo: string;
    materia: string;
    tema: string;
    nota: number;
    notaOriginal?: number;
    status: string;
    hora: string;
  }[];
  isToday: boolean;
  isCurrentMonth: boolean;
}

interface CalendarProps {
  darkMode?: boolean;
  userId?: number; 
  atividadesRealizadas?: Array<{ 
    data: string; 
    tipo: string;
    subtipo?: string;
    materia?: string;
    tema?: string;
    nota: number;
    notaOriginal?: number;
    id?: number;
  }>;  
}

export default function Calendar({ darkMode = true, userId, atividadesRealizadas }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);
  
  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

  useEffect(() => {
    loadCalendarData();
  }, [currentDate, userId, atividadesRealizadas]);  
  const loadCalendarData = async () => {
    try {
      let historicoParaUsar: any[] = [];
      
      if (atividadesRealizadas && atividadesRealizadas.length > 0) {
        historicoParaUsar = atividadesRealizadas.map(a => ({
          dataInicio: a.data,
          dataFim: a.data,
          nota: a.nota,
          notaOriginal: a.notaOriginal,
          tipo: a.tipo || 'atividade',
          materia: a.materia || 'Geral',
          tema: a.tema || 'Sem tema',
          status: 'Concluída',
          id: a.id || 0
        }));
      } else {
        let userIdToUse = userId;
        if (!userIdToUse) {
          const user = authService.getCurrentUser();
          if (!user) return;
          userIdToUse = user.id;
        }

        if (userIdToUse) {
          historicoParaUsar = await atividadeService.getHistoricoUsuario(userIdToUse);
        }
      }
      
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startDayOfWeek = firstDay.getDay(); 
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const days: CalendarDay[] = [];
      
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

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        date.setHours(0, 0, 0, 0);
        
        const atividadesDoDia = historicoParaUsar.filter(atividade => {
          const atividadeDate = new Date(atividade.dataFim || atividade.dataInicio);
          atividadeDate.setHours(0, 0, 0, 0);
          return atividadeDate.getTime() === date.getTime();
        });

        days.push({
          day,
          atividadesCount: atividadesDoDia.length,
          atividades: atividadesDoDia.map(a => ({
            id: a.id,
            tipo: a.tipo || 'atividade',
            materia: a.materia || 'Geral',
            tema: a.tema || 'Sem tema',
            nota: a.nota || 0,
            notaOriginal: a.notaOriginal,
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

      const remainingDays = 42 - days.length;  
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
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDay = today.getDate();
    
    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;
    
    const todayHasActivity = calendarDays.find(d => 
      d.day === currentDay && 
      d.isCurrentMonth && 
      d.atividadesCount > 0
    );
    
    if (!todayHasActivity) {
      const sortedDays = [...calendarDays]
        .filter(d => d.isCurrentMonth)
        .sort((a, b) => a.day - b.day);  
      
      for (const day of sortedDays) {
        if (day.atividadesCount > 0) {
          tempStreak++;
          if (tempStreak > maxStreak) maxStreak = tempStreak;
        } else {
          tempStreak = 0;
        }
      }
      
      return { currentStreak: 0, maxStreak };
    }
    
    for (let i = currentDay; i >= 1; i--) {
      const dayData = calendarDays.find(d => d.day === i && d.isCurrentMonth);
      
      if (dayData && dayData.atividadesCount > 0) {
        currentStreak++;
      } else {
        break;  
      }
    }
    
    const sortedDays = [...calendarDays]
      .filter(d => d.isCurrentMonth)
      .sort((a, b) => a.day - b.day);  
    
    for (const day of sortedDays) {
      if (day.atividadesCount > 0) {
        tempStreak++;
        if (tempStreak > maxStreak) maxStreak = tempStreak;
      } else {
        tempStreak = 0;
      }
    }

    return { currentStreak, maxStreak };
  };

  const streak = getStreakInfo();

  return (
    <div className={`rounded-2xl p-6 backdrop-blur-sm border transition-colors ${
      darkMode 
        ? 'bg-slate-800/50 border-slate-700/50' 
        : 'bg-white border-slate-200 shadow-lg'
    }`}>
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
          <div className="grid grid-cols-7 gap-2 mb-3">
            {daysOfWeek.map((day) => (
              <div key={day} className={`text-center text-xs font-bold ${
                darkMode ? 'text-slate-400' : 'text-slate-600'
              }`}>
                {day}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2 relative">
            {calendarDays.map((item, index) => (
              <div
                key={index}
                className="relative"
                onMouseEnter={() => item.isCurrentMonth && setHoveredDay(index)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                <button
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
                    <div className="space-y-2 max-h-44 overflow-y-auto pr-2">
                      {item.atividades.map((atividade, i) => (
                        <div key={i} className={`text-xs p-2 rounded border ${
                          darkMode ? 'bg-slate-600/50 border-slate-500' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div className="flex justify-between items-center mb-1">
                            <span className="font-medium">
                              {atividade.tipo === 'redacao' ? '✍️ Redação' : '📚 Atividade'}
                            </span>
                            <span className={`font-bold ${
                              atividade.tipo === 'redacao' 
                                ? (atividade.notaOriginal && atividade.notaOriginal >= 700 ? 'text-green-400' : 
                                   atividade.notaOriginal && atividade.notaOriginal >= 500 ? 'text-yellow-400' : 'text-red-400')
                                : (atividade.nota >= 7 ? 'text-green-400' : 
                                   atividade.nota >= 5 ? 'text-yellow-400' : 'text-red-400')
                            }`}>
                              {atividade.tipo === 'redacao' && atividade.notaOriginal
                                ? `${atividade.notaOriginal.toFixed(0)}/1000`
                                : `${atividade.nota.toFixed(1)}/10`
                              }
                            </span>
                          </div>
                          <div className={`font-medium mb-1 ${
                            darkMode ? 'text-slate-300' : 'text-slate-700'
                          }`}>
                            {atividade.materia}
                          </div>
                          <div className={`text-[10px] mb-1 ${
                            darkMode ? 'text-slate-400' : 'text-slate-600'
                          }`}>
                            {atividade.tema}
                          </div>
                          <div className={`text-[10px] ${
                            darkMode ? 'text-slate-500' : 'text-slate-500'
                          }`}>
                            {atividade.hora}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-4">
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
