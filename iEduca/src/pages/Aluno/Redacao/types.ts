import type { EssayCorrection, CompetencyScore } from '../../../services/aiService';

export type { CompetencyScore };

export interface RedacaoSubmissao {
  id: number;
  tema: string;
  dataEnvio: string;
  status: 'processando' | 'concluida' | 'erro' | 'rascunho';
  progresso: number;
  notaTotal?: number;
  tipoAvaliacao?: string;
  revisadaPorProfessor?: boolean;
  notaProfessor?: number;
  professorNome?: string;
}

export type HighlightTone = 'success' | 'neutral' | 'warning';

export interface ProfessorCompetenciaRevisaoView {
  numeroCompetencia: number;
  notaProfessor: number;
  comentarioProfessor?: string;
}

export interface GrifoView {
  id: number;
  posicaoInicio: number;
  posicaoFim: number;
  cor: string;
  comentario?: string;
}

export interface RevisaoProfessorView {
  id: number;
  professorNome: string;
  notaTotalProfessor: number;
  comentarioGeral?: string;
  criadoEm: string;
  atualizadoEm?: string;
  competencias: ProfessorCompetenciaRevisaoView[];
  grifos?: GrifoView[];
}

export type ExtendedEssayCorrection = EssayCorrection & {
  tema?: string;
  tipoAvaliacao?: string;
  textoRedacao?: string;
  dataCorrecao?: string;
  dataConclusao?: string;
  dataCriacao?: string;
  revisaoProfessor?: RevisaoProfessorView | null;
};

export type ViewMode = 'overview' | 'detailed' | 'professor';
