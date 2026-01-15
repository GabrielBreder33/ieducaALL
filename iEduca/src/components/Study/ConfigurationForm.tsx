import { useEffect, useState } from 'react';
import { conhecimentoService, AreaConhecimento, Materia } from '../../services/conhecimentoService';

interface ConfigurationFormProps {
  activityType: 'redacao' | 'exercicio';
  setActivityType: (type: 'redacao' | 'exercicio') => void;
  studyTheme: string;
  setStudyTheme: (theme: string) => void;
  schoolGrade: string;
  setSchoolGrade: (grade: string) => void;
  studyDuration: number;
  setStudyDuration: (duration: number) => void;
  customTime: string;
  setCustomTime: (time: string) => void;
  onStart: () => void;
  darkMode?: boolean;
}

export default function ConfigurationForm({
  activityType,
  setActivityType,
  studyTheme,
  setStudyTheme,
  schoolGrade,
  setSchoolGrade,
  studyDuration,
  setStudyDuration,
  customTime,
  setCustomTime,
  onStart,
  darkMode = false
}: ConfigurationFormProps) {
  const [areasConhecimento, setAreasConhecimento] = useState<AreaConhecimento[]>([]);
  const [materias, setMaterias] = useState<Materia[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>('');
  const [selectedMateria, setSelectedMateria] = useState<string>('');
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [loadingMaterias, setLoadingMaterias] = useState(false);

  useEffect(() => {
    loadAreasConhecimento();
  }, []);

  useEffect(() => {
    if (selectedArea) {
      loadMaterias(parseInt(selectedArea));
    } else {
      setMaterias([]);
      setSelectedMateria('');
    }
  }, [selectedArea]);

  const loadAreasConhecimento = async () => {
    setLoadingAreas(true);
    try {
      const areas = await conhecimentoService.getAreasConhecimento();
      setAreasConhecimento(areas);
    } catch (error) {
      console.error('Erro ao carregar áreas de conhecimento:', error);
    } finally {
      setLoadingAreas(false);
    }
  };

  const loadMaterias = async (conhecimentoId: number) => {
    setLoadingMaterias(true);
    try {
      const materiasData = await conhecimentoService.getMateriasByConhecimento(conhecimentoId);
      setMaterias(materiasData);
    } catch (error) {
      console.error('Erro ao carregar matérias:', error);
      setMaterias([]);
    } finally {
      setLoadingMaterias(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <label className={`block font-medium mb-3 ${
          darkMode ? 'text-slate-300' : 'text-slate-700'
        }`}>
          Tipo de Atividade
        </label>
        <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setActivityType('redacao')}
                className={`py-4 px-4 rounded-xl font-semibold transition-all ${
                  activityType === 'redacao'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                    : darkMode
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-2 border-slate-200'
                }`}
              >
                ✍️ Redação
              </button>
              <button
                onClick={() => setActivityType('exercicio')}
                className={`py-4 px-4 rounded-xl font-semibold transition-all ${
                  activityType === 'exercicio'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg'
                    : darkMode
                    ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-2 border-slate-200'
                }`}
              >
                📝 Exercício
              </button>
            </div>
          </div>

          <div>
            <label className={`block font-medium mb-2 ${
              darkMode ? 'text-slate-300' : 'text-slate-700'
            }`}>
              {activityType === 'redacao' ? '📘 Tema da Redação' : '📘 Tema do Estudo'}
            </label>
            <input
              type="text"
              value={studyTheme}
              onChange={(e) => setStudyTheme(e.target.value)}
              placeholder={activityType === 'redacao' 
                ? "Ex: Desigualdade social no Brasil..." 
                : "Ex: Revolução Francesa, Física Quântica..."}
              className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors ${
                darkMode
                  ? 'bg-slate-700 text-slate-100 border-slate-600 focus:border-emerald-500 focus:ring-emerald-500/20'
                  : 'bg-white text-slate-900 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20'
              }`}
            />
          </div>

          {activityType === 'exercicio' && (
            <>
              <div>
                <label className={`block font-medium mb-2 ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  📚 Área de Conhecimento
                </label>
                <select
                  value={selectedArea}
                  onChange={(e) => setSelectedArea(e.target.value)}
                  disabled={loadingAreas}
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                    darkMode
                      ? 'bg-slate-700 text-slate-100 border-slate-600 focus:border-emerald-500 focus:ring-emerald-500/20'
                      : 'bg-white text-slate-900 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                >
                  <option value="">Selecione uma área</option>
                  {areasConhecimento.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block font-medium mb-2 ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  📖 Matéria
                </label>
                <select
                  value={selectedMateria}
                  onChange={(e) => setSelectedMateria(e.target.value)}
                  disabled={!selectedArea || loadingMaterias}
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                    darkMode
                      ? 'bg-slate-700 text-slate-100 border-slate-600 focus:border-emerald-500 focus:ring-emerald-500/20'
                      : 'bg-white text-slate-900 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                >
                  <option value="">Selecione uma matéria</option>
                  {materias.map((materia) => (
                    <option key={materia.id} value={materia.id}>
                      {materia.nome}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block font-medium mb-2 ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  🎓 Nível Escolar
                </label>
                <select
                  value={schoolGrade}
                  onChange={(e) => setSchoolGrade(e.target.value)}
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors ${
                    darkMode
                      ? 'bg-slate-700 text-slate-100 border-slate-600 focus:border-emerald-500 focus:ring-emerald-500/20'
                      : 'bg-white text-slate-900 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                >
                  <option value="6º ano">6º ano</option>
                  <option value="7º ano">7º ano</option>
                  <option value="8º ano">8º ano</option>
                  <option value="9º ano">9º ano</option>
                  <option value="1º ano EM">1º ano EM</option>
                  <option value="2º ano EM">2º ano EM</option>
                  <option value="3º ano EM">3º ano EM</option>
                </select>
              </div>

              <div>
                <label className={`block font-medium mb-3 ${
                  darkMode ? 'text-slate-300' : 'text-slate-700'
                }`}>
                  ⏱️ Tempo de Estudo
                </label>
                
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <button
                    onClick={() => { setStudyDuration(30); setCustomTime(''); }}
                    className={`py-3 rounded-lg font-medium transition-all ${
                      studyDuration === 30 && !customTime
                        ? 'bg-emerald-500 text-white shadow-lg'
                        : darkMode
                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-2 border-slate-200'
                    }`}
                  >
                    30 min
                  </button>
                  <button
                    onClick={() => { setStudyDuration(45); setCustomTime(''); }}
                    className={`py-3 rounded-lg font-medium transition-all ${
                      studyDuration === 45 && !customTime
                        ? 'bg-emerald-500 text-white shadow-lg'
                        : darkMode
                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-2 border-slate-200'
                    }`}
                  >
                    45 min
                  </button>
                  <button
                    onClick={() => { setStudyDuration(60); setCustomTime(''); }}
                    className={`py-3 rounded-lg font-medium transition-all ${
                      studyDuration === 60 && !customTime
                        ? 'bg-emerald-500 text-white shadow-lg'
                        : darkMode
                        ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-2 border-slate-200'
                    }`}
                  >
                    60 min
                  </button>
                </div>

                <input
                  type="number"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  placeholder="Ou escolha seu tempo (minutos)"
                  min="1"
                  max="300"
                  className={`w-full px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 transition-colors ${
                    darkMode
                      ? 'bg-slate-700 text-slate-100 border-slate-600 focus:border-emerald-500 focus:ring-emerald-500/20'
                      : 'bg-white text-slate-900 border-slate-300 focus:border-blue-500 focus:ring-blue-500/20'
                  }`}
                />
              </div>
            </>
          )}

          <div className="flex gap-3 pt-4">
            <button
              onClick={onStart}
              className={`flex-1 py-4 rounded-xl text-base font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5 ${
                activityType === 'redacao'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-purple-500/40'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-emerald-500/40'
              }`}
            >
              Iniciar
            </button>
          </div>
        </div>
  );
}
