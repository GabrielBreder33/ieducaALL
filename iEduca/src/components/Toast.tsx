import { useEffect } from 'react';

interface ToastProps {
  message: string;
  score: number;
  total: number;
  onClose: () => void;
  duration?: number;
}

export default function Toast({ message, score, total, onClose, duration = 5000 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const percentage = Math.round((score / total) * 100);
  const isGoodScore = percentage >= 70;
  const isAverageScore = percentage >= 50 && percentage < 70;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-in-right">
      <div className="bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-6 max-w-md min-w-[320px]">
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center text-2xl ${
            isGoodScore 
              ? 'bg-emerald-500/20 text-emerald-400' 
              : isAverageScore 
              ? 'bg-amber-500/20 text-amber-400'
              : 'bg-red-500/20 text-red-400'
          }`}>
            {isGoodScore ? '🎉' : isAverageScore ? '👍' : '📚'}
          </div>

          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-100 mb-1">
              {isGoodScore ? 'Excelente!' : isAverageScore ? 'Bom trabalho!' : 'Continue praticando!'}
            </h3>
            <p className="text-slate-300 text-sm mb-3">
              {message}
            </p>

            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    isGoodScore 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                      : isAverageScore 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500'
                      : 'bg-gradient-to-r from-red-500 to-pink-500'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-slate-100 font-bold text-sm whitespace-nowrap">
                {score}/{total}
              </span>
            </div>

            <p className={`text-xs font-semibold mt-2 ${
              isGoodScore 
                ? 'text-emerald-400' 
                : isAverageScore 
                ? 'text-amber-400'
                : 'text-red-400'
            }`}>
              {percentage}% de acerto
            </p>
          </div>

          <button
            onClick={onClose}
            className="flex-shrink-0 text-slate-400 hover:text-slate-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
