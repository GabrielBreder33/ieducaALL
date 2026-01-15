export interface User {
  id?: number;
  nome: string;
  email: string;
  role: string;
  telefone: string;
  ativo?: boolean;
  dataCriacao?: string;
  idEscola?: number;
}

export interface LoginRequest {
  email: string;
  senha: string;
}

export interface RegisterRequest {
  nome: string;
  senha: string;
  email: string;
  telefone: string;
  role: string;
  ativo: boolean;
  idEscola: number;
}

export interface AuthResponse {
  token: string;
  user: User;
  message?: string;
}

export interface ErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}
