import type { User, LoginRequest, RegisterRequest, AuthResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class AuthService {
  async login(email: string, senha: string): Promise<User> {
    try {
      const response = await fetch(`${API_URL}/User/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email, senha: senha } as LoginRequest),
      });

      if (!response.ok) {
        if (response.status === 400 || response.status === 401) {
          throw new Error('Email ou senha incorretos');
        }

        let errorMessage = 'Erro ao fazer login';
        try {
          const error = await response.json();
          errorMessage = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
        } catch {
          try {
            const text = await response.text();
            if (text) errorMessage = text;
          } catch {}
        }
        throw new Error(errorMessage || 'Erro ao fazer login');
      }

      const userData: User = await response.json();
      localStorage.setItem('user', JSON.stringify(userData));
      return userData;
    } catch (error) {
      throw error;
    }
  }

  async register(nome: string, email: string, senha: string, telefone: string, role: string, ativo: boolean, idEscola: number = 0): Promise<AuthResponse> {
    try {
      const payload = { 
        nome, 
        senha, 
        email, 
        telefone, 
        role, 
        ativo, 
        idEscola 
      };
      
      const response = await fetch(`${API_URL}/User`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        let errorMessage = 'Erro ao cadastrar';
        try {
          const error = await response.json();
          errorMessage = error?.message || (typeof error === 'string' ? error : JSON.stringify(error));
        } catch {
          try {
            const text = await response.text();
            if (text) errorMessage = text;
          } catch {}
        }
        throw new Error(errorMessage || 'Erro ao cadastrar');
      }

      const data: AuthResponse = await response.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  logout(): void {
    localStorage.removeItem('user');
  }

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isAuthenticated(): boolean {
    return !!this.getCurrentUser();
  }
}

export const authService = new AuthService();
