// Tipos para o sistema de geração de atividades com IA

export type Materia = 'Matemática' | 'Linguagens' | 'Ciências da Natureza' | 'Ciências Humanas';

export type Segmento = 'Fundamental I' | 'Fundamental II' | 'Ensino Médio' | 'ENEM' | 'Concurso';

export type AnoEscolar = 
  | '1º ano' | '2º ano' | '3º ano' | '4º ano' | '5º ano'  // Fund I
  | '6º ano' | '7º ano' | '8º ano' | '9º ano'              // Fund II
  | '1º EM' | '2º EM' | '3º EM'                            // Ensino Médio
  | 'Concurso';                                            // Concurso

export type NivelDificuldade = 'Fácil' | 'Médio' | 'Difícil';

export type TipoQuestao = 'MultiplaEscolha' | 'Discursiva' | 'Mista';

export interface ConfiguracaoAtividade {
  materia: Materia;
  segmento: Segmento;
  ano: AnoEscolar;
  concurso?: string;
  conteudo: string;
  nivel: NivelDificuldade;
  quantidade: 5 | 10 | 15;
  tipo: TipoQuestao;
  explicacao: boolean;
}

export interface AlternativaMultiplaEscolha {
  id?: 'A' | 'B' | 'C' | 'D';
  letra?: 'A' | 'B' | 'C' | 'D';
  texto: string;
}

export interface QuestaoMultiplaEscolha {
  numero: number;
  enunciado: string;
  alternativas: AlternativaMultiplaEscolha[];
  respostaCorreta?: 'A' | 'B' | 'C' | 'D'; // Só visível após correção
}

export interface QuestaoDiscursiva {
  numero: number;
  enunciado: string;
  respostaEsperada?: string; // Só visível após correção
}

export type Questao = QuestaoMultiplaEscolha | QuestaoDiscursiva;

export interface Gabarito {
  questao: number;
  respostaCorreta: string;
  explicacao: string;
  porqueOutrasEstaoErradas?: string;
}

export interface AtividadeGerada {
  id: string;
  configuracao: ConfiguracaoAtividade;
  questoes: Questao[];
  gabarito: Gabarito[];
  criadaEm: Date;
}

export interface RespostaAluno {
  questao: number;
  resposta: string;
}

export interface ResultadoCorrecao {
  questao: number;
  respostaAluno: string;
  respostaCorreta: string;
  acertou: boolean;
  explicacao: string;
}

export interface ResultadoAtividade {
  atividadeId: string;
  totalQuestoes: number;
  acertos: number;
  erros: number;
  nota: number;
  percentual: number;
  resultados: ResultadoCorrecao[];
}

// Helper para obter anos por segmento
export const getAnosPorSegmento = (segmento: Segmento): AnoEscolar[] => {
  switch (segmento) {
    case 'Fundamental I':
      return ['1º ano', '2º ano', '3º ano', '4º ano', '5º ano'];
    case 'Fundamental II':
      return ['6º ano', '7º ano', '8º ano', '9º ano'];
    case 'Ensino Médio':
    case 'ENEM':
      return ['1º EM', '2º EM', '3º EM'];
    case 'Concurso':
      return ['Concurso'];
    default:
      return [];
  }
};

// Sugestões de conteúdo por matéria (autocomplete)
export const sugestoesConteudo: Record<Materia, string[]> = {
  'Matemática': [
    'Função do 2º grau',
    'Equações',
    'Geometria plana',
    'Trigonometria',
    'Probabilidade',
    'Estatística',
    'Álgebra',
    'Razão e proporção',
    'Regra de três',
    'Porcentagem'
  ],
  'Linguagens': [
    'Interpretação de texto',
    'Análise sintática',
    'Figuras de linguagem',
    'Gêneros textuais',
    'Concordância verbal',
    'Concordância nominal',
    'Regência verbal',
    'Crase',
    'Ortografia',
    'Acentuação'
  ],
  'Ciências da Natureza': [
    'Cadeia alimentar',
    'Ciclo da água',
    'Fotossíntese',
    'Células',
    'Sistema solar',
    'Energia',
    'Eletricidade',
    'Cinemática',
    'Leis de Newton',
    'Química orgânica'
  ],
  'Ciências Humanas': [
    'Revoluções industriais',
    'Segunda Guerra Mundial',
    'Brasil colonial',
    'Relevo brasileiro',
    'Clima',
    'Urbanização',
    'Política',
    'Democracia',
    'Direitos humanos',
    'Geografia urbana'
  ]
};
