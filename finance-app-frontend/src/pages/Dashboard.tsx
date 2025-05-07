import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// Interfaces para tipagem dos dados
interface ContaFixa {
  id: number;
  descricao: string;
  valor_total: number | string;
  dia_vencimento: number;
  categoria: string;
}

interface Recebimento {
  id: number;
  descricao: string;
  valor: number | string;
  dia_recebimento: number;
  tipo: string;
}

interface Economia {
  id?: number;
  valor_atual: number;
  valor_meta: number;
  data_atualizacao?: string;
}

const Dashboard: React.FC = () => {
  // Hooks e estados
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [contasFixas, setContasFixas] = useState<ContaFixa[]>([]);
  const [recebimentos, setRecebimentos] = useState<Recebimento[]>([]);
  const [economia, setEconomia] = useState<Economia>({
    valor_atual: 0,
    valor_meta: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showEconomiaModal, setShowEconomiaModal] = useState(false);
  const [valorOperacao, setValorOperacao] = useState('');
  const [tipoOperacao, setTipoOperacao] = useState<'adicionar' | 'remover' | 'atualizar'>('atualizar');
  
  // Datas para agrupar as contas - dias principais do mês para organização
  const datasPrincipais = [5, 10, 15, 20, 25, 30];
  
  // Efeito para carregar dados quando o componente for montado
  useEffect(() => {
    // Verificar se o token existe no localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    carregarDados();
  }, [navigate]);

  // Função para carregar os dados do backend
  const carregarDados = async () => {
    setIsLoading(true);
    try {
      // Carregar contas fixas
      const contasFixasResponse = await api.get('/api/contas-fixas');
      console.log("Contas fixas recebidas:", contasFixasResponse.data);
      setContasFixas(contasFixasResponse.data);
      
      // Carregar recebimentos
      const recebimentosResponse = await api.get('/api/recebimentos');
      console.log("Recebimentos recebidos:", recebimentosResponse.data);
      setRecebimentos(recebimentosResponse.data);
      
      // Carregar economia
      try {
        const economiaResponse = await api.get('/api/economia');
        console.log("Economia recebida:", economiaResponse.data);
        setEconomia(economiaResponse.data);
      } catch (economiaError) {
        console.error('Erro ao carregar economia:', economiaError);
      }
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Função para lidar com o logout
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Função para formatação de valores monetários
  const formatarValor = (valor: number | string): string => {
    // Garantir que o valor seja um número
    let valorNumerico: number;
    
    if (typeof valor === 'string') {
      // Substituir vírgula por ponto, se existir
      valorNumerico = parseFloat(valor.replace(',', '.'));
    } else {
      valorNumerico = valor;
    }
    
    // Verificar se é um número válido
    if (isNaN(valorNumerico)) {
      return 'R$ 0,00';
    }
    
    // Formatar como moeda brasileira
    return valorNumerico.toLocaleString('pt-BR', { 
      style: 'currency', 
      currency: 'BRL' 
    });
  };

  // Função para converter para número de forma segura
  const parseNumero = (valor: any): number => {
    if (typeof valor === 'number') {
      return valor;
    }
    if (typeof valor === 'string') {
      return parseFloat(valor.replace(',', '.')) || 0;
    }
    return 0;
  };

  // Agrupar contas por dia de vencimento
  const contasPorDia = datasPrincipais.map(dia => {
    // Filtrar contas que vencem neste dia
    const contasNoDia = contasFixas.filter(conta => conta.dia_vencimento === dia);
    
    // Calcular o total de contas para este dia
    const totalNoDia = contasNoDia.reduce((soma, conta) => {
      return soma + parseNumero(conta.valor_total);
    }, 0);
    
    // Retornar objeto com informações deste grupo de contas
    return {
      dia,
      contas: contasNoDia,
      total: totalNoDia
    };
  }).filter(grupo => grupo.contas.length > 0); // Remover dias sem contas

  // Contas em outras datas (que não estão nos dias principais)
  const contasOutrasDatas = contasFixas.filter(
    conta => !datasPrincipais.includes(conta.dia_vencimento)
  );
  
  // Adicionar grupo "Outras datas" se existirem contas fora dos dias principais
  if (contasOutrasDatas.length > 0) {
    contasPorDia.push({
      dia: 0, // Usamos 0 para representar "Outras datas"
      contas: contasOutrasDatas,
      total: contasOutrasDatas.reduce((soma, conta) => soma + parseNumero(conta.valor_total), 0)
    });
  }

  // Agrupar recebimentos por dia (lógica semelhante às contas)
  const recebimentosPorDia = datasPrincipais.map(dia => {
    const recebimentosNoDia = recebimentos.filter(rec => rec.dia_recebimento === dia);
    const totalNoDia = recebimentosNoDia.reduce((soma, rec) => {
      return soma + parseNumero(rec.valor);
    }, 0);
    
    return {
      dia,
      recebimentos: recebimentosNoDia,
      total: totalNoDia
    };
  }).filter(grupo => grupo.recebimentos.length > 0);
  
  // Recebimentos em outras datas
  const recebimentosOutrasDatas = recebimentos.filter(
    rec => !datasPrincipais.includes(rec.dia_recebimento)
  );
  
  // Adicionar grupo "Outras datas" para recebimentos
  if (recebimentosOutrasDatas.length > 0) {
    recebimentosPorDia.push({
      dia: 0, // Usamos 0 para representar "Outras datas"
      recebimentos: recebimentosOutrasDatas,
      total: recebimentosOutrasDatas.reduce((soma, rec) => soma + parseNumero(rec.valor), 0)
    });
  }

  // ----- CÁLCULO DOS TOTAIS GERAIS -----
  
  // Calcular o total geral de todas as contas fixas
  const totalGeralContasFixas = contasFixas.reduce((soma, conta) => {
    return soma + parseNumero(conta.valor_total);
  }, 0);
  
  // Calcular o total geral de todos os recebimentos
  const totalGeralRecebimentos = recebimentos.reduce((soma, recebimento) => {
    return soma + parseNumero(recebimento.valor);
  }, 0);
  
  // Calcular o saldo (recebimentos - contas fixas)
  const saldoMensal = totalGeralRecebimentos - totalGeralContasFixas;

  // Funções para manipular a economia
  const handleEconomiaSubmit = async () => {
    try {
      // Valide se o valor é válido
      if (!valorOperacao || parseFloat(valorOperacao.replace(',', '.')) <= 0) {
        setErro('Por favor, insira um valor válido maior que zero.');
        return;
      }

      const valorNumerico = parseFloat(valorOperacao.replace(',', '.'));
      console.log("Operação:", tipoOperacao, "Valor:", valorNumerico);

      if (tipoOperacao === 'adicionar') {
        console.log("Adicionando valor:", valorNumerico);
        const response = await api.post('/api/economia/adicionar', { valor: valorNumerico });
        console.log("Resposta:", response.data);
      } else if (tipoOperacao === 'remover') {
        console.log("Removendo valor:", valorNumerico);
        const response = await api.post('/api/economia/remover', { valor: valorNumerico });
        console.log("Resposta:", response.data);
      } else if (tipoOperacao === 'atualizar') {
        console.log("Atualizando economia:", { 
          valor_atual: valorNumerico,
          valor_meta: parseFloat(economia.valor_meta.toString().replace(',', '.')) || 0
        });
        const response = await api.post('/api/economia', { 
          valor_atual: valorNumerico,
          valor_meta: parseFloat(economia.valor_meta.toString().replace(',', '.')) || 0
        });
        console.log("Resposta:", response.data);
      }

      await carregarDados();
    setShowEconomiaModal(false);
    setValorOperacao('');

      // Recarregar dados após a operação
      carregarDados();
      setShowEconomiaModal(false);
      setValorOperacao('');

    } catch (error) {
      console.error('Erro ao processar operação:', error);
      setErro('Erro ao processar a operação. Verifique os logs para mais detalhes.');
    }
  };

  const atualizarMeta = async (novoValorMeta: string) => {
    try {
      const metaNumero = parseFloat(novoValorMeta.replace(',', '.'));
      
      if (isNaN(metaNumero) || metaNumero < 0) {
        return;
      }

      await api.post('/api/economia', {
        valor_atual: economia.valor_atual,
        valor_meta: metaNumero
      });

      carregarDados();
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
    }
  };

  // Modal para gerenciar a economia
  const EconomiaModal: React.FC = () => {
    if (!showEconomiaModal) return null;
    
    // Função para prevenir o fechamento do teclado
    const handleInputClick = (e: React.MouseEvent<HTMLInputElement>) => {
      e.preventDefault();
      // Isso mantém o foco no input e impede o fechamento do teclado
    };
  
    // Função para lidar com o toque no input (mobile)
    const handleInputTouch = (e: React.TouchEvent<HTMLInputElement>) => {
      // Previne o comportamento padrão que pode fechar o teclado
      e.stopPropagation();
    };
    
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50"
           onClick={(e) => e.stopPropagation()}>
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4"
             onClick={(e) => e.stopPropagation()}>
          <h2 className="text-xl font-bold mb-4">
            {tipoOperacao === 'adicionar' ? 'Adicionar Dinheiro' : 
             tipoOperacao === 'remover' ? 'Remover Dinheiro' : 
             'Atualizar Valor Guardado'}
          </h2>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {tipoOperacao === 'atualizar' ? 'Valor Total Guardado' : 'Valor'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-gray-500">R$</span>
              </div>
              <input
                type="number"
                inputMode="decimal"
                pattern="[0-9]*[.,]?[0-9]*"
                value={valorOperacao}
                onChange={(e) => setValorOperacao(e.target.value)}
                onClick={handleInputClick}
                onTouchStart={handleInputTouch}
                onTouchEnd={handleInputTouch}
                placeholder="0,00"
                className="pl-10 w-full p-2 border border-gray-300 rounded-md"
                autoFocus
              />
            </div>
          </div>
          
          {tipoOperacao === 'atualizar' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meta (Opcional)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-500">R$</span>
                </div>
                <input
                  type="number"
                  inputMode="decimal"
                  pattern="[0-9]*[.,]?[0-9]*"
                  value={economia.valor_meta.toString()}
                  onChange={(e) => setEconomia({...economia, valor_meta: parseFloat(e.target.value.replace(',', '.')) || 0})}
                  onClick={handleInputClick}
                  onTouchStart={handleInputTouch}
                  onTouchEnd={handleInputTouch}
                  placeholder="0,00"
                  className="pl-10 w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 mt-6">
            <button 
              onClick={() => setShowEconomiaModal(false)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md"
            >
              Cancelar
            </button>
            <button 
              onClick={handleEconomiaSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-md"
            >
              Salvar
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Barra de navegação */}
      <nav className="bg-blue-600 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-white">App Finanças</h1>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-white bg-blue-700 hover:bg-blue-800"
              >
                Menu
              </button>
              <button
                onClick={handleLogout}
                className="ml-4 px-3 py-2 rounded-md text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Menu lateral */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-40 flex">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMenuOpen(false)}
          ></div>
          
          {/* Menu lateral com animação de entrada */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl transform transition-all ease-in-out duration-300 translate-x-0">
            {/* Cabeçalho do menu */}
            <div className="px-4 py-5 bg-blue-600 text-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Menu</h2>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="rounded-md text-white hover:text-gray-200 focus:outline-none"
                >
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            {/* Corpo do menu */}
            <div className="flex-1 py-6 overflow-y-auto">
              <nav className="px-4">
                <div className="space-y-1">
                  {/* Opção - Dashboard */}
                  <button
                    onClick={() => {
                      navigate('/dashboard');
                      setIsMenuOpen(false);
                    }}
                    className="group flex items-center px-3 py-3 text-base font-medium rounded-md text-gray-900 hover:bg-blue-50 w-full"
                  >
                    <svg className="mr-4 h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Dashboard
                  </button>
                  
                  {/* Opção - Meus Recebimentos */}
                  <button
                    onClick={() => {
                      navigate('/cadastro-rendas');
                      setIsMenuOpen(false);
                    }}
                    className="group flex items-center px-3 py-3 text-base font-medium rounded-md text-gray-900 hover:bg-green-50 w-full"
                  >
                    <svg className="mr-4 h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Meus Recebimentos
                  </button>
                  
                  {/* Opção - Contas Fixas */}
                  <button
                    onClick={() => {
                      navigate('/cadastro-contas-fixas');
                      setIsMenuOpen(false);
                    }}
                    className="group flex items-center px-3 py-3 text-base font-medium rounded-md text-gray-900 hover:bg-red-50 w-full"
                  >
                    <svg className="mr-4 h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    Contas Fixas
                  </button>
                </div>
              </nav>
            </div>
            
            {/* Rodapé do menu */}
            <div className="border-t border-gray-200 px-4 py-4">
              <button
                onClick={handleLogout}
                className="group flex items-center px-3 py-3 text-base font-medium rounded-md text-gray-900 hover:bg-red-50 w-full"
              >
                <svg className="mr-4 h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sair
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <main>
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <p className="text-gray-500">Carregando dados...</p>
            </div>
          ) : (
            <div>
              {/* Resumo Financeiro com 4 cards */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Resumo Financeiro Mensal</h2>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card de Recebimentos */}
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 bg-green-600 text-white">
                      <h3 className="text-lg font-medium">Total Recebimentos</h3>
                    </div>
                    <div className="p-6 text-center">
                      <p className="text-2xl font-bold text-green-600">{formatarValor(totalGeralRecebimentos)}</p>
                    </div>
                  </div>
                  
                  {/* Card de Contas a Pagar */}
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 bg-red-600 text-white">
                      <h3 className="text-lg font-medium">Total Contas a Pagar</h3>
                    </div>
                    <div className="p-6 text-center">
                      <p className="text-2xl font-bold text-red-600">{formatarValor(totalGeralContasFixas)}</p>
                    </div>
                  </div>
                  
                  {/* Card de Saldo */}
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className={`px-4 py-5 sm:px-6 ${saldoMensal >= 0 ? 'bg-blue-600' : 'bg-yellow-600'} text-white`}>
                      <h3 className="text-lg font-medium">Saldo Mensal</h3>
                    </div>
                    <div className="p-6 text-center">
                      <p className={`text-2xl font-bold ${saldoMensal >= 0 ? 'text-blue-600' : 'text-yellow-600'}`}>
                        {formatarValor(saldoMensal)}
                      </p>
                    </div>
                  </div>
                  
                  {/* Card de Dinheiro Guardado */}
                  <div className="bg-white rounded-lg shadow overflow-hidden">
                    <div className="px-4 py-5 sm:px-6 bg-purple-600 text-white flex justify-between items-center">
                      <h3 className="text-lg font-medium">Dinheiro Guardado</h3>
                      <button 
                        onClick={() => {
                          setTipoOperacao('atualizar');
                          setValorOperacao(economia.valor_atual.toString());
                          setShowEconomiaModal(true);
                        }}
                        className="text-white hover:text-purple-200"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                        </svg>
                      </button>
                    </div>
                    <div className="p-4 text-center">
                      <p className="text-2xl font-bold text-purple-600">{formatarValor(economia.valor_atual)}</p>
                      
                      {economia.valor_meta > 0 && (
                        <div className="mt-2">
                          <div className="text-xs text-gray-500 mb-1 flex justify-between">
                            <span>
                              {Math.round((economia.valor_atual / economia.valor_meta) * 100)}% da meta
                            </span>
                            <span>{formatarValor(economia.valor_meta)}</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full" 
                              style={{ 
                                width: `${Math.min(100, (economia.valor_atual / economia.valor_meta) * 100)}%` 
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-between mt-4">
                        <button
                          onClick={() => {
                            setTipoOperacao('adicionar');
                            setValorOperacao('');
                            setShowEconomiaModal(true);
                          }}
                          className="flex-1 mr-1 py-1 px-2 bg-green-100 text-green-700 text-sm rounded-md hover:bg-green-200"
                        >
                          + Adicionar
                        </button>
                        
                        <button
                          onClick={() => {
                            setTipoOperacao('remover');
                            setValorOperacao('');
                            setShowEconomiaModal(true);
                          }}
                          className="flex-1 ml-1 py-1 px-2 bg-red-100 text-red-700 text-sm rounded-md hover:bg-red-200"
                        >
                          - Remover
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Seção de contas a pagar */}
              <div className="mb-10">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Contas a Pagar <span className="text-lg font-normal text-gray-600">
                    (Total: {formatarValor(totalGeralContasFixas)})
                  </span>
                </h2>
                
                {contasPorDia.length > 0 ? (
                  <div className="space-y-6">
                    {contasPorDia.map((grupo) => (
                      <div key={`contas-${grupo.dia}`} className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="px-4 py-5 sm:px-6 bg-blue-600 text-white">
                        <h3 className="text-lg font-medium">
                            {grupo.dia === 0 ? 'Outras datas' : `Dia ${grupo.dia}`} - Total: {formatarValor(grupo.total)}
                          </h3>
                        </div>
                        <ul className="divide-y divide-gray-200">
                          {grupo.contas.map((conta) => (
                            <li key={conta.id} className="px-4 py-4 sm:px-6">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-blue-600 truncate">{conta.descricao}</p>
                                <div className="ml-2 flex-shrink-0 flex">
                                  <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                    {formatarValor(conta.valor_total)}
                                  </p>
                                </div>
                              </div>
                              <div className="mt-2 sm:flex sm:justify-between">
                                <div className="sm:flex">
                                  <p className="flex items-center text-sm text-gray-500">
                                    {conta.categoria}
                                  </p>
                                </div>
                                <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                  <p>
                                    Vencimento: dia {conta.dia_vencimento}
                                  </p>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white shadow overflow-hidden sm:rounded-md p-6 text-center">
                    <p className="text-gray-500">Nenhuma conta registrada.</p>
                  </div>
                )}
              </div>
              
              {/* Seção de recebimentos */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Recebimentos <span className="text-lg font-normal text-gray-600">
                    (Total: {formatarValor(totalGeralRecebimentos)})
                  </span>
                </h2>
                
                {recebimentosPorDia.length > 0 ? (
                  <div className="space-y-6">
                  {recebimentosPorDia.map((grupo) => (
                    <div key={`recebimentos-${grupo.dia}`} className="bg-white rounded-lg shadow overflow-hidden">
                      <div className="px-4 py-5 sm:px-6 bg-green-600 text-white">
                        <h3 className="text-lg font-medium">
                          {grupo.dia === 0 ? 'Outras datas' : `Dia ${grupo.dia}`} - Total: {formatarValor(grupo.total)}
                        </h3>
                      </div>
                      <ul className="divide-y divide-gray-200">
                        {grupo.recebimentos.map((rec) => (
                          <li key={rec.id} className="px-4 py-4 sm:px-6">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-green-600 truncate">{rec.descricao}</p>
                              <div className="ml-2 flex-shrink-0 flex">
                                <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                  {formatarValor(rec.valor)}
                                </p>
                              </div>
                            </div>
                            <div className="mt-2 sm:flex sm:justify-between">
                              <div className="sm:flex">
                                <p className="flex items-center text-sm text-gray-500">
                                  {rec.tipo}
                                </p>
                              </div>
                              <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                                <p>
                                  Recebimento: dia {rec.dia_recebimento}
                                </p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md p-6 text-center">
                  <p className="text-gray-500">Nenhum recebimento registrado.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
    
    {/* Modal para gerenciar economia */}
    <EconomiaModal />
  </div>
);
};

export default Dashboard;