// src/routes/agendamentoRoutes.js
const express = require('express');
const router = express.Router();
const agendamentoController = require('../controllers/agendamentoController');
const { proteger } = require('../middleware/authMiddleware');

router.post('/admin', proteger, agendamentoController.criarAgendamentoAdmin);
router.post('/', proteger, agendamentoController.solicitarAgendamento);
router.get('/', proteger, agendamentoController.listarAgendamentosPorData);
router.get('/pendentes', proteger, agendamentoController.listarPendentes);
router.get('/meus-agendamentos', proteger, agendamentoController.listarMeusAgendamentos);
router.put('/:id/status', proteger, agendamentoController.atualizarStatus);

// --- NOVA ROTA ADICIONADA ---
router.put('/:id/cancelar', proteger, agendamentoController.cancelarAgendamento);

router.post('/:id_agendamento/confirmar-pagamento', proteger, agendamentoController.confirmarPagamento);

module.exports = router;