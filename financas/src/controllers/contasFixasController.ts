import { Request, Response } from 'express';
import pool from '../db';

// Interface para estender o tipo Request
interface RequestWithUsuario extends Request {
  usuario?: {
    id: number;
    nome?: string;
  };
}

// Cadastrar nova conta fixa
async function cadastrarContaFixa(req: RequestWithUsuario, res: Response) {
  const { descricao, valor_total, dia_vencimento, categoria } = req.body;
  const usuario_id = req.usuario?.id;

  if (!usuario_id) {
    return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
  }

  if (!descricao || !valor_total || !dia_vencimento) {
    return res.status(400).json({ mensagem: 'Descrição, valor e dia de vencimento são obrigatórios.' });
  }

  // Validar dia do mês
  if (dia_vencimento < 1 || dia_vencimento > 31) {
    return res.status(400).json({ mensagem: 'Dia de vencimento deve estar entre 1 e 31.' });
  }

  try {
    const [result] = await pool.execute(
      'INSERT INTO contas_fixas (usuario_id, descricao, valor_total, dia_vencimento, categoria, parcelas_total, parcelas_pagas, data_inicio, status) VALUES (?, ?, ?, ?, ?, 1, 0, CURDATE(), "ativo")',
      [usuario_id, descricao, valor_total, dia_vencimento, categoria || 'cartao']
    );

    res.status(201).json({
      mensagem: 'Conta fixa cadastrada com sucesso!',
      conta_fixa: {
        id: (result as any).insertId,
        descricao,
        valor_total,
        dia_vencimento,
        categoria: categoria || 'cartao'
      }
    });
  } catch (erro) {
    console.error('Erro ao cadastrar conta fixa:', erro);
    res.status(500).json({ mensagem: 'Erro ao cadastrar conta fixa.' });
  }
}

// Listar todas as contas fixas do usuário
async function listarContasFixas(req: RequestWithUsuario, res: Response) {
  const usuario_id = req.usuario?.id;

  if (!usuario_id) {
    return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
  }

  try {
    console.log("Buscando contas fixas para o usuário ID:", usuario_id);
    
    const [rows] = await pool.execute(
      'SELECT * FROM contas_fixas WHERE usuario_id = ? ORDER BY dia_vencimento',
      [usuario_id]
    );

    console.log("Contas fixas encontradas:", rows);
    res.status(200).json(rows);
  } catch (erro) {
    console.error('Erro ao listar contas fixas:', erro);
    res.status(500).json({ mensagem: 'Erro ao listar contas fixas.' });
  }
}

// Atualizar uma conta fixa
async function atualizarContaFixa(req: RequestWithUsuario, res: Response) {
  const id = parseInt(req.params.id);
  const { descricao, valor_total, dia_vencimento, categoria } = req.body;
  const usuario_id = req.usuario?.id;

  if (!usuario_id) {
    return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
  }

  try {
    const [result] = await pool.execute(
      'UPDATE contas_fixas SET descricao = ?, valor_total = ?, dia_vencimento = ?, categoria = ? WHERE id = ? AND usuario_id = ?',
      [descricao, valor_total, dia_vencimento, categoria, id, usuario_id]
    );

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ mensagem: 'Conta fixa não encontrada.' });
    }

    res.status(200).json({ mensagem: 'Conta fixa atualizada com sucesso!' });
  } catch (erro) {
    console.error('Erro ao atualizar conta fixa:', erro);
    res.status(500).json({ mensagem: 'Erro ao atualizar conta fixa.' });
  }
}

// Excluir uma conta fixa
async function excluirContaFixa(req: RequestWithUsuario, res: Response) {
  const id = parseInt(req.params.id);
  const usuario_id = req.usuario?.id;

  if (!usuario_id) {
    return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
  }

  try {
    const [result] = await pool.execute(
      'DELETE FROM contas_fixas WHERE id = ? AND usuario_id = ?',
      [id, usuario_id]
    );

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ mensagem: 'Conta fixa não encontrada.' });
    }

    res.status(200).json({ mensagem: 'Conta fixa excluída com sucesso!' });
  } catch (erro) {
    console.error('Erro ao excluir conta fixa:', erro);
    res.status(500).json({ mensagem: 'Erro ao excluir conta fixa.' });
  }
}

// Total de contas fixas mensais
async function totalContasFixasMensais(req: RequestWithUsuario, res: Response) {
  const usuario_id = req.usuario?.id;

  if (!usuario_id) {
    return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
  }

  try {
    console.log("Calculando total de contas fixas para o usuário ID:", usuario_id);
    
    const [resultado] = await pool.execute(
      'SELECT SUM(valor_total) as total FROM contas_fixas WHERE usuario_id = ? AND status = "ativo"',
      [usuario_id]
    );

    const total = (resultado as any)[0].total || 0;
    console.log("Total de contas fixas calculado:", total);
    
    res.status(200).json({ total });
  } catch (erro) {
    console.error('Erro ao calcular total de contas fixas:', erro);
    res.status(500).json({ mensagem: 'Erro ao calcular total de contas fixas.' });
  }
}

// CommonJS exports
module.exports = {
  cadastrarContaFixa,
  listarContasFixas,
  atualizarContaFixa,
  excluirContaFixa,
  totalContasFixasMensais
};