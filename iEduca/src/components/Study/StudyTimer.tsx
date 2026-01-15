interface StudyTimerProps {
  studyTheme: string;
  timeRemaining: number;
  isRunning: boolean;
  onPauseResume: () => void;
  onCancel: () => void;
}

export default function StudyTimer({
  studyTheme,
  timeRemaining,
  isRunning,
  onPauseResume,
  onCancel
}: StudyTimerProps) {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] p-5">
      <div className="bg-slate-800 rounded-2xl p-10 text-center shadow-2xl max-w-lg w-full">
        <div className="text-lg text-slate-400 mb-2 uppercase tracking-widest font-semibold">
          📚 Estudando
        </div>
        
        <div className="text-3xl font-bold text-emerald-400 mb-6">
          {studyTheme}
        </div>
        
        <div className="text-7xl font-bold text-slate-100 my-8 tracking-wider tabular-nums">
          ⏳ {formatTime(timeRemaining)}
        </div>
        
        <div className="text-slate-400 mb-8">
          Tempo restante
        </div>
        
        <div className="flex gap-4">
          <button
            onClick={onPauseResume}
            className={`flex-1 py-4 rounded-xl text-base font-semibold transition-all ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-600 text-white'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white'
            }`}
          >
            {isRunning ? '⏸️ Pausar' : '▶️ Continuar'}
          </button>
          
          <button
            onClick={onCancel}
            className="flex-1 py-4 bg-red-500 hover:bg-red-600 text-white rounded-xl text-base font-semibold transition-all"
          >
            ❌ Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
