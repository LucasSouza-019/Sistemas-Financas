import { Request, Response } from 'express';
import pool from '../db';

export async function interpretarMensagem(req: Request & { usuario?: any }, res: Response) {
  const { mensagem } = req.body;
  const usuario_id = req.usuario?.id;

  if (!mensagem) {
    return res.status(400).json({ mensagem: 'Mensagem não enviada.' });
  }

  if (!usuario_id) {
    return res.status(401).json({ mensagem: 'Usuário não autenticado.' });
  }

  try {
    // 👉 Registrar gasto
    const regex = /gastei\s+(\d+(?:[.,]\d{1,2})?)\s+com\s+(.+)/i;
    const match = mensagem.match(regex);

    if (match) {
      const valor = parseFloat(match[1].replace(',', '.'));
      const categoria = match[2].trim().toLowerCase();

      await pool.execute(
        'INSERT INTO gastos (descricao, categoria, valor, data, usuario_id) VALUES (?, ?, ?, ?, ?)',
        ['Adicionado via chat', categoria, valor, new Date(), usuario_id]
      );

      const respostaBot = `✅ Gasto de R$${valor.toFixed(2)} com *${categoria}* registrado com sucesso!`;
      return res.status(200).json({ mensagem: respostaBot });
    }

    // 👉 Gasto de hoje
    if (/quanto\s+gastei\s+hoje|gastos\s+do\s+dia|meu\s+gasto\s+hoje/i.test(mensagem)) {
      const hoje = new Date();
      const inicio = new Date(hoje.setHours(0, 0, 0, 0));
      const fim = new Date(hoje.setHours(23, 59, 59, 999));
    
      const [rows]: any = await pool.query(
        'SELECT SUM(valor) AS total FROM gastos WHERE data BETWEEN ? AND ? AND usuario_id = ?',
        [inicio, fim, usuario_id]
      );
    
      const total = rows[0].total || 0;
      const respostaBot = `🗓️ Você gastou R$${total.toFixed(2)} hoje.`;
      return res.status(200).json({ mensagem: respostaBot });
    }

    // 👉 Gasto do mês
    if (/quanto\s+gastei\s+(esse\s+)?m[eê]s|gastos\s+do\s+m[eê]s|gasto\s+mensal/i.test(mensagem)) {
      const agora = new Date();
      const ano = agora.getFullYear();
      const mes = agora.getMonth() + 1;

      const [rows]: any = await pool.query(
        'SELECT SUM(valor) AS total FROM gastos WHERE YEAR(data) = ? AND MONTH(data) = ? AND usuario_id = ?',
        [ano, mes, usuario_id]
      );

      const total = rows[0].total || 0;
      const respostaBot = `📅 Total de gastos no mês: R$${total.toFixed(2)}.`;
      return res.status(200).json({ mensagem: respostaBot });
    }

    // 👉 Mensagem não reconhecida
    return res.status(200).json({
      mensagem: 'Formato da mensagem inválido. Exemplo: "gastei 50 com comida" ou "quanto gastei hoje?"'
    });

  } catch (erro) {
    console.error('Erro no chatbot:', erro);
    return res.status(500).json({ mensagem: 'Erro ao interpretar mensagem.' });
  }
}

// CommonJS exports
module.exports = { interpretarMensagem };