import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// Interface para tipagem dos recebimentos
interface Recebimento {
  id?: number;
  descricao: string;
  valor: string;
  dia_recebimento: string;
  tipo: string;
  [key: string]: string | number | undefined;
}

// Função para garantir número correto
const parseNumero = (valor: string): number => {
  // Substituir vírgula por ponto para garantir número válido
  return parseFloat(valor.replace(',', '.')) || 0;
};

// Componente para cadastro de rendas/recebimentos
const CadastroRendas: React.FC = () => {
  const navigate = useNavigate();
  // Estado para armazenar a lista de recebimentos
  const [recebimentos, setRecebimentos] = useState<Recebimento[]>([
    { descricao: '', valor: '', dia_recebimento: '', tipo: 'salario' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Carregar recebimentos existentes ao montar o componente
  useEffect(() => {
    const carregarRecebimentos = async () => {
      try {
        const response = await api.get('/api/recebimentos');
        if (response.data && response.data.length > 0) {
          // Se já existem recebimentos, está no modo de edição
          setIsEditMode(true);
          
          // Converter para o formato esperado pelo estado
          const recebimentosCarregados = response.data.map((item: any) => ({
            id: item.id,
            descricao: item.descricao,
            valor: typeof item.valor === 'number' ? item.valor.toString() : item.valor,
            dia_recebimento: item.dia_recebimento.toString(),
            tipo: item.tipo
          }));
          setRecebimentos(recebimentosCarregados);
        }
      } catch (error) {
        console.error('Erro ao carregar recebimentos:', error);
      }
    };

    carregarRecebimentos();
  }, []);

  // Função para adicionar um novo recebimento à lista
  const adicionarRecebimento = () => {
    setRecebimentos([
      ...recebimentos,
      { descricao: '', valor: '', dia_recebimento: '', tipo: 'salario' }
    ]);
  };

  // Função para remover um recebimento da lista
  const removerRecebimento = (index: number) => {
    const novosRecebimentos = [...recebimentos];
    novosRecebimentos.splice(index, 1);
    setRecebimentos(novosRecebimentos);
  };

  // Função para atualizar os valores de um recebimento específico
  const handleChange = (index: number, campo: string, valor: string) => {
    const novosRecebimentos = [...recebimentos];
    novosRecebimentos[index][campo] = valor;
    setRecebimentos(novosRecebimentos);
  };

  // Função para salvar todos os recebimentos no backend
  const salvarRecebimentos = async () => {
    setIsLoading(true);
    setErro('');

    try {
      // Verificar campos vazios
      const camposVazios = recebimentos.some(
        item => !item.descricao || !item.valor || !item.dia_recebimento
      );

      if (camposVazios) {
        setErro('Preencha todos os campos de todos os recebimentos.');
        setIsLoading(false);
        return;
      }

      console.log("Recebimentos a serem salvos:", recebimentos);
      
      // 1. Obter a lista atual de IDs
      const recebimentosAtuais = await api.get('/api/recebimentos');
      const idsAtuais = recebimentosAtuais.data.map((item: any) => item.id);
      
      // 2. Para cada recebimento no formulário, criar ou atualizar
      for (const recebimento of recebimentos) {
        try {
          // Converter string para número de forma segura
          const valorNumerico = parseNumero(recebimento.valor);
          
          // Dados a serem enviados - ajustar a estrutura exatamente como o backend espera
          const dadosParaEnviar = {
            descricao: recebimento.descricao,
            valor: valorNumerico,
            dia_recebimento: parseInt(recebimento.dia_recebimento),
            tipo: recebimento.tipo || 'regular'
          };
          
          // Verificar se já existe
          if (recebimento.id && idsAtuais.some(id => id == recebimento.id)) {
            // Atualizar recebimento existente
            console.log(`Atualizando recebimento ID ${recebimento.id}:`, dadosParaEnviar);
            await api.put(`/api/recebimentos/${recebimento.id}`, dadosParaEnviar);
          } else {
            // Criar novo recebimento
            console.log("Criando novo recebimento:", dadosParaEnviar);
            await api.post('/api/recebimentos', dadosParaEnviar);
          }
        } catch (itemError) {
          console.error("Erro ao processar recebimento:", itemError);
          // Registrar detalhes específicos do erro
          if (itemError.response) {
            console.error("Resposta do servidor:", itemError.response.status, itemError.response.data);
          }
          // Continue processando os próximos itens em vez de interromper todo o processo
        }
      }
      
      // 3. Identificar IDs que foram removidos da interface e excluí-los
      if (isEditMode) {
        const idsFormulario = recebimentos
          .filter(r => r.id !== undefined)
          .map(r => r.id) as number[];
        
        const idsParaExcluir = idsAtuais.filter(
          (id: number) => !idsFormulario.includes(id)
        );
        
        for (const idExcluir of idsParaExcluir) {
          try {
            console.log(`Excluindo recebimento ID ${idExcluir}`);
            await api.delete(`/api/recebimentos/${idExcluir}`);
          } catch (deleteError) {
            console.error(`Erro ao excluir recebimento ID ${idExcluir}:`, deleteError);
            // Não propagar o erro para continuar com outras exclusões
          }
        }
      }

      console.log("Recebimentos salvos com sucesso!");
      
      // Redirecionar baseado no modo
      if (isEditMode) {
        // Se estiver em modo de edição, voltar para o dashboard
        navigate('/dashboard');
      } else {
        // Se for primeiro cadastro, ir para próxima etapa
        navigate('/cadastro-contas-fixas');
      }
    } catch (error) {
      console.error('Erro ao salvar recebimentos:', error);
      // Melhorar o log de erro para capturar mais detalhes
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Dados:', error.response.data);
      } else {
        console.error('Mensagem:', error.message);
      }
      setErro('Erro ao salvar seus recebimentos. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Função para obter o ícone de acordo com o tipo de recebimento
  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case 'salario':
        return (
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho simplificado */}
      <div className="bg-white px-4 py-5 shadow mb-4">
        <div className="flex items-center">
          <div className="bg-green-100 rounded-full p-2 mr-3">
            {getTipoIcon('salario')}
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {isEditMode ? 'Gerenciar Pix' : 'Cadastre seus recebimentos'}
            </h1>
            <p className="text-sm text-gray-600">
              Cadastre salários e benefícios para uma gestão financeira eficiente.
            </p>
          </div>
        </div>
      </div>

      <div className="px-4">
        {/* Formulários de Recebimentos */}
        {recebimentos.map((recebimento, index) => (
          <div 
            key={index} 
            className="mb-4 rounded-lg overflow-hidden border shadow-sm"
          >
            <div className="bg-green-500 px-4 py-3 flex justify-between items-center">
              <div className="flex items-center">
                <div className="bg-white rounded-full p-1 mr-2">
                  {getTipoIcon(recebimento.tipo)}
                </div>
                <h2 className="text-base font-medium text-white">Salário {index + 1}</h2>
              </div>
              {recebimentos.length > 1 && (
                <button
                  onClick={() => removerRecebimento(index)}
                  className="px-3 py-1 text-sm text-white bg-green-600 rounded-md"
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
                  placeholder="Ex: Salário, Vale Refeição..."
                  value={recebimento.descricao}
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
                      value={recebimento.valor}
                      onChange={(e) => handleChange(index, 'valor', e.target.value)}
                      className="w-full pl-8 p-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dia Recebimento</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="1-31"
                    value={recebimento.dia_recebimento}
                    onChange={(e) => handleChange(index, 'dia_recebimento', e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                    {getTipoIcon(recebimento.tipo)}
                  </div>
                  <select
                    value={recebimento.tipo}
                    onChange={(e) => handleChange(index, 'tipo', e.target.value)}
                    className="w-full pl-8 p-2 border border-gray-300 rounded-md appearance-none bg-gray-100"
                  >
                    <option value="salario">Salário</option>
                    <option value="beneficio">Benefício</option>
                    <option value="outro">Outro</option>
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

        {/* Botão para adicionar outro recebimento */}
        <button
          onClick={adicionarRecebimento}
          className="w-full py-3 mb-4 bg-white text-green-500 rounded-md border border-green-500 flex items-center justify-center"
        >
          <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Adicionar outro recebimento
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
            onClick={salvarRecebimentos}
            disabled={isLoading}
            className="flex-1 py-3 bg-blue-600 text-white rounded-md font-medium"
          >
            {isLoading ? 'Salvando...' : isEditMode ? 'Salvar Alterações' : 'Próximo'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CadastroRendas;