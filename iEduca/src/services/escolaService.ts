const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export interface Escola {
  id: number;
  nome: string;
  email: string;
  dataCriacao: string;
}

export interface EscolaCreate {
  nome: string;
  email: string;
  senha: string;
}

export interface EscolaUpdate {
  nome?: string;
  email?: string;
  senha?: string;
}

class EscolaService {
  async getAll(): Promise<Escola[]> {
    const response = await fetch(`${API_URL}/Escola`);
    if (!response.ok) {
      throw new Error('Erro ao buscar escolas');
    }
    return response.json();
  }

  async getById(id: number): Promise<Escola> {
    const response = await fetch(`${API_URL}/Escola/${id}`);
    if (!response.ok) {
      throw new Error('Escola não encontrada');
    }
    return response.json();
  }

  async create(escola: EscolaCreate): Promise<Escola> {
    const response = await fetch(`${API_URL}/Escola`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(escola),
    });

    if (!response.ok) {
      let errorMessage = 'Erro ao cadastrar escola';
      try {
        const error = await response.json();
        errorMessage = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
      } catch {
        try {
          const text = await response.text();
          if (text) errorMessage = text;
        } catch {}
      }
      throw new Error(errorMessage || 'Erro ao cadastrar escola');
    }

    return response.json();
  }

  async update(id: number, escola: EscolaUpdate): Promise<void> {
    const response = await fetch(`${API_URL}/Escola/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(escola),
    });

    if (!response.ok) {
      let errorMessage = 'Erro ao atualizar escola';
      try {
        const error = await response.json();
        errorMessage = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
      } catch {
        try {
          const text = await response.text();
          if (text) errorMessage = text;
        } catch {}
      }
      throw new Error(errorMessage || 'Erro ao atualizar escola');
    }
  }

  async delete(id: number): Promise<void> {
    const response = await fetch(`${API_URL}/Escola/${id}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error('Erro ao excluir escola');
    }
  }

  async login(email: string, senha: string): Promise<Escola> {
    const response = await fetch(`${API_URL}/Escola/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, senha }),
    });

    if (!response.ok) {
      if (response.status === 400 || response.status === 401) {
        throw new Error('Email ou senha incorretos');
      }

      let errorMessage = 'Email ou senha incorretos';
      try {
        const error = await response.json();
        errorMessage = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
      } catch {
        try {
          const text = await response.text();
          if (text) errorMessage = text;
        } catch {}
      }
      throw new Error(errorMessage || 'Email ou senha incorretos');
    }

    const escola: Escola = await response.json();
    localStorage.setItem('escola', JSON.stringify(escola));
    return escola;
  }

  logout(): void {
    localStorage.removeItem('escola');
  }

  getCurrentEscola(): Escola | null {
    const escolaStr = localStorage.getItem('escola');
    return escolaStr ? JSON.parse(escolaStr) : null;
  }
}

export const escolaService = new EscolaService();
