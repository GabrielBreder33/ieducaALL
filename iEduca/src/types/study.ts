export type ActivityType = 'redacao' | 'exercicio';
export type StudyPhase = 'config' | 'studying' | 'exercises' | 'essay-prompt' | 'writing-essay' | 'correction';

export interface EssayData {
  theme: string;
  type: string;
  minLines: number;
  content: string;
  wordCount: number;
  lineCount: number;
}

export interface Exercise {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  userAnswer?: number;
}

export interface ToastScore {
  score: number;
  total: number;
}
