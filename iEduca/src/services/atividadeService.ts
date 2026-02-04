const API_URL = 'http://localhost:5000/api';

export interface AtividadeExecucao {
  id: number;
  userId: number;
  userNome: string;
  atividadeId: number;
  atividadeNome: string;
  dataInicio: string;
  dataFim?: string;
  totalQuestoes: number;
  acertos: number;
  erros: number;
  nota?: number;
  tempoGastoSegundos?: number;
  status: string;
  criadoEm: string;
}

export interface AtividadeExecucaoCreate {
  userId: number;
  atividadeId: number;
  totalQuestoes: number;
}

export interface QuestaoResultado {
  numeroQuestao: number;
  resultado: 'Acerto' | 'Erro' | 'Pulou';
  respostaAluno?: string;
  respostaCorreta?: string;
  tempoGastoSegundos?: number;
  topicoEspecifico?: string;
}

export interface AtividadeExecucaoFinalizar {
  acertos: number;
  erros: number;
  nota?: number;
  tempoGastoSegundos?: number;
  questoesResultados?: QuestaoResultado[];
}

export interface EstatisticasUsuario {
  totalAtividades: number;
  acertos: number;
  erros: number;
  mediaNotas: number;
  mediaNotasAtividades: number;
  mediaNotasRedacoes: number;
  tempoTotalSegundos: number;
  ultimasAtividades: Array<{
    data: string;
    nota: number;
    acertos: number;
    erros: number;
  }>;
}

class AtividadeService {
  // Iniciar uma nova atividade
  async iniciarAtividade(data: AtividadeExecucaoCreate): Promise<AtividadeExecucao> {
    try {
      console.log('🌐 Fazendo requisição para:', `${API_URL}/AtividadeExecucoes/iniciar`);
      console.log('📦 Dados:', data);
      
      const response = await fetch(`${API_URL}/AtividadeExecucoes/iniciar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('❌ Erro da API:', error);
        throw new Error(error || `Erro HTTP: ${response.status}`);
      }

      const result = await response.json();
      return result;
    } catch (error: any) {
      console.error('🔥 Erro capturado:', error);
      if (error.message?.includes('fetch')) {
        throw new Error('Não foi possível conectar ao servidor. Verifique se o backend está rodando.');
      }
      throw error;
    }
  }

  async finalizarAtividade(execucaoId: number, data: AtividadeExecucaoFinalizar): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/AtividadeExecucoes/${execucaoId}/finalizar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Erro da API:', error);
        throw new Error(error || `Erro HTTP: ${response.status}`);
      }
    } catch (error: any) {
      if (error.message?.includes('fetch')) {
        throw new Error('Não foi possível conectar ao servidor.');
      }
      throw error;
    }
  }

  // Buscar execução por ID
  async getExecucao(id: number): Promise<AtividadeExecucao> {
    const response = await fetch(`${API_URL}/AtividadeExecucoes/${id}`);

    if (!response.ok) {
      throw new Error('Erro ao buscar execução');
    }

    return response.json();
  }

  // Buscar histórico do usuário
  async getHistoricoUsuario(userId: number): Promise<AtividadeExecucao[]> {
    const response = await fetch(`${API_URL}/AtividadeExecucoes/usuario/${userId}`);

    if (!response.ok) {
      throw new Error('Erro ao buscar histórico do usuário');
    }

    return response.json();
  }

  // Buscar estatísticas do usuário
  async getEstatisticasUsuario(userId: number): Promise<EstatisticasUsuario> {
    const response = await fetch(`${API_URL}/AtividadeExecucoes/usuario/${userId}/estatisticas`);

    if (!response.ok) {
      throw new Error('Erro ao buscar estatísticas');
    }

    return response.json();
  }

  // Buscar questões de uma execução
  async getQuestoesExecucao(execucaoId: number): Promise<QuestaoResultado[]> {
    const response = await fetch(`${API_URL}/AtividadeExecucoes/${execucaoId}/questoes`);

    if (!response.ok) {
      throw new Error('Erro ao buscar questões');
    }

    return response.json();
  }

  // Buscar histórico por atividade específica
  async getHistoricoPorAtividade(userId: number, atividadeId: number): Promise<AtividadeExecucao[]> {
    const response = await fetch(`${API_URL}/AtividadeExecucoes/usuario/${userId}/atividade/${atividadeId}`);

    if (!response.ok) {
      throw new Error('Erro ao buscar histórico da atividade');
    }

    return response.json();
  }

  // Deletar execução
  async deletarExecucao(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/AtividadeExecucoes/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Erro ao deletar execução');
    }
  }
}

export const atividadeService = new AtividadeService();
