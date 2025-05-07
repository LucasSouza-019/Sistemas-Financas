import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const Cadastro: React.FC = () => {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmSenha, setConfirmSenha] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!nome || !email || !senha || !confirmSenha) {
      setError('Por favor, preencha todos os campos');
      return;
    }
    
    if (senha !== confirmSenha) {
      setError('As senhas não coincidem');
      return;
    }
    
    try {
      setIsLoading(true);
      setError('');
      
      await register(nome, email, senha);
      
      // Verificar recebimentos e redirecionar corretamente
      try {
        // Primeiro fazemos login com as credenciais recém-cadastradas
        await login(email, senha);
        
        // Verificamos se o usuário já tem recebimentos
        const recebimentosResponse = await api.get('/api/recebimentos');
        
        if (!recebimentosResponse.data || recebimentosResponse.data.length === 0) {
          // Se não tiver recebimentos, vai para a tela de configuração
          navigate('/cadastro-rendas');
        } else {
          // Se já tiver, vai para o dashboard
          navigate('/dashboard');
        }
      } catch (error) {
        // Se ocorrer erro, assume que não tem nada configurado
        navigate('/cadastro-rendas');
      }
      
    } catch (err: any) {
      setError(err.response?.data?.mensagem || 'Erro ao cadastrar');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="px-4 py-12 mx-auto max-w-md">
        {/* Logo e cabeçalho */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-5 bg-blue-100 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-8 h-8 text-blue-600">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">App Finanças</h1>
          <p className="mt-2 text-gray-600">Crie sua conta e comece a organizar sua vida financeira</p>
        </div>
        
        {/* Card do formulário */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Criar conta</h2>
            
            {error && (
              <div className="mb-4 p-3 rounded-md bg-red-50 border-l-4 border-red-500 text-red-700 text-sm">
                <div className="flex">
                  <svg className="h-5 w-5 mr-2 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <p>{error}</p>
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="nome"
                    name="nome"
                    type="text"
                    autoComplete="name"
                    required
                    className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Seu nome"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="senha"
                    name="senha"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="••••••••"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="confirm-senha" className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <input
                    id="confirm-senha"
                    name="confirm-senha"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="••••••••"
                    value={confirmSenha}
                    onChange={(e) => setConfirmSenha(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-medium rounded-lg shadow-md hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors duration-200 flex items-center justify-center"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Cadastrando...
                    </>
                  ) : (
                    <>Cadastrar</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
        
        {/* Link para login */}
        <div className="mt-6 text-center">
          <Link to="/login" className="text-blue-600 hover:text-blue-800 text-sm font-medium">
            Já tem uma conta? Faça login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Cadastro;