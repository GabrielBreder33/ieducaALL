const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ========== Interfaces ==========

export interface AtribuicaoAtividade {
  id: number;
  atividadeId: number;
  atividadeNome: string;
  atividadeTipo: string;
  professorId: number;
  professorNome: string;
  alunoId?: number;
  alunoNome?: string;
  escolaId: number;
  prazo?: string;
  instrucoes?: string;
  status: string;
  criadoEm: string;
}

export interface CriarAtividadeProfessor {
  nome: string;
  descricao?: string;
  materiaId: number;
  tipo: string;
  nivelDificuldade: string;
  totalQuestoes: number;
  professorId: number;
  escolaId: number;
  alunoId?: number;
  prazo?: string;
  instrucoes?: string;
}

export interface RedacaoAlunoList {
  id: number;
  alunoId: number;
  alunoNome: string;
  tema: string;
  status?: string;
  notaTotal: number;
  notaProfessor?: number;
  revisadaPorProfessor: boolean;
  dataEnvio?: string;
}

export interface CompetenciaRevisaoItem {
  numeroCompetencia: number;
  notaProfessor: number;
  comentarioProfessor?: string;
}

export interface CriarRevisaoRedacao {
  redacaoCorrecaoId: number;
  professorId: number;
  notaTotalProfessor: number;
  comentarioGeral?: string;
  competencias: CompetenciaRevisaoItem[];
}

export interface AtualizarRevisaoRedacao {
  notaTotalProfessor?: number;
  comentarioGeral?: string;
  competencias?: CompetenciaRevisaoItem[];
}

export interface GrifoItem {
  posicaoInicio: number;
  posicaoFim: number;
  cor: string;
  comentario?: string;
}

export interface GrifoResponse {
  id: number;
  posicaoInicio: number;
  posicaoFim: number;
  cor: string;
  comentario?: string;
}

export interface ProfessorRedacaoRevisao {
  id: number;
  redacaoCorrecaoId: number;
  tema: string;
  alunoNome?: string;
  professorId: number;
  professorNome: string;
  notaTotalProfessor: number;
  comentarioGeral?: string;
  criadoEm: string;
  atualizadoEm?: string;
  competencias: CompetenciaRevisaoItem[];
  grifos?: GrifoResponse[];
}

export interface RedacaoDetalhada {
  id: number;
  tema: string;
  textoRedacao?: string;
  tipoAvaliacao?: string;
  notaZero: boolean;
  notaTotal: number;
  resumoFinal?: string;
  competencias: Array<{
    numeroCompetencia: number;
    nomeCompetencia: string;
    nota: number;
    comentario?: string;
    evidencias?: string[];
    melhorias?: string[];
  }>;
  errosGramaticais: Array<{
    posicaoInicio: number;
    posicaoFim: number;
    textoOriginal: string;
    textoSugerido: string;
    explicacao: string;
    severidade: string;
  }>;
  feedbacks: {
    pontosPositivos: string[];
    pontosMelhoria: string[];
    recomendacoes: string[];
  };
  propostaIntervencao?: {
    avaliacao: string;
    sugestoesConcretas: string;
  };
  versaoReescrita?: string;
  confiancaAvaliacao?: number;
  status?: string;
  progresso: number;
}

// ========== Service ==========

class ProfessorService {
  // --- Atividades ---

  async criarAtividade(dto: CriarAtividadeProfessor): Promise<AtribuicaoAtividade> {
    const response = await fetch(`${API_URL}/Professor/atividades`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Erro ao criar atividade');
    }
    return response.json();
  }

  async listarAtribuicoesProfessor(professorId: number): Promise<AtribuicaoAtividade[]> {
    const response = await fetch(`${API_URL}/Professor/atividades/professor/${professorId}`);
    if (!response.ok) throw new Error('Erro ao listar atribuições');
    return response.json();
  }

  async encerrarAtribuicao(atribuicaoId: number, professorId: number): Promise<void> {
    const response = await fetch(
      `${API_URL}/Professor/atividades/${atribuicaoId}/encerrar?professorId=${professorId}`,
      { method: 'PUT' }
    );
    if (!response.ok) throw new Error('Erro ao encerrar atribuição');
  }

  async listarAtribuicoesAluno(alunoId: number, escolaId: number): Promise<AtribuicaoAtividade[]> {
    const response = await fetch(`${API_URL}/Professor/atividades/aluno/${alunoId}?escolaId=${escolaId}`);
    if (!response.ok) throw new Error('Erro ao listar atividades do aluno');
    return response.json();
  }

  // --- Redações ---

  async listarRedacoesAlunos(escolaId: number): Promise<RedacaoAlunoList[]> {
    const response = await fetch(`${API_URL}/Professor/redacoes/escola/${escolaId}`);
    if (!response.ok) throw new Error('Erro ao listar redações');
    return response.json();
  }

  async obterRedacao(redacaoId: number): Promise<RedacaoDetalhada> {
    const response = await fetch(`${API_URL}/RedacaoCorrecao/${redacaoId}`);
    if (!response.ok) throw new Error('Erro ao carregar redação');
    return response.json();
  }

  async obterRevisao(redacaoCorrecaoId: number): Promise<ProfessorRedacaoRevisao | null> {
    const response = await fetch(`${API_URL}/Professor/redacoes/revisao/${redacaoCorrecaoId}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('Erro ao carregar revisão');
    return response.json();
  }

  async criarRevisao(dto: CriarRevisaoRedacao): Promise<ProfessorRedacaoRevisao> {
    const response = await fetch(`${API_URL}/Professor/redacoes/revisao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dto),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Erro ao criar revisão');
    }
    return response.json();
  }

  async atualizarRevisao(
    revisaoId: number,
    professorId: number,
    dto: AtualizarRevisaoRedacao
  ): Promise<ProfessorRedacaoRevisao> {
    const response = await fetch(
      `${API_URL}/Professor/redacoes/revisao/${revisaoId}?professorId=${professorId}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dto),
      }
    );
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Erro ao atualizar revisão');
    }
    return response.json();
  }

  // --- Grifos ---

  async salvarGrifos(redacaoCorrecaoId: number, professorId: number, grifos: GrifoItem[]): Promise<GrifoResponse[]> {
    const response = await fetch(`${API_URL}/Professor/redacoes/grifos`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ redacaoCorrecaoId, professorId, grifos }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.message || 'Erro ao salvar grifos');
    }
    return response.json();
  }

  async obterGrifos(redacaoCorrecaoId: number): Promise<GrifoResponse[]> {
    const response = await fetch(`${API_URL}/Professor/redacoes/grifos/${redacaoCorrecaoId}`);
    if (!response.ok) throw new Error('Erro ao obter grifos');
    return response.json();
  }
}

export const professorService = new ProfessorService();
