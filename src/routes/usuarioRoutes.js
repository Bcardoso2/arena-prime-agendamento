// src/routes/usuarioRoutes.js
const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { proteger } = require('../middleware/authMiddleware');

router.post('/', usuarioController.criarUsuario);
router.post('/login', usuarioController.login);

// --- NOVA ROTA ADICIONADA ---
// GET /api/usuarios/clientes - Retorna uma lista de todos os clientes
router.get('/clientes', proteger, usuarioController.listarClientes);

module.exports = router;