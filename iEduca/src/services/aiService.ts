export type ErrorSeverity = 'critical' | 'medium' | 'light';

export interface TextError {
  posicaoInicio: number;
  posicaoFim: number;
  textoOriginal: string;
  textoSugerido?: string;
  explicacao: string;
  severidade: string;  
  start?: number;
  end?: number;
  severity?: ErrorSeverity;
  message?: string;
  suggestion?: string;
}

export interface CompetencyScore {
  numeroCompetencia: number;
  nomeCompetencia: string;
  nota: number;
  comentario: string;
  evidencias: string[];
  melhorias: string[];
}

export interface SugestaoIntervencao {
  agente: string;
  acao: string;
  prazo: string;
  indicador: string;
}

export interface PropostaIntervencao {
  avaliacao: string;
  sugestoesConcretas: SugestaoIntervencao[];
}

export interface EssayCorrection {
  id?: number;
  notaZero: boolean;
  motivoNotaZero?: string;
  notaTotal: number;
  resumoFinal: string;
  versaoReescrita?: string;
  confiancaAvaliacao?: number;
  competencias: CompetencyScore[];
  errosGramaticais: TextError[];
  feedbacks: {
    pontosPositivos: string[];
    pontosMelhoria: string[];
    recomendacoes: string[];
  };
  propostaIntervencao?: PropostaIntervencao;
}

export interface LegacyEssayCorrection {
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
    userId: number,
    atividadeExecucaoId: number | null,
    theme: string,
    content: string,
    type: string = 'ENEM'
  ): Promise<EssayCorrection> {
    try {
      const response = await fetch('http://localhost:5000/api/RedacaoCorrecao/corrigir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          atividadeExecucaoId,
          tema: theme,
          textoRedacao: content,
          tipoAvaliacao: type
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao corrigir redação');
      }

      const correction: EssayCorrection = await response.json();
      
      console.log('✅ Resposta do backend:', correction);
      
      if (correction.errosGramaticais) {
        correction.errosGramaticais = correction.errosGramaticais.map(erro => ({
          ...erro,
          start: erro.posicaoInicio,
          end: erro.posicaoFim,
          severity: (erro.severidade || 'medium') as ErrorSeverity,
          message: erro.explicacao,
          suggestion: erro.textoSugerido
        }));
      }
      
      return correction;
    } catch (error) {
      console.error('❌ ERRO ao corrigir redação:', error);
      // NÃO USE MOCK - Deixe o erro aparecer!
      throw error;
    }
  },

  convertToLegacy(correction: EssayCorrection): LegacyEssayCorrection {
    return {
      positivePoints: correction.feedbacks.pontosPositivos,
      improvementPoints: correction.feedbacks.pontosMelhoria,
      estimatedGrade: correction.notaTotal,
      recommendations: correction.feedbacks.recomendacoes,
      feedback: correction.resumoFinal,
      errors: correction.errosGramaticais,
      competencies: correction.competencias
    };
  },

  generateMockCorrection(theme: string, content: string, type: string): EssayCorrection {
    const errors = this.generateMockErrors(content);
    const grade = Math.floor(Math.random() * 200) + 700;
    const competencias = this.generateMockCompetencies(grade);
    
    return {
      notaZero: false,
      notaTotal: grade,
      resumoFinal: `Sua redação sobre "${theme}" apresenta boa estrutura e argumentação. Continue praticando!`,
      competencias,
      errosGramaticais: errors,
      feedbacks: {
        pontosPositivos: [
          'Boa estruturação de parágrafos',
          'Argumentação coerente',
          'Uso adequado da norma culta',
          'Tema bem contextualizado'
        ],
        pontosMelhoria: [
          'Desenvolver melhor a conclusão',
          'Incluir mais dados e estatísticas',
          'Explorar mais os aspectos sociais do tema'
        ],
        recomendacoes: [
          'Leia mais artigos sobre o tema',
          'Pratique a estrutura dissertativa-argumentativa',
          'Estude conectivos e coesão textual'
        ]
      },
      propostaIntervencao: {
        avaliacao: 'Proposta presente mas pode ser mais detalhada',
        sugestoesConcretas: [
          {
            agente: 'Governo Federal',
            acao: 'Implementar campanhas educativas',
            prazo: '6 meses',
            indicador: 'Redução de 20% nos índices'
          }
        ]
      },
      confiancaAvaliacao: 0.85
    };
  },

  generateMockErrors(content: string): TextError[] {
    const errors: TextError[] = [];
    const text = content;
    
    const patterns = [
      { word: 'mais', severidade: 'medium', explicacao: 'Uso repetitivo', sugestao: 'Use "também", "ademais" ou "além disso"' },
      { word: 'muito', severidade: 'light', explicacao: 'Palavra genérica', sugestao: 'Seja mais específico' },
      { word: 'coisa', severidade: 'medium', explicacao: 'Termo vago', sugestao: 'Use um termo mais preciso' },
      { word: 'etc', severidade: 'critical', explicacao: 'Evite "etc" em textos formais', sugestao: 'Seja específico ou conclua a ideia' }
    ];
    
    patterns.forEach(pattern => {
      let index = text.indexOf(pattern.word);
      if (index !== -1) {
        errors.push({
          posicaoInicio: index,
          posicaoFim: index + pattern.word.length,
          textoOriginal: pattern.word,
          textoSugerido: pattern.sugestao,
          explicacao: pattern.explicacao,
          severidade: pattern.severidade,
          start: index,
          end: index + pattern.word.length,
          severity: pattern.severidade as ErrorSeverity,
          message: pattern.explicacao,
          suggestion: pattern.sugestao
        });
      }
    });
    
    return errors;
  },

  generateMockCompetencies(grade: number): CompetencyScore[] {
    const baseScore = Math.floor(grade / 5);
    
    return [
      {
        numeroCompetencia: 1,
        nomeCompetencia: 'Domínio da norma padrão',
        nota: Math.min(200, baseScore + Math.floor(Math.random() * 40) - 20),
        comentario: 'Bom domínio da gramática, com poucos desvios',
        evidencias: ['Uso correto de vírgulas', 'Concordância verbal adequada'],
        melhorias: ['Revisar regência verbal']
      },
      {
        numeroCompetencia: 2,
        nomeCompetencia: 'Compreensão do tema',
        nota: Math.min(200, baseScore + Math.floor(Math.random() * 40) - 20),
        comentario: 'Tema desenvolvido de forma adequada',
        evidencias: ['Tese clara no primeiro parágrafo'],
        melhorias: ['Incluir mais dados estatísticos']
      },
      {
        numeroCompetencia: 3,
        nomeCompetencia: 'Argumentação',
        nota: Math.min(200, baseScore + Math.floor(Math.random() * 40) - 20),
        comentario: 'Argumentos consistentes e bem fundamentados',
        evidencias: ['Uso de exemplos concretos'],
        melhorias: ['Desenvolver contraargumentos']
      },
      {
        numeroCompetencia: 4,
        nomeCompetencia: 'Coesão e coerência',
        nota: Math.min(200, baseScore + Math.floor(Math.random() * 40) - 20),
        comentario: 'Boa articulação entre as ideias',
        evidencias: ['Uso adequado de conectivos'],
        melhorias: ['Variar mais os elementos coesivos']
      },
      {
        numeroCompetencia: 5,
        nomeCompetencia: 'Proposta de intervenção',
        nota: Math.min(200, baseScore + Math.floor(Math.random() * 40) - 20),
        comentario: 'Proposta presente e bem elaborada',
        evidencias: ['Agentes e ações identificados'],
        melhorias: ['Detalhar indicadores de sucesso']
      }
    ];
  },

  generateDetailedFeedback(theme: string, content: string, type: string): string {
    const wordCount = content.trim().split(/\s+/).length;
    const paragraphs = content.split('\n\n').filter(p => p.trim().length > 0).length;
    
    return `Sua redação sobre "${theme}" apresenta ${wordCount} palavras distribuídas em ${paragraphs} parágrafos. O texto demonstra compreensão do tema e estrutura adequada ao formato ${type}.`;
  },

  // ===== SISTEMA DE GERAÇÃO DE ATIVIDADES COM IA =====
  
  async gerarAtividade(configuracao: import('../types/atividade').ConfiguracaoAtividade): Promise<import('../types/atividade').AtividadeGerada> {
    try {
      const prompt = this.construirPrompt(configuracao);
      
      const response = await fetch('http://localhost:5000/api/AtividadeIA/gerar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          configuracao,
          prompt
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar atividade');
      }

      const atividadeGerada = await response.json();
      return atividadeGerada;
    } catch (error) {
      console.error('❌ ERRO ao gerar atividade:', error);
      throw error;
    }
  },

  construirPrompt(config: import('../types/atividade').ConfiguracaoAtividade): string {
    const promptBase = `Você é um professor especialista em ${config.materia}, com experiência em ensino para ${config.segmento}.

Gere ${config.quantidade} questões sobre o conteúdo:
"${config.conteudo}"

Público-alvo:
Alunos do ${config.ano}

Configurações:
- Nível de dificuldade: ${config.nivel}
- Tipo de questão: ${config.tipo}

Regras obrigatórias:
- Linguagem adequada ao nível escolar
- Não utilize conteúdo de nível universitário
- Enunciados claros e objetivos
- Evite ambiguidades
${this.getRegrasPorSegmento(config.segmento)}`;

    const promptTipo = this.getPromptPorTipo(config.tipo);
    
    const promptCorrecao = config.explicacao ? `

Após gerar as questões, forneça:

1. Um gabarito no formato:
Questão 1: [RESPOSTA]
Questão 2: [RESPOSTA]
...

2. Uma explicação detalhada de cada questão,
explicando por que a alternativa correta está certa
${config.tipo === 'MultiplaEscolha' ? 'e por que as demais estão incorretas.' : 'e o que se espera na resposta.'}

Separe claramente:
- QUESTÕES
- GABARITO
- EXPLICAÇÕES

Formato de saída JSON:
{
  "questoes": [...],
  "gabarito": [...],
  "explicacoes": [...]
}` : '';

    return promptBase + promptTipo + promptCorrecao;
  },

  getRegrasPorSegmento(segmento: import('../types/atividade').Segmento): string {
    const regras: Record<import('../types/atividade').Segmento, string> = {
      'Fundamental I': '\n- Use linguagem simples e lúdica\n- Evite termos técnicos complexos\n- Prefira exemplos do cotidiano infantil',
      'Fundamental II': '\n- Use linguagem clara, mas já pode introduzir conceitos mais elaborados\n- Contextualize com situações do dia a dia de adolescentes',
      'Ensino Médio': '\n- Use linguagem técnica adequada\n- Pode exigir raciocínio mais abstrato\n- Contextualize com temas contemporâneos',
      'ENEM': '\n- Siga o padrão ENEM rigorosamente\n- Use interdisciplinaridade\n- Contextualize com situações reais e atuais\n- Exija interpretação e raciocínio crítico'
    };
    return regras[segmento] || '';
  },

  getPromptPorTipo(tipo: import('../types/atividade').TipoQuestao): string {
    switch (tipo) {
      case 'MultiplaEscolha':
        return `

Para cada questão:
- Apresente 4 alternativas (A, B, C, D)
- Apenas UMA alternativa correta
- Não destaque visualmente a resposta correta
- As alternativas incorretas devem ser plausíveis`;

      case 'Discursiva':
        return `

Para cada questão:
- Enunciado que estimule reflexão e argumentação
- Especifique o que se espera na resposta (ex: "Explique em 3 linhas...")
- Indique critérios de avaliação`;

      case 'Mista':
        return `

Para cada questão:
- Alterne entre múltipla escolha e discursiva
- Para múltipla escolha: 4 alternativas (A, B, C, D)
- Para discursiva: enunciado que estimule reflexão
- Mantenha equilíbrio entre os tipos`;

      default:
        return '';
    }
  },

  async corrigirAtividade(
    atividadeId: string,
    gabarito: import('../types/atividade').Gabarito[],
    respostas: import('../types/atividade').RespostaAluno[],
    atividade?: import('../types/atividade').AtividadeGerada
  ): Promise<import('../types/atividade').ResultadoAtividade> {
    try {
      // Obter userId do localStorage
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const userId = user?.id;

      const response = await fetch('http://localhost:5000/api/AtividadeIA/corrigir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          atividadeId,
          userId,
          configuracao: atividade?.configuracao,
          questoes: atividade?.questoes,
          gabarito,
          respostas
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao corrigir atividade');
      }

      const resultado = await response.json();
      return resultado;
    } catch (error) {
      console.error('❌ ERRO ao corrigir atividade:', error);
      throw error;
    }
  },

  async buscarHistoricoAtividades(userId: number): Promise<any[]> {
    try {
      const response = await fetch(`http://localhost:5000/api/AtividadeIA/historico/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar histórico de atividades');
      }

      const historico = await response.json();
      return historico;
    } catch (error) {
      console.error('❌ ERRO ao buscar histórico:', error);
      throw error;
    }
  },

  async buscarDetalheAtividade(userId: number, atividadeId: number): Promise<any> {
    try {
      const response = await fetch(`http://localhost:5000/api/AtividadeIA/historico/${userId}/${atividadeId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar detalhes da atividade');
      }

      const detalhe = await response.json();
      return detalhe;
    } catch (error) {
      console.error('❌ ERRO ao buscar detalhes:', error);
      throw error;
    }
  }
};
