// src/config/db.js

const mysql = require('mysql2/promise');
require('dotenv').config();

// Cria um "pool" de conexões. É a forma mais eficiente de gerenciar múltiplas
// conexões ao banco de dados que o nosso servidor precisará fazer.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Testa a conexão para garantir que tudo está correto ao iniciar
pool.getConnection()
  .then(connection => {
    console.log('✅ Conectado ao banco de dados MySQL com sucesso!');
    connection.release(); // Libera a conexão de teste
  })
  .catch(error => {
    console.error('❌ Erro ao conectar ao banco de dados:', error);
    process.exit(1);
  });

module.exports = pool;