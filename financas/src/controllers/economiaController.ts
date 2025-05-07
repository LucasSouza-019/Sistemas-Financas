import { Request, Response } from 'express';
import pool from '../db';

// Interface para estender o tipo Request
interface RequestWithUsuario extends Request {
  usuario?: {
    id: number;
    nome?: string;
  };
}

// Obter a economia do usuário
async function obterEconomiaUsuario(req: RequestWithUsuario, res: Response) {
  const usuario_id = req.usuario?.id;

  if (!usuario_id) {
    return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
  }

  try {
    console.log("Buscando economia para o usuário ID:", usuario_id);
    
    const [rows] = await pool.execute(
      'SELECT * FROM economias WHERE usuario_id = ?',
      [usuario_id]
    );

    if ((rows as any[]).length === 0) {
      return res.json({ 
        valor_atual: 0, 
        valor_meta: 0, 
        data_atualizacao: null 
      });
    }

    console.log("Economia encontrada:", rows);
    res.status(200).json((rows as any[])[0]);
  } catch (erro) {
    console.error('Erro ao buscar economia:', erro);
    res.status(500).json({ mensagem: 'Erro ao obter dados de economia.' });
  }
}

// Salvar ou atualizar a economia
async function salvarEconomia(req: RequestWithUsuario, res: Response) {
  const { valor_atual, valor_meta } = req.body;
  const usuario_id = req.usuario?.id;

  if (!usuario_id) {
    return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
  }

  // Validar os dados
  if (valor_atual === undefined || valor_meta === undefined) {
    return res.status(400).json({ mensagem: 'Valor atual e meta são obrigatórios.' });
  }

  // Converter para número e validar
  const valorAtual = parseFloat(valor_atual);
  const valorMeta = parseFloat(valor_meta);
  
  if (isNaN(valorAtual) || isNaN(valorMeta) || valorAtual < 0 || valorMeta < 0) {
    return res.status(400).json({ mensagem: 'Valores inválidos.' });
  }

  try {
    // Verificar se já existe um registro para este usuário
    const [registros] = await pool.execute(
      'SELECT id FROM economias WHERE usuario_id = ?',
      [usuario_id]
    );

    const dataAtual = new Date().toISOString().split('T')[0];

    if ((registros as any[]).length === 0) {
      // Não existe, então criar novo registro
      const [result] = await pool.execute(
        'INSERT INTO economias (usuario_id, valor_atual, valor_meta, data_atualizacao) VALUES (?, ?, ?, ?)',
        [usuario_id, valorAtual, valorMeta, dataAtual]
      );

      res.status(201).json({
        mensagem: 'Economia cadastrada com sucesso!',
        economia: {
          id: (result as any).insertId,
          valor_atual: valorAtual,
          valor_meta: valorMeta,
          data_atualizacao: dataAtual
        }
      });
    } else {
      // Já existe, então atualizar
      const id = (registros as any[])[0].id;
      await pool.execute(
        'UPDATE economias SET valor_atual = ?, valor_meta = ?, data_atualizacao = ? WHERE id = ?',
        [valorAtual, valorMeta, dataAtual, id]
      );

      res.status(200).json({
        mensagem: 'Economia atualizada com sucesso!',
        economia: {
          id,
          valor_atual: valorAtual,
          valor_meta: valorMeta,
          data_atualizacao: dataAtual
        }
      });
    }
  } catch (erro) {
    console.error('Erro ao salvar economia:', erro);
    res.status(500).json({ mensagem: 'Erro ao salvar economia.' });
  }
}

// Adicionar valor à economia
async function adicionarValor(req: RequestWithUsuario, res: Response) {
  const { valor } = req.body;
  const usuario_id = req.usuario?.id;

  if (!usuario_id) {
    return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
  }

  // Validar o valor
  if (valor === undefined) {
    return res.status(400).json({ mensagem: 'Valor não informado.' });
  }

  const valorNumerico = parseFloat(valor);
  
  if (isNaN(valorNumerico) || valorNumerico <= 0) {
    return res.status(400).json({ mensagem: 'Valor inválido.' });
  }

  try {
    // Buscar economia atual
    const [registros] = await pool.execute(
      'SELECT * FROM economias WHERE usuario_id = ?',
      [usuario_id]
    );

    const dataAtual = new Date().toISOString().split('T')[0];

    if ((registros as any[]).length === 0) {
      // Não existe, então criar novo registro
      const [result] = await pool.execute(
        'INSERT INTO economias (usuario_id, valor_atual, valor_meta, data_atualizacao) VALUES (?, ?, 0, ?)',
        [usuario_id, valorNumerico, dataAtual]
      );

      res.status(201).json({
        mensagem: 'Valor adicionado com sucesso!',
        economia: {
          id: (result as any).insertId,
          valor_atual: valorNumerico,
          valor_meta: 0,
          data_atualizacao: dataAtual
        }
      });
    } else {
      // Já existe, então atualizar
      const economia = (registros as any[])[0];
      const novoValor = economia.valor_atual + valorNumerico;
      
      await pool.execute(
        'UPDATE economias SET valor_atual = ?, data_atualizacao = ? WHERE id = ?',
        [novoValor, dataAtual, economia.id]
      );

      res.status(200).json({
        mensagem: 'Valor adicionado com sucesso!',
        economia: {
          ...economia,
          valor_atual: novoValor,
          data_atualizacao: dataAtual
        }
      });
    }
  } catch (erro) {
    console.error('Erro ao adicionar valor:', erro);
    res.status(500).json({ mensagem: 'Erro ao adicionar valor à economia.' });
  }
}

// Remover valor da economia
async function removerValor(req: RequestWithUsuario, res: Response) {
  const { valor } = req.body;
  const usuario_id = req.usuario?.id;

  if (!usuario_id) {
    return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
  }

  // Validar o valor
  if (valor === undefined) {
    return res.status(400).json({ mensagem: 'Valor não informado.' });
  }

  const valorNumerico = parseFloat(valor);
  
  if (isNaN(valorNumerico) || valorNumerico <= 0) {
    return res.status(400).json({ mensagem: 'Valor inválido.' });
  }

  try {
    // Buscar economia atual
    const [registros] = await pool.execute(
      'SELECT * FROM economias WHERE usuario_id = ?',
      [usuario_id]
    );

    if ((registros as any[]).length === 0) {
      return res.status(404).json({ mensagem: 'Não há registro de economia para este usuário.' });
    }

    // Calcular novo valor
    const economia = (registros as any[])[0];
    const novoValor = Math.max(0, economia.valor_atual - valorNumerico);
    const dataAtual = new Date().toISOString().split('T')[0];
    
    await pool.execute(
      'UPDATE economias SET valor_atual = ?, data_atualizacao = ? WHERE id = ?',
      [novoValor, dataAtual, economia.id]
    );

    res.status(200).json({
      mensagem: 'Valor removido com sucesso!',
      economia: {
        ...economia,
        valor_atual: novoValor,
        data_atualizacao: dataAtual
      }
    });
  } catch (erro) {
    console.error('Erro ao remover valor:', erro);
    res.status(500).json({ mensagem: 'Erro ao remover valor da economia.' });
  }
}

// CommonJS exports
module.exports = {
  obterEconomiaUsuario,
  salvarEconomia,
  adicionarValor,
  removerValor
};