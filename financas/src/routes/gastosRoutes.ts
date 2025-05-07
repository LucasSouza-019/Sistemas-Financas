import { Router } from 'express';
const router = Router();

// Importa as funções do controller com require
const { 
  registrarGasto, 
  listarGastos, 
  atualizarGasto, 
  excluirGasto, 
  filtrarGastosPorPeriodo, 
  filtrarPorCategoria, 
  totalMesAtual,
  resumoPorCategoria,
  totalGastosPorPeriodo 
} = require('../controllers/gastosController');

// 🟢 Rota POST para registrar um novo gasto
router.post('/', registrarGasto);

// 🟡 Rota GET para listar todos os gastos
router.get('/', listarGastos);

router.put('/:id', atualizarGasto);

router.delete('/:id', excluirGasto);

// 🧾 Rota GET para filtrar gastos por período
router.get('/filtrar', filtrarGastosPorPeriodo);
router.get('/filtro', filtrarGastosPorPeriodo);

router.get('/categoria', filtrarPorCategoria);
router.get('/resumo/mes-atual', totalMesAtual);
router.get('/resumo-categorias', resumoPorCategoria);
router.get('/total-periodo', totalGastosPorPeriodo);

// CommonJS export
module.exports = router;