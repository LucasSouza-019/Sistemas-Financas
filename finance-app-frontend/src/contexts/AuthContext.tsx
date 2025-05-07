import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { login as apiLogin, register as apiRegister } from '../services/auth';

interface User {
  token: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  register: (nome: string, email: string, senha: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se o usuário está logado ao carregar a página
    const token = localStorage.getItem('token');
    if (token) {
      setUser({ token });
    }
    setLoading(false);
  }, []);

  const login = async (email: string, senha: string) => {
    try {
      const response = await apiLogin(email, senha);
      const { token } = response;
      
      localStorage.setItem('token', token);
      setUser({ token });
    } catch (error) {
      console.error('Erro ao fazer login', error);
      throw error;
    }
  };

  const register = async (nome: string, email: string, senha: string) => {
    try {
      await apiRegister(nome, email, senha);
      // Após o registro, faz login automaticamente
      await login(email, senha);
    } catch (error) {
      console.error('Erro ao cadastrar', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};