import { useState } from 'react';
import Modal from '../Modal';
import EssayWithHighlights from './EssayWithHighlights';
import { CompetencyScore, TextError } from '../../services/aiService';

interface CorrectionDisplayProps {
  isOpen: boolean;
  essayContent: string;
  theme: string;
  correction: {
    positivePoints: string[];
    improvementPoints: string[];
    estimatedGrade: number;
    recommendations: string[];
    feedback: string;
    errors: TextError[];
    competencies: CompetencyScore[];
  } | null;
  onFinish: () => void;
}

export default function CorrectionDisplay({ 
  isOpen, 
  essayContent,
  theme,
  correction, 
  onFinish 
}: CorrectionDisplayProps) {
  const [activeTab, setActiveTab] = useState<'essay' | 'analysis' | 'competencies'>('essay');

  if (!correction) {
    return (
      <Modal isOpen={isOpen} canClose={false}>
        <div className="p-8">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-500 border-t-transparent mx-auto mb-4"></div>
            <p className="text-slate-300">Analisando sua redação...</p>
          </div>
        </div>
      </Modal>
    );
  }

  const getGradeColor = (grade: number) => {
    if (grade >= 900) return 'text-emerald-400';
    if (grade >= 700) return 'text-blue-400';
    if (grade >= 500) return 'text-amber-400';
    return 'text-orange-400';
  };

  const getGradeLabel = (grade: number) => {
    if (grade >= 900) return 'Excelente';
    if (grade >= 700) return 'Bom';
    if (grade >= 500) return 'Regular';
    return 'Precisa melhorar';
  };

  const errorsBySeverity = {
    critical: correction.errors.filter(e => e.severity === 'critical').length,
    medium: correction.errors.filter(e => e.severity === 'medium').length,
    light: correction.errors.filter(e => e.severity === 'light').length
  };

  return (
    <Modal isOpen={isOpen} onClose={onFinish}>
      <div className="p-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-100">
              📝 Correção da Redação
            </h2>
            <p className="text-slate-400 text-sm mt-1">{theme}</p>
          </div>
          
          <div className="text-right">
            <div className={`text-4xl font-bold ${getGradeColor(correction.estimatedGrade)}`}>
              {correction.estimatedGrade}
            </div>
            <div className="text-sm text-slate-400">{getGradeLabel(correction.estimatedGrade)}</div>
          </div>
        </div>

        <div className="bg-slate-700/50 rounded-lg p-4 mb-6 grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-400">{errorsBySeverity.critical}</div>
            <div className="text-xs text-slate-400">Erros Críticos</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">{errorsBySeverity.medium}</div>
            <div className="text-xs text-slate-400">Pontos de Atenção</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-400">{errorsBySeverity.light}</div>
            <div className="text-xs text-slate-400">Sugestões</div>
          </div>
        </div>

        <div className="flex gap-2 mb-6 border-b border-slate-700">
          <button
            onClick={() => setActiveTab('essay')}
            className={`px-4 py-2 font-medium transition-all ${
              activeTab === 'essay'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📄 Redação Corrigida
          </button>
          <button
            onClick={() => setActiveTab('analysis')}
            className={`px-4 py-2 font-medium transition-all ${
              activeTab === 'analysis'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            📊 Análise Detalhada
          </button>
          <button
            onClick={() => setActiveTab('competencies')}
            className={`px-4 py-2 font-medium transition-all ${
              activeTab === 'competencies'
                ? 'text-emerald-400 border-b-2 border-emerald-400'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            🎯 Competências ENEM
          </button>
        </div>

        {activeTab === 'essay' && (
          <div className="space-y-4">
            <div className="bg-slate-800 rounded-lg p-4">
              <h3 className="font-semibold text-slate-100 mb-3 flex items-center gap-2">
                <span className="text-xl">✏️</span>
                Seu Texto com Correções
              </h3>
              <EssayWithHighlights content={essayContent} errors={correction.errors} />
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-lg p-6">
              <h3 className="font-bold text-emerald-400 mb-3 flex items-center gap-2">
                <span className="text-xl">✅</span>
                Pontos Positivos
              </h3>
              <ul className="space-y-2">
                {correction.positivePoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-200">
                    <span className="text-emerald-400 mt-1">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/30 rounded-lg p-6">
              <h3 className="font-bold text-orange-400 mb-3 flex items-center gap-2">
                <span className="text-xl">⚠️</span>
                Pontos a Melhorar
              </h3>
              <ul className="space-y-2">
                {correction.improvementPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-200">
                    <span className="text-orange-400 mt-1">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="font-bold text-blue-400 mb-3 flex items-center gap-2">
                <span className="text-xl">💡</span>
                Recomendações
              </h3>
              <ul className="space-y-2">
                {correction.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-200">
                    <span className="text-blue-400 font-bold">{idx + 1}.</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'competencies' && (
          <div className="space-y-4">
            {correction.competencies.map((comp, idx) => (
              <div key={idx} className="bg-slate-800 rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-slate-100">{comp.name}</h4>
                  <span className={`text-lg font-bold ${
                    comp.score >= 160 ? 'text-emerald-400' :
                    comp.score >= 120 ? 'text-blue-400' :
                    comp.score >= 80 ? 'text-amber-400' :
                    'text-orange-400'
                  }`}>
                    {comp.score}/{comp.maxScore}
                  </span>
                </div>
                
                <div className="bg-slate-700 rounded-full h-3 overflow-hidden mb-2">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      comp.score >= 160 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                      comp.score >= 120 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                      comp.score >= 80 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                      'bg-gradient-to-r from-orange-500 to-red-500'
                    }`}
                    style={{ width: `${(comp.score / comp.maxScore) * 100}%` }}
                  />
                </div>
                
                <p className="text-sm text-slate-400 mt-2">{comp.feedback}</p>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 pt-6 border-t border-slate-700">
          <button
            onClick={onFinish}
            className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-base font-semibold transition-all hover:shadow-lg hover:shadow-emerald-500/40"
          >
            🎉 Concluir e Voltar
          </button>
        </div>
      </div>
    </Modal>
  );
}
