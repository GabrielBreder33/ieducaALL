import { Exercise } from '../types/study';

export const generateMockExercises = (theme: string, grade: string): Exercise[] => {
  return [
    {
      id: 1,
      question: `Sobre ${theme} (${grade}): Qual das alternativas está correta?`,
      options: [
        'Alternativa A - Primeira opção',
        'Alternativa B - Segunda opção',
        'Alternativa C - Terceira opção',
        'Alternativa D - Quarta opção'
      ],
      correctAnswer: 1
    },
    {
      id: 2,
      question: `Com base no tema ${theme}, identifique a afirmação verdadeira:`,
      options: [
        'Opção A',
        'Opção B',
        'Opção C',
        'Opção D'
      ],
      correctAnswer: 2
    },
    {
      id: 3,
      question: `Questão 3 sobre ${theme}:`,
      options: [
        'Resposta A',
        'Resposta B',
        'Resposta C',
        'Resposta D'
      ],
      correctAnswer: 0
    },
    {
      id: 4,
      question: `Análise sobre ${theme} (nível ${grade}):`,
      options: [
        'Item A',
        'Item B',
        'Item C',
        'Item D'
      ],
      correctAnswer: 3
    },
    {
      id: 5,
      question: `Última questão sobre ${theme}:`,
      options: [
        'Alternativa A',
        'Alternativa B',
        'Alternativa C',
        'Alternativa D'
      ],
      correctAnswer: 1
    }
  ];
};
