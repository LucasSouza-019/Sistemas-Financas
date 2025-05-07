import { Router } from 'express';
const router = Router();

// Corrigido para apontar para o controller correto
const { cadastrarUsuario, loginUsuario, listarUsuarios } = require('../controllers/usuarioController');

router.post('/cadastro', cadastrarUsuario);
router.post('/login', loginUsuario);
router.get('/usuarios', listarUsuarios);

// CommonJS export
module.exports = router;