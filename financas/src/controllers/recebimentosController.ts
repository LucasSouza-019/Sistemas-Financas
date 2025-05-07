import { Request, Response } from 'express';
import pool from '../db';

// Interface para estender o tipo Request
interface RequestWithUsuario extends Request {
  usuario?: {
    id: number;
    nome?: string;
  };
}

// Função para cadastrar novo recebimento
async function cadastrarRecebimento(req: RequestWithUsuario, res: Response) {
  const { descricao, valor, dia_recebimento, tipo, recorrencia } = req.body;
  const usuario_id = req.usuario?.id; // Usa o operador opcional

  if (!usuario_id) {
    return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
  }

  if (!descricao || !valor || !dia_recebimento || !tipo) {
    return res.status(400).json({ mensagem: 'Todos os campos são obrigatórios.' });
  }

  // Validar dia do mês
  if (dia_recebimento < 1 || dia_recebimento > 31) {
    return res.status(400).json({ mensagem: 'Dia de recebimento deve estar entre 1 e 31.' });
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO recebimentos (usuario_id, descricao, valor, dia_recebimento, tipo, recorrencia) VALUES (?, ?, ?, ?, ?, ?)',
      [usuario_id, descricao, valor, dia_recebimento, tipo, recorrencia || 'mensal']
    );

    res.status(201).json({
      mensagem: 'Recebimento cadastrado com sucesso!',
      recebimento: {
        id: (result as any).insertId,
        descricao,
        valor,
        dia_recebimento,
        tipo,
        recorrencia: recorrencia || 'mensal'
      }
    });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao cadastrar recebimento.' });
  }
}

// Função para listar recebimentos do usuário
async function listarRecebimentos(req: RequestWithUsuario, res: Response) {
  const usuario_id = req.usuario?.id;

  if (!usuario_id) {
    return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
  }

  try {
    console.log("Buscando recebimentos para o usuário ID:", usuario_id);
    
    const [rows] = await pool.execute(
      'SELECT * FROM recebimentos WHERE usuario_id = ? ORDER BY dia_recebimento',
      [usuario_id]
    );

    console.log("Recebimentos encontrados:", rows);
    res.status(200).json(rows);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao listar recebimentos.' });
  }
}

// Função para atualizar recebimento
async function atualizarRecebimento(req: RequestWithUsuario, res: Response) {
  const id = parseInt(req.params.id);
  const { descricao, valor, dia_recebimento, tipo, recorrencia } = req.body;
  const usuario_id = req.usuario?.id;

  if (!usuario_id) {
    return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
  }

  try {
    const [result] = await pool.execute(
      'UPDATE recebimentos SET descricao = ?, valor = ?, dia_recebimento = ?, tipo = ?, recorrencia = ? WHERE id = ? AND usuario_id = ?',
      [descricao, valor, dia_recebimento, tipo, recorrencia, id, usuario_id]
    );

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ mensagem: 'Recebimento não encontrado.' });
    }

    res.status(200).json({ mensagem: 'Recebimento atualizado com sucesso!' });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao atualizar recebimento.' });
  }
}

// Função para excluir recebimento
async function excluirRecebimento(req: RequestWithUsuario, res: Response) {
  const id = parseInt(req.params.id);
  const usuario_id = req.usuario?.id;

  if (!usuario_id) {
    return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
  }

  try {
    const [result] = await pool.execute(
      'DELETE FROM recebimentos WHERE id = ? AND usuario_id = ?',
      [id, usuario_id]
    );

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ mensagem: 'Recebimento não encontrado.' });
    }

    res.status(200).json({ mensagem: 'Recebimento excluído com sucesso!' });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao excluir recebimento.' });
  }
}

// Próximos recebimentos
async function proximosRecebimentos(req: RequestWithUsuario, res: Response) {
  const usuario_id = req.usuario?.id;

  if (!usuario_id) {
    return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
  }

  const hoje = new Date();
  const diaAtual = hoje.getDate();

  try {
    // Busca recebimentos do mês atual (próximos à data atual)
    const [recebimentos]: any = await pool.execute(
      'SELECT * FROM recebimentos WHERE usuario_id = ? ORDER BY CASE WHEN dia_recebimento >= ? THEN dia_recebimento ELSE dia_recebimento + 31 END',
      [usuario_id, diaAtual]
    );

    res.status(200).json(recebimentos);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao buscar próximos recebimentos.' });
  }
}

// Soma total de recebimentos mensais
// No recebimentosController.ts
async function totalRecebimentosMensais(req: RequestWithUsuario, res: Response) {
  const usuario_id = req.usuario?.id;

  if (!usuario_id) {
    return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
  }

  try {
    console.log("Calculando total de recebimentos para o usuário ID:", usuario_id);
    
    // Consulta SQL mais explícita para debug
    const query = 'SELECT SUM(valor) as total FROM recebimentos WHERE usuario_id = ?';
    console.log("Query SQL:", query);
    console.log("Parâmetros:", [usuario_id]);
    
    const [resultado] = await pool.execute(query, [usuario_id]);

    console.log("Resultado bruto:", resultado);
    const total = (resultado as any)[0].total || 0;
    console.log("Total de recebimentos calculado:", total);
    
    res.status(200).json({ total });
  } catch (erro) {
    console.error("Erro ao calcular total de recebimentos:", erro);
    res.status(500).json({ mensagem: 'Erro ao calcular total de recebimentos.' });
  }
}

// CommonJS exports
module.exports = {
  cadastrarRecebimento,
  listarRecebimentos,
  atualizarRecebimento,
  excluirRecebimento,
  proximosRecebimentos,
  totalRecebimentosMensais
};