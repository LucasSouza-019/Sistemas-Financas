import { Router } from 'express';
const router = Router();

// Importa as funções do controller
const {
  cadastrarRecebimento,
  listarRecebimentos,
  atualizarRecebimento,
  excluirRecebimento,
  proximosRecebimentos,
  totalRecebimentosMensais
} = require('../controllers/recebimentosController');

// Middleware de autenticação (você provavelmente já tem um)
const autenticarToken = require('../middlewares/autenticacao');

// Rotas com autenticação
router.use(autenticarToken);

// CRUD básico
router.post('/', cadastrarRecebimento);
router.get('/', listarRecebimentos);
router.put('/:id', atualizarRecebimento);
router.delete('/:id', excluirRecebimento);

// Rotas extras
router.get('/proximos', proximosRecebimentos);
router.get('/total-mensal', totalRecebimentosMensais);

// CommonJS export
module.exports = router;