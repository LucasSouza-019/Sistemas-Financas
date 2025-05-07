import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Middleware de autenticação
function autenticarToken(req: Request & { usuario?: any }, res: Response, next: NextFunction) {
  // Busca o header de autorização
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ mensagem: 'Token não fornecido.' });
  }

  try {
    // Verifica o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Adiciona as informações do usuário à requisição
    req.usuario = {
      id: decoded.id,
      nome: decoded.nome
    };

    // Continua para o próximo middleware ou controlador
    next();
  } catch (erro) {
    console.error(erro);
    return res.status(401).json({ mensagem: 'Token inválido ou expirado.' });
  }
}

// CommonJS export
module.exports = autenticarToken;