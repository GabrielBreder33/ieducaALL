import { useState } from 'react';
import Modal from '../Modal';
import EssayWithHighlights from './EssayWithHighlights';
import { CompetencyScore, TextError, EssayCorrection } from '../../services/aiService';

interface CorrectionDisplayProps {
  isOpen: boolean;
  essayContent: string;
  theme: string;
  correction: EssayCorrection | null;
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
            <p className="text-slate-300">Analisando sua redação com IA...</p>
            <p className="text-slate-500 text-sm mt-2">Isso pode levar alguns segundos</p>
          </div>
        </div>
      </Modal>
    );
  }

  // Verificar se é nota zero
  if (correction.notaZero) {
    return (
      <Modal isOpen={isOpen} onClose={onFinish}>
        <div className="p-8 max-h-[90vh] overflow-y-auto">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-red-400 mb-4">Redação Anulada</h2>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 mb-6">
              <p className="text-slate-200 mb-2">Motivo:</p>
              <p className="text-red-300 font-semibold">{correction.motivoNotaZero}</p>
            </div>
            <p className="text-slate-400 mb-6">
              Revise as regras do ENEM e tente novamente.
            </p>
            <button
              onClick={onFinish}
              className="px-8 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-semibold"
            >
              Entendi
            </button>
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
    critical: correction.errosGramaticais?.filter(e => (e.severity || e.severidade) === 'critical').length || 0,
    medium: correction.errosGramaticais?.filter(e => (e.severity || e.severidade) === 'medium').length || 0,
    light: correction.errosGramaticais?.filter(e => (e.severity || e.severidade) === 'light').length || 0
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
            <div className={`text-4xl font-bold ${getGradeColor(correction.notaTotal)}`}>
              {correction.notaTotal}
            </div>
            <div className="text-sm text-slate-400">{getGradeLabel(correction.notaTotal)}</div>
            {correction.confiancaAvaliacao && (
              <div className="text-xs text-slate-500 mt-1">
                Confiança: {(correction.confiancaAvaliacao * 100).toFixed(0)}%
              </div>
            )}
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
              <EssayWithHighlights content={essayContent} errors={correction.errosGramaticais} />
            </div>
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-lg p-6">
              <h3 className="font-bold text-blue-400 mb-3 flex items-center gap-2">
                <span className="text-xl">📋</span>
                Resumo da Avaliação
              </h3>
              <p className="text-slate-200">{correction.resumoFinal}</p>
            </div>

            <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border border-emerald-500/30 rounded-lg p-6">
              <h3 className="font-bold text-emerald-400 mb-3 flex items-center gap-2">
                <span className="text-xl">✅</span>
                Pontos Positivos
              </h3>
              <ul className="space-y-2">
                {correction.feedbacks.pontosPositivos.map((point, idx) => (
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
                {correction.feedbacks.pontosMelhoria.map((point, idx) => (
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
                {correction.feedbacks.recomendacoes.map((rec, idx) => (
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
            {correction.competencias.map((comp, idx) => (
              <div key={idx} className="bg-slate-800 rounded-lg p-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-slate-100">{comp.nomeCompetencia}</h4>
                    <p className="text-xs text-slate-400">Competência {comp.numeroCompetencia}</p>
                  </div>
                  <span className={`text-lg font-bold ${
                    comp.nota >= 160 ? 'text-emerald-400' :
                    comp.nota >= 120 ? 'text-blue-400' :
                    comp.nota >= 80 ? 'text-amber-400' :
                    'text-orange-400'
                  }`}>
                    {comp.nota}/200
                  </span>
                </div>
                
                <div className="bg-slate-700 rounded-full h-3 overflow-hidden mb-3">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      comp.nota >= 160 ? 'bg-gradient-to-r from-emerald-500 to-teal-500' :
                      comp.nota >= 120 ? 'bg-gradient-to-r from-blue-500 to-cyan-500' :
                      comp.nota >= 80 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                      'bg-gradient-to-r from-orange-500 to-red-500'
                    }`}
                    style={{ width: `${(comp.nota / 200) * 100}%` }}
                  />
                </div>
                
                <p className="text-sm text-slate-300 mb-3">{comp.comentario}</p>
                
                {comp.evidencias.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-emerald-400 font-semibold mb-1">Evidências:</p>
                    <ul className="space-y-1">
                      {comp.evidencias.map((ev, i) => (
                        <li key={i} className="text-xs text-slate-400 flex items-start gap-1">
                          <span className="text-emerald-400">✓</span>
                          <span>{ev}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {comp.melhorias.length > 0 && (
                  <div>
                    <p className="text-xs text-orange-400 font-semibold mb-1">Como Melhorar:</p>
                    <ul className="space-y-1">
                      {comp.melhorias.map((mel, i) => (
                        <li key={i} className="text-xs text-slate-400 flex items-start gap-1">
                          <span className="text-orange-400">→</span>
                          <span>{mel}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
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
