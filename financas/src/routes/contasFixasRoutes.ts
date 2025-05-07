import { Router } from 'express';
const router = Router();

// Importa as funções do controller com require
const { 
  cadastrarContaFixa, 
  listarContasFixas, 
  atualizarContaFixa, 
  excluirContaFixa, 
  totalContasFixasMensais 
} = require('../controllers/contasFixasController');

// Middleware de autenticação (você provavelmente já tem um)
const autenticarToken = require('../middlewares/autenticacao');

// Rotas com autenticação
router.use(autenticarToken);

// CRUD básico
router.post('/', cadastrarContaFixa);
router.get('/', listarContasFixas);
router.put('/:id', atualizarContaFixa);
router.delete('/:id', excluirContaFixa);

// Rota para total mensal
router.get('/total-mensal', totalContasFixasMensais);

// CommonJS export
module.exports = router;