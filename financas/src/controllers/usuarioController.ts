import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db';
import dotenv from 'dotenv';

dotenv.config();

// 👉 Cadastro
async function cadastrarUsuario(req: Request, res: Response) {
  const { nome, email, senha } = req.body;

  if (!nome || !email || !senha) {
    return res.status(400).json({ mensagem: 'Preencha todos os campos.' });
  }

  try {
    const hashedSenha = await bcrypt.hash(senha, 10);
    await pool.execute(
      'INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)',
      [nome, email, hashedSenha]
    );
    res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso!' });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao cadastrar usuário.' });
  }
}

// 👉 Login
async function loginUsuario(req: Request, res: Response) {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ mensagem: 'Email e senha são obrigatórios.' });
  }

  try {
    const [usuarios]: any = await pool.query(
      'SELECT * FROM usuarios WHERE email = ?',
      [email]
    );

    const usuario = usuarios[0];

    if (!usuario || !(await bcrypt.compare(senha, usuario.senha))) {
      return res.status(401).json({ mensagem: 'Credenciais inválidas.' });
    }

    const token = jwt.sign({ id: usuario.id, nome: usuario.nome }, process.env.JWT_SECRET!, {
      expiresIn: '1d'
    });

    res.status(200).json({ mensagem: 'Login bem-sucedido!', token });
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao fazer login.' });
  }
  
}

async function listarUsuarios(req: Request, res: Response) {
  try {
    const [usuarios]: any = await pool.query('SELECT id, nome, email FROM usuarios');
    res.status(200).json(usuarios);
  } catch (erro) {
    console.error(erro);
    res.status(500).json({ mensagem: 'Erro ao listar usuários.' });
  }
}


// CommonJS exports
module.exports = { cadastrarUsuario, loginUsuario,listarUsuarios};