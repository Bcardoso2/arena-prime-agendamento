// src/controllers/notificationController.js
const db = require('../config/db');

exports.subscribe = async (req, res) => {
  const { subscription } = req.body;
  const userId = req.user.id; // Pego do token

  try {
    await db.query(
      'UPDATE usuarios SET notificacao_sub = ? WHERE id = ?',
      [JSON.stringify(subscription), userId]
    );
    res.status(200).json({ message: 'Inscrição para notificações realizada com sucesso!' });
  } catch (error) {
    console.error('Erro ao salvar inscrição:', error);
    res.status(500).json({ message: 'Erro ao salvar inscrição.' });
  }
};