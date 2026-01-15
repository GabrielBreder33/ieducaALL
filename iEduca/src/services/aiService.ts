export type ErrorSeverity = 'critical' | 'medium' | 'light';

export interface TextError {
  start: number;
  end: number;
  severity: ErrorSeverity;
  message: string;
  suggestion?: string;
}

export interface CompetencyScore {
  name: string;
  score: number;
  maxScore: number;
  feedback: string;
}

export interface EssayCorrection {
  positivePoints: string[];
  improvementPoints: string[];
  estimatedGrade: number;
  recommendations: string[];
  feedback: string;
  errors: TextError[];
  competencies: CompetencyScore[];
}

export const aiService = {
  async correctEssay(
    theme: string,
    content: string,
    type: string = 'ENEM'
  ): Promise<EssayCorrection> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const errors = this.generateMockErrors(content);
        const grade = Math.floor(Math.random() * 200) + 700;
        
        const correction: EssayCorrection = {
          positivePoints: [
            'Boa estruturação de parágrafos',
            'Argumentação coerente',
            'Uso adequado da norma culta',
            'Tema bem contextualizado'
          ],
          improvementPoints: [
            'Desenvolver melhor a conclusão',
            'Incluir mais dados e estatísticas',
            'Explorar mais os aspectos sociais do tema',
            'Melhorar os conectivos entre parágrafos'
          ],
          estimatedGrade: grade,
          recommendations: [
            'Leia mais artigos sobre o tema',
            'Pratique a estrutura dissertativa-argumentativa',
            'Estude conectivos e coesão textual',
            'Analise redações nota 1000 do ENEM'
          ],
          feedback: this.generateDetailedFeedback(theme, content, type),
          errors: errors,
          competencies: this.generateCompetencies(grade)
        };
        
        resolve(correction);
      }, 2000);
    });
  },

  generateMockErrors(content: string): TextError[] {
    const errors: TextError[] = [];
    const text = content;
    
    const patterns = [
      { word: 'mais', severity: 'medium' as ErrorSeverity, message: 'Uso repetitivo', suggestion: 'Use "também", "ademais" ou "além disso"' },
      { word: 'muito', severity: 'light' as ErrorSeverity, message: 'Palavra genérica', suggestion: 'Seja mais específico' },
      { word: 'coisa', severity: 'medium' as ErrorSeverity, message: 'Termo vago', suggestion: 'Use um termo mais preciso' },
      { word: 'etc', severity: 'critical' as ErrorSeverity, message: 'Evite "etc" em textos formais', suggestion: 'Seja específico ou conclua a ideia' }
    ];
    
    patterns.forEach(pattern => {
      let index = text.indexOf(pattern.word);
      if (index !== -1) {
        errors.push({
          start: index,
          end: index + pattern.word.length,
          severity: pattern.severity,
          message: pattern.message,
          suggestion: pattern.suggestion
        });
      }
    });
    
    const sentences = text.split(/[.!?]/);
    sentences.forEach((sentence, idx) => {
      if (sentence.trim().length > 150 && idx < sentences.length - 1) {
        const sentenceStart = text.indexOf(sentence);
        errors.push({
          start: sentenceStart,
          end: sentenceStart + Math.min(50, sentence.length),
          severity: 'medium',
          message: 'Frase muito longa',
          suggestion: 'Divida em frases menores para melhor clareza'
        });
      }
    });
    
    return errors;
  },

  generateCompetencies(grade: number): CompetencyScore[] {
    const baseScore = Math.floor(grade / 5);
    
    return [
      {
        name: 'Domínio da norma padrão',
        score: Math.min(200, baseScore + Math.floor(Math.random() * 40) - 20),
        maxScore: 200,
        feedback: 'Bom domínio da gramática, com poucos desvios'
      },
      {
        name: 'Compreensão do tema',
        score: Math.min(200, baseScore + Math.floor(Math.random() * 40) - 20),
        maxScore: 200,
        feedback: 'Tema desenvolvido de forma adequada'
      },
      {
        name: 'Argumentação',
        score: Math.min(200, baseScore + Math.floor(Math.random() * 40) - 20),
        maxScore: 200,
        feedback: 'Argumentos consistentes e bem fundamentados'
      },
      {
        name: 'Coesão e coerência',
        score: Math.min(200, baseScore + Math.floor(Math.random() * 40) - 20),
        maxScore: 200,
        feedback: 'Boa articulação entre as ideias'
      },
      {
        name: 'Proposta de intervenção',
        score: Math.min(200, baseScore + Math.floor(Math.random() * 40) - 20),
        maxScore: 200,
        feedback: 'Proposta presente e bem elaborada'
      }
    ];
  },

  generateDetailedFeedback(theme: string, content: string, type: string): string {
    const wordCount = content.trim().split(/\s+/).length;
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0).length;
    
    return `Sua redação sobre "${theme}" apresenta ${wordCount} palavras distribuídas em ${paragraphs} parágrafos. O texto demonstra compreensão do tema e estrutura adequada ao formato ${type}.`;
  }
};
