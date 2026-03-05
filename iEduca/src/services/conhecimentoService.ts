const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface AreaConhecimento {
  id: number;
  nome: string;
}

export interface Materia {
  id: number;
  nome: string;
  conhecimentoId: number;
}

class ConhecimentoService {
  async getAreasConhecimento(): Promise<AreaConhecimento[]> {
    try {
      const response = await fetch(`${API_URL}/Conhencimento`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar áreas de conhecimento');
      }

      const data: AreaConhecimento[] = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao buscar áreas de conhecimento:', error);
      throw error;
    }
  }

  async getMateriasByConhecimento(conhecimentoId: number): Promise<Materia[]> {
    try {
      const response = await fetch(`${API_URL}/Materias/by-conhecimento/${conhecimentoId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar matérias');
      }

      const data: Materia[] = await response.json();
      return data;
    } catch (error) {
      console.error('Erro ao buscar matérias:', error);
      throw error;
    }
  }
}

export const conhecimentoService = new ConhecimentoService();
