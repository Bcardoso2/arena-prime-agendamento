// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const proteger = (req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'um_segredo_muito_forte');
            req.user = decoded; // Adiciona os dados do usuário (id, tipo) à requisição
            next();
        } catch (error) {
            res.status(401).json({ message: 'Não autorizado, token falhou' });
        }
    }
    if (!token) {
        res.status(401).json({ message: 'Não autorizado, sem token' });
    }
};

module.exports = { proteger };