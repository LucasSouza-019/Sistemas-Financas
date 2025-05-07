import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// Interface para tipagem das contas fixas
interface ContaFixa {
  id?: number;
  descricao: string;
  valor: string;
  dia_vencimento: string;
  categoria: string;
  [key: string]: string | number | undefined;
}

// Função para garantir número correto
const parseNumero = (valor: string): number => {
  // Substituir vírgula por ponto para garantir número válido
  return parseFloat(valor.replace(',', '.')) || 0;
};

const CadastroContasFixas: React.FC = () => {
  const navigate = useNavigate();
  const [contasFixas, setContasFixas] = useState<ContaFixa[]>([
    { 
      descricao: '', 
      valor: '', 
      dia_vencimento: '', 
      categoria: 'cartao' 
    }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);

  // Carregar contas fixas existentes ao montar o componente
  useEffect(() => {
    const carregarContasFixas = async () => {
      try {
        const response = await api.get('/api/contas-fixas');
        if (response.data && response.data.length > 0) {
          // Se já existem contas fixas, está no modo de edição
          setIsEditMode(true);
          
          // Converter para o formato esperado pelo estado
          const contasFixasCarregadas = response.data.map((item: any) => ({
            id: item.id,
            descricao: item.descricao,
            valor: typeof item.valor_total === 'number' ? item.valor_total.toString() : item.valor_total,
            dia_vencimento: item.dia_vencimento.toString(),
            categoria: item.categoria
          }));
          setContasFixas(contasFixasCarregadas);
        }
      } catch (error) {
        console.error('Erro ao carregar contas fixas:', error);
      }
    };

    carregarContasFixas();
  }, []);

  // Função para adicionar uma nova conta fixa à lista
  const adicionarContaFixa = () => {
    setContasFixas([
      ...contasFixas,
      { 
        descricao: '', 
        valor: '', 
        dia_vencimento: '', 
        categoria: 'cartao' 
      }
    ]);
  };

  // Função para remover uma conta fixa da lista
  const removerContaFixa = (index: number) => {
    const novasContasFixas = [...contasFixas];
    novasContasFixas.splice(index, 1);
    setContasFixas(novasContasFixas);
  };

  // Função para atualizar os valores de uma conta fixa específica
  const handleChange = (index: number, campo: string, valor: string) => {
    const novasContasFixas = [...contasFixas];
    novasContasFixas[index][campo] = valor;
    setContasFixas(novasContasFixas);
  };

  // Função para salvar todas as contas fixas no backend
  const salvarContasFixas = async () => {
    setIsLoading(true);
    setErro('');

    try {
      // Verificar campos vazios
      const camposVazios = contasFixas.some(
        item => !item.descricao || !item.valor || !item.dia_vencimento
      );

      if (camposVazios) {
        setErro('Preencha todos os campos de todas as contas fixas.');
        setIsLoading(false);
        return;
      }

      console.log("Contas fixas a serem salvas:", contasFixas);
      
      // 1. Obter a lista atual de IDs
      const contasFixasAtuais = await api.get('/api/contas-fixas');
      const idsAtuais = contasFixasAtuais.data.map((item: any) => item.id);
      
      // 2. Para cada conta fixa no formulário, criar ou atualizar
      for (const contaFixa of contasFixas) {
        // Converter string para número de forma segura
        const valorNumerico = parseNumero(contaFixa.valor);
        
        // Dados a serem enviados
        const dadosParaEnviar = {
          descricao: contaFixa.descricao,
          valor_total: valorNumerico,
          dia_vencimento: parseInt(contaFixa.dia_vencimento),
          categoria: contaFixa.categoria,
          parcelas_total: 1,
          parcelas_pagas: 0,
          data_inicio: new Date().toISOString().split('T')[0],
          observacoes: ''
        };
        
        try {
          if (contaFixa.id) {
            // Atualizar conta fixa existente
            console.log(`Atualizando conta fixa ID ${contaFixa.id}:`, dadosParaEnviar);
            await api.put(`/api/contas-fixas/${contaFixa.id}`, dadosParaEnviar);
          } else {
            // Criar nova conta fixa
            console.log("Criando nova conta fixa:", dadosParaEnviar);
            await api.post('/api/contas-fixas', dadosParaEnviar);
          }
        } catch (itemError) {
          console.error("Erro ao processar conta fixa:", itemError);
          throw itemError;
        }
      }
      
      // 3. Identificar IDs que foram removidos da interface e excluí-los
      if (isEditMode) {
        const idsFormulario = contasFixas
          .map(cf => cf.id)
          .filter(id => id !== undefined) as number[];
        
        const idsParaExcluir = idsAtuais.filter(
          (id: number) => !idsFormulario.includes(id)
        );
        
        for (const idExcluir of idsParaExcluir) {
          try {
            console.log(`Excluindo conta fixa ID ${idExcluir}`);
            await api.delete(`/api/contas-fixas/${idExcluir}`);
          } catch (deleteError) {
            console.error(`Erro ao excluir conta fixa ID ${idExcluir}:`, deleteError);
          }
        }
      }

      console.log("Contas fixas salvas com sucesso!");
      
      // Redirecionar para o dashboard após salvar
      navigate('/dashboard');
    } catch (error) {
      console.error('Erro ao salvar contas fixas:', error);
      console.error('Detalhes do erro:', error.response?.data);
      setErro('Erro ao salvar suas contas fixas. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para obter o ícone correspondente à categoria
  const getCategoriaIcon = (categoria: string) => {
    switch (categoria) {
      case 'cartao':
        return (
          <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"></path>
            <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"></path>
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
            <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z"></path>
            <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd"></path>
          </svg>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho simplificado */}
      <div className="bg-white px-4 py-5 shadow mb-4">
        <div className="flex items-center">
          <div className="bg-red-100 rounded-full p-2 mr-3">
            {getCategoriaIcon('cartao')}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {isEditMode ? 'Gerenciar Contas' : 'Cadastre suas contas fixas'}
            </h1>
            <p className="text-sm text-gray-600">
              Adicione seus cartões de crédito, assinaturas e outras contas mensais.
            </p>
          </div>
        </div>
      </div>

      <div className="px-4">
        {/* Formulários de Contas Fixas */}
        {contasFixas.map((contaFixa, index) => (
          <div 
            key={index} 
            className="mb-4 rounded-lg overflow-hidden border shadow-sm"
          >
            <div className="bg-red-500 px-4 py-3 flex justify-between items-center">
              <div className="flex items-center">
                <div className="bg-white rounded-full p-1 mr-2">
                  {getCategoriaIcon(contaFixa.categoria)}
                </div>
                <h2 className="text-base font-medium text-white">Contas {index + 1}</h2>
              </div>
              {contasFixas.length > 1 && (
                <button
                  onClick={() => removerContaFixa(index)}
                  className="px-3 py-1 text-sm text-white bg-red-600 rounded-md"
                >
                  Remover
                </button>
              )}
            </div>
            
            <div className="p-4 bg-white">
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <input
                  type="text"
                  placeholder="Ex: Nubank, Netflix, Internet..."
                  value={contaFixa.descricao}
                  onChange={(e) => handleChange(index, 'descricao', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-sm">R$</span>
                    </div>
                    <input
                      type="text"
                      placeholder="0,00"
                      value={contaFixa.valor}
                      onChange={(e) => handleChange(index, 'valor', e.target.value)}
                      className="w-full pl-8 p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dia Vencimento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="1-31"
                    value={contaFixa.dia_vencimento}
                    onChange={(e) => handleChange(index, 'dia_vencimento', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    {getCategoriaIcon(contaFixa.categoria)}
                  </div>
                  <select
                    value={contaFixa.categoria}
                    onChange={(e) => handleChange(index, 'categoria', e.target.value)}
                    className="w-full pl-8 p-2 border border-gray-300 rounded-md appearance-none bg-gray-100"
                  >
                    <option value="cartao">Cartão de Crédito</option>
                    <option value="moradia">Moradia</option>
                    <option value="transporte">Transporte</option>
                    <option value="alimentacao">Alimentação</option>
                    <option value="assinatura">Assinatura/Serviço</option>
                    <option value="saude">Saúde</option>
                    <option value="educacao">Educação</option>
                    <option value="outros">Outros</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-2 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"></path>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Botão para adicionar outra conta fixa */}
        <button
          onClick={adicionarContaFixa}
          className="w-full py-3 mb-4 bg-white text-red-500 rounded-md border border-red-500 flex items-center justify-center"
        >
          <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Adicionar outra conta fixa
        </button>

        {/* Mensagem de erro */}
        {erro && (
          <div className="bg-red-100 text-red-700 p-3 mb-4 rounded-md text-sm">
            {erro}
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex gap-3 mb-6">
          {isEditMode && (
            <button
              onClick={() => navigate('/dashboard')}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-md"
            >
              Voltar
            </button>
          )}
          
          <button
            onClick={salvarContasFixas}
            disabled={isLoading}
            className="flex-1 py-3 bg-blue-600 text-white rounded-md font-medium"
          >
            {isLoading ? 'Salvando...' : isEditMode ? 'Salvar Alterações' : 'Concluir'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CadastroContasFixas;