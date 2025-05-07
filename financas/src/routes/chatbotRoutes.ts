import { Router } from 'express';
const router = Router();

// Importa com require para CommonJS
const { interpretarMensagem } = require('../controllers/chatbotController');

// Importar middleware de autenticação
const autenticarToken = require('../middlewares/autenticacao');

// Aplicar middleware de autenticação à rota do chatbot
router.post('/chatbot', autenticarToken, interpretarMensagem);

// CommonJS export
module.exports = router;