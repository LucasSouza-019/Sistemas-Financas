import { Router } from 'express';
const router = Router();

// Importa as funções do controller
const {
  obterEconomiaUsuario,
  salvarEconomia,
  adicionarValor,
  removerValor
} = require('../controllers/economiaController');

// Middleware de autenticação
const autenticarToken = require('../middlewares/autenticacao');

// Rotas com autenticação
router.use(autenticarToken);

// Obter a economia do usuário
router.get('/', obterEconomiaUsuario);

// Salvar ou atualizar a economia
router.post('/', salvarEconomia);

// Adicionar valor à economia
router.post('/adicionar', adicionarValor);

// Remover valor da economia
router.post('/remover', removerValor);

// CommonJS export
module.exports = router;