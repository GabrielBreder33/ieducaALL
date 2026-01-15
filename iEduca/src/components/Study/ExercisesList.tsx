interface Exercise {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  userAnswer?: number;
}

interface ExercisesListProps {
  studyTheme: string;
  schoolGrade: string;
  exercises: Exercise[];
  currentExercise: number;
  onAnswer: (index: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export default function ExercisesList({
  studyTheme,
  schoolGrade,
  exercises,
  currentExercise,
  onAnswer,
  onPrevious,
  onNext,
  onSubmit
}: ExercisesListProps) {
  if (exercises.length === 0) return null;

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-80px)] p-5">
      <div className="bg-slate-800 rounded-2xl p-8 shadow-2xl max-w-2xl w-full">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-slate-100">
              📝 Exercícios - {studyTheme}
            </h2>
            <span className="text-slate-400 font-medium">
              {currentExercise + 1} / {exercises.length}
            </span>
          </div>
          <div className="text-sm text-slate-400">
            Nível: {schoolGrade}
          </div>
        </div>

        <div className="mb-6">
          <div className="bg-slate-700 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-slate-100 mb-4">
              {exercises[currentExercise].question}
            </h3>
          </div>

          <div className="space-y-3">
            {exercises[currentExercise].options.map((option, index) => (
              <button
                key={index}
                onClick={() => onAnswer(index)}
                className={`w-full text-left px-6 py-4 rounded-lg font-medium transition-all ${
                  exercises[currentExercise].userAnswer === index
                    ? 'bg-emerald-500 text-white shadow-lg'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onPrevious}
            disabled={currentExercise === 0}
            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
              currentExercise === 0
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-slate-700 text-slate-100 hover:bg-slate-600'
            }`}
          >
            ← Anterior
          </button>

          {currentExercise < exercises.length - 1 ? (
            <button
              onClick={onNext}
              className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition-all"
            >
              Próxima →
            </button>
          ) : (
            <button
              onClick={onSubmit}
              className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:shadow-lg text-white rounded-lg font-semibold transition-all"
            >
              Finalizar Exercícios
            </button>
          )}
        </div>

        <div className="mt-6">
          <div className="flex gap-2 justify-center">
            {exercises.map((ex, idx) => (
              <div
                key={idx}
                className={`h-2 w-full rounded-full transition-all ${
                  ex.userAnswer !== undefined
                    ? 'bg-emerald-500'
                    : idx === currentExercise
                    ? 'bg-amber-500'
                    : 'bg-slate-600'
                }`}
              />
            ))}
          </div>
          <div className="text-center text-sm text-slate-400 mt-3">
            {exercises.filter(ex => ex.userAnswer !== undefined).length} de {exercises.length} respondidas
          </div>
        </div>
      </div>
    </div>
  );
}
