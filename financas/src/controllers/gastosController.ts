import { Request, Response } from 'express';
import pool from '../db';

// Interface para estender o tipo Request
interface RequestWithUsuario extends Request {
  usuario?: {
    id: number;
    nome?: string;
  };
}

// Registra um novo gasto
async function registrarGasto(req: RequestWithUsuario, res: Response) {
  const { descricao, categoria, valor} = req.body;
  const usuario_id = req.usuario?.id;

  if (!usuario_id) {
    return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
  }

  if (!descricao || !categoria  || !valor) {
    return res.status(400).json({ mensagem: 'Descrição, Categoria e valor são obrigatórios.' });
  }

  try {
    const data = new Date();

    // Insere o novo gasto no banco de dados
    const [result] = await pool.query(
      'INSERT INTO gastos (descricao, categoria, valor, data, usuario_id) VALUES (?, ?, ?, ?, ?)',
      [descricao, categoria, valor, data, usuario_id]
    );

    res.status(201).json({
      mensagem: 'Gasto registrado com sucesso!',
      gasto: { id: (result as any).insertId, descricao, categoria, valor, data }
    });
  } catch (error) {
    console.error('Erro ao registrar gasto:', error);
    res.status(500).json({ mensagem: 'Erro ao registrar gasto.' });
  }
}

// Lista todos os gastos
async function listarGastos(req: RequestWithUsuario, res: Response) {
  const usuario_id = req.usuario?.id;

  if (!usuario_id) {
    return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
  }

  try {
    // Busca todos os gastos do usuário logado no banco de dados
    const [rows] = await pool.query(
      'SELECT * FROM gastos WHERE usuario_id = ? ORDER BY data DESC',
      [usuario_id]
    );

    res.status(200).json(rows);
  } catch (error) {
    console.error('Erro ao listar gastos:', error);
    res.status(500).json({ mensagem: 'Erro ao listar gastos.' });
  }
}

// ✏️ Atualiza um gasto existente pelo ID
async function atualizarGasto(req: RequestWithUsuario, res: Response) {
    const id = parseInt(req.params.id);
    const { descricao, categoria, valor } = req.body;
    const usuario_id = req.usuario?.id;
  
    if (!usuario_id) {
      return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
    }
  
    try {
      const [result] = await pool.execute(
        'UPDATE gastos SET descricao = ?, categoria = ?, valor = ? WHERE id = ? AND usuario_id = ?',
        [descricao, categoria, valor, id, usuario_id]
      );
  
      // Verifica se alguma linha foi afetada
      if ((result as any).affectedRows === 0) {
        return res.status(404).json({ mensagem: 'Gasto não encontrado.' });
      }
  
      res.status(200).json({ mensagem: 'Gasto atualizado com sucesso!' });
    } catch (erro) {
      res.status(500).json({ erro: 'Erro ao atualizar gasto.' });
    }
}

// 🗑️ Excluir um gasto
async function excluirGasto(req: RequestWithUsuario, res: Response) {
    const id = parseInt(req.params.id);
    const usuario_id = req.usuario?.id;
  
    if (!usuario_id) {
      return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
    }
  
    if (isNaN(id)) {
      return res.status(400).json({ mensagem: 'ID inválido.' });
    }
  
    try {
      const [resultado] = await pool.execute(
        'DELETE FROM gastos WHERE id = ? AND usuario_id = ?',
        [id, usuario_id]
      );
  
      if ((resultado as any).affectedRows === 0) {
        return res.status(404).json({ mensagem: 'Gasto não encontrado.' });
      }
  
      res.status(200).json({ mensagem: 'Gasto excluído com sucesso!' });
    } catch (erro) {
      console.error(erro);
      res.status(500).json({ mensagem: 'Erro ao excluir gasto.' });
    }
}

// 🔍 Filtrar gastos por período
async function filtrarGastosPorPeriodo(req: RequestWithUsuario, res: Response) {
    const { inicio, fim } = req.query;
    const usuario_id = req.usuario?.id;
  
    if (!usuario_id) {
      return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
    }
  
    if (!inicio || !fim) {
      return res.status(400).json({
        mensagem: 'Informe as datas de início e fim no formato YYYY-MM-DD.',
      });
    }
  
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM gastos WHERE data BETWEEN ? AND ? AND usuario_id = ?',
        [inicio, fim, usuario_id]
      );
  
      if ((rows as any[]).length === 0) {
        return res.status(404).json({
          mensagem: 'Nenhum gasto encontrado nesse período.',
        });
      }
  
      res.status(200).json(rows);
    } catch (erro) {
      console.error(erro);
      res.status(500).json({
        mensagem: 'Erro ao buscar gastos por período.',
      });
    }
}

// 🔍 Filtra os gastos por categoria
async function filtrarPorCategoria(req: RequestWithUsuario, res: Response) {
    const categoria = req.query.categoria as string;
    const usuario_id = req.usuario?.id;
  
    if (!usuario_id) {
      return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
    }
  
    if (!categoria) {
      return res.status(400).json({ mensagem: 'Informe a categoria a ser filtrada.' });
    }
  
    try {
      const [resultado] = await pool.execute(
        'SELECT * FROM gastos WHERE categoria = ? AND usuario_id = ? ORDER BY data DESC',
        [categoria, usuario_id]
      );
  
      const gastos = resultado as any[];
  
      if (gastos.length === 0) {
        return res.status(404).json({ mensagem: `Nenhum gasto encontrado na categoria "${categoria}".` });
      }
  
      res.status(200).json(gastos);
    } catch (erro) {
      console.error(erro);
      res.status(500).json({ mensagem: 'Erro ao buscar gastos por categoria.' });
    }
}

// 📅 Função que calcula o total gasto no mês atual
// 📅 Função que calcula o total gasto no mês atual
async function totalMesAtual(req: RequestWithUsuario, res: Response) {
  const usuario_id = req.usuario?.id;
  
  if (!usuario_id) {
    return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
  }

  try {
    console.log("Calculando total de gastos para o usuário ID:", usuario_id);
    
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    const ultimoDia = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0, 23, 59, 59);

    console.log("Período de busca:", primeiroDia, "até", ultimoDia);

    const [linhas]: any = await pool.execute(
      'SELECT SUM(valor) AS total FROM gastos WHERE data BETWEEN ? AND ? AND usuario_id = ?',
      [primeiroDia, ultimoDia, usuario_id]
    );

    const total = linhas[0].total || 0;
    console.log("Total de gastos calculado:", total);

    res.status(200).json({ total: Number(total) });
  } catch (erro) {
    console.error("Erro ao calcular total de gastos:", erro);
    res.status(500).json({ mensagem: 'Erro ao calcular o total do mês.' });
  }
}

// Total gasto por categoria no mês atual
async function resumoPorCategoria(req: RequestWithUsuario, res: Response) {
  const usuario_id = req.usuario?.id;
  
  if (!usuario_id) {
    return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
  }

  try {
    const [resultado] = await pool.execute(
      `SELECT categoria, SUM(valor) AS total
       FROM gastos
       WHERE MONTH(data) = MONTH(CURDATE()) AND YEAR(data) = YEAR(CURDATE()) AND usuario_id = ?
       GROUP BY categoria`,
      [usuario_id]
    );

    res.status(200).json(resultado);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao gerar resumo por categoria.' });
  }
}

// 💰 Retorna o total gasto em um período
async function totalGastosPorPeriodo(req: RequestWithUsuario, res: Response) {
  const { inicio, fim } = req.query;
  const usuario_id = req.usuario?.id;
  
  if (!usuario_id) {
    return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
  }

  if (!inicio || !fim) {
    return res.status(400).json({ mensagem: 'Informe as datas de início e fim no formato YYYY-MM-DD.' });
  }

  try {
    const [linhas] = await pool.execute(
      'SELECT SUM(valor) AS total FROM gastos WHERE data BETWEEN ? AND ? AND usuario_id = ?',
      [inicio, fim, usuario_id]
    );

    const resultado: any = linhas;
    const total = resultado[0].total;
    
    if (total === null) {
      return res.status(200).json({ mensagem: 'Nenhum gasto registrado nesse período.', total: 0 });
    }

    res.status(200).json({ total });

  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao calcular o total de gastos no período.' });
  }
}

// CommonJS exports
module.exports = { 
  registrarGasto, 
  listarGastos, 
  atualizarGasto, 
  excluirGasto, 
  filtrarGastosPorPeriodo,
  filtrarPorCategoria, 
  totalMesAtual, 
  resumoPorCategoria, 
  totalGastosPorPeriodo 
};