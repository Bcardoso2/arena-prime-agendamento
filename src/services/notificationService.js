// src/services/notificationService.js
const webpush = require('web-push');
const db = require('../config/db');

webpush.setVapidDetails(
  'mailto:arenaprimeportel@gmail.com', // Seu e-mail de contato
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// Envia notificação para UM usuário específico
exports.sendNotification = async (userId, payload) => {
  try {
    const [users] = await db.query('SELECT notificacao_sub FROM usuarios WHERE id = ?', [userId]);
    if (users.length > 0 && users[0].notificacao_sub) {
      const subscription = JSON.parse(users[0].notificacao_sub);
      await webpush.sendNotification(subscription, JSON.stringify(payload));
    }
  } catch (error) {
    if (error.statusCode === 410) {
      await db.query('UPDATE usuarios SET notificacao_sub = NULL WHERE id = ?', [userId]);
    } else {
      console.error('Erro ao enviar notificação:', error);
    }
  }
};

// --- NOVA FUNÇÃO ADICIONADA ---
// Envia notificação para TODOS os administradores
exports.sendNotificationToAdmins = async (payload) => {
    try {
        // Busca todas as inscrições de notificação de usuários do tipo 'admin'
        const [admins] = await db.query(
            "SELECT notificacao_sub FROM usuarios WHERE tipo = 'admin' AND notificacao_sub IS NOT NULL"
        );

        if (admins.length > 0) {
            // Cria um array de promessas, uma para cada notificação a ser enviada
            const notificationPromises = admins.map(admin => {
                const subscription = JSON.parse(admin.notificacao_sub);
                return webpush.sendNotification(subscription, JSON.stringify(payload));
            });
            // Envia todas as notificações em paralelo
            await Promise.all(notificationPromises);
        }
    } catch (error) {
        console.error('Erro ao enviar notificação para admins:', error);
    }
};