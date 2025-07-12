// src/routes/fluxoCaixaRoutes.js
const express = require('express');
const router = express.Router();
const fluxoCaixaController = require('../controllers/fluxoCaixaController');

// Rotas acessíveis apenas pelo admin (precisaremos de um middleware de autorização no futuro)
router.post('/', fluxoCaixaController.adicionarTransacao);
router.get('/', fluxoCaixaController.listarTransacoes);

module.exports = router;