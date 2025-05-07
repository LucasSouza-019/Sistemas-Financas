import api from './api';

interface AuthResponse {
  mensagem: string;
  token: string;
}

interface UserData {
  nome?: string;
  email: string;
  senha: string;
}

export const login = async (email: string, senha: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/usuarios/login', { email, senha });
  return response.data;
};

export const register = async (nome: string, email: string, senha: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/usuarios/cadastro', { nome, email, senha });
  return response.data;
};