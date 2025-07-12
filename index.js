// index.js

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// A importação do db.js garante que a conexão seja testada na inicialização
const db = require('./src/config/db'); 

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Importa as rotas
const usuarioRoutes = require('./src/routes/usuarioRoutes');
const agendamentoRoutes = require('./src/routes/agendamentoRoutes');
const fluxoCaixaRoutes = require('./src/routes/fluxoCaixaRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');

// Define uma rota principal para a API
app.get('/api', (req, res) => {
  res.json({ message: 'API Arena Prime Portel - FUNCIONAL' });
});

// Usa os roteadores para organizar os endpoints
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/agendamentos', agendamentoRoutes);
app.use('/api/caixa', fluxoCaixaRoutes);
app.use('/api/notifications', notificationRoutes);


// Inicia o servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});