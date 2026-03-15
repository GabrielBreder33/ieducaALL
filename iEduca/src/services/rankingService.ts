const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export type RankingPeriod = 'mensal' | 'semestral' | 'anual';

export interface RankingAluno {
  posicao: number;
  userId: number;
  nome: string;
  escolaId: number;
  escolaNome?: string;
  mediaRedacao: number;
  mediaAtividades: number;
  mediaAtividadesRaw: number;
  mediaFinal: number;
  totalRedacoes: number;
  totalAtividades: number;
  ultimaAtualizacao?: string;
}

export interface RankingResponse {
  periodo: string;
  dataInicio: string;
  dataFim: string;
  escolaId: number;
  escolaNome?: string;
  alunos: RankingAluno[];
}

class RankingService {
  async getRankingByEscola(escolaId: number, periodo: RankingPeriod): Promise<RankingResponse> {
    try {
      // Constrói a URL de forma segura, funcionando tanto em dev quanto em produção
      const baseUrl = `${API_URL}/Ranking/escola/${escolaId}`;
      const urlWithParams = `${baseUrl}?periodo=${encodeURIComponent(periodo)}`;

      const response = await fetch(urlWithParams);

      if (!response.ok) {
        let errorMessage = 'Erro ao carregar ranking';
        try {
          const error = await response.json();
          errorMessage = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
        } catch {
          try {
            const text = await response.text();
            if (text) errorMessage = text;
          } catch {}
        }
        throw new Error(errorMessage || 'Erro ao carregar ranking');
      }

      const data: RankingResponse = await response.json();
      return {
        ...data,
        alunos: data.alunos ?? [],
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erro inesperado ao carregar ranking');
    }
  }
}

export const rankingService = new RankingService();
