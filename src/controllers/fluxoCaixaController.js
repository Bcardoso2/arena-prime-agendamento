// src/controllers/fluxoCaixaController.js
const db = require('../config/db');

// Admin: Adicionar uma nova transação manual (principalmente saídas)
exports.adicionarTransacao = async (req, res) => {
    const { descricao, valor, tipo_transacao, metodo_pagamento } = req.body;

    if (!descricao || !valor || !tipo_transacao) {
        return res.status(400).json({ message: 'Descrição, valor e tipo são obrigatórios.' });
    }

    try {
        await db.query(
            "INSERT INTO fluxo_caixa (descricao, valor, tipo_transacao, metodo_pagamento, data_transacao) VALUES (?, ?, ?, ?, NOW())",
            [descricao, valor, tipo_transacao, metodo_pagamento]
        );
        res.status(201).json({ message: 'Transação adicionada ao caixa com sucesso!' });
    } catch (error) {
        console.error("Erro ao adicionar transação:", error);
        res.status(500).json({ message: "Erro interno no servidor." });
    }
};

// Admin: Listar todas as transações com saldo total
exports.listarTransacoes = async (req, res) => {
    try {
        const [transacoes] = await db.query("SELECT * FROM fluxo_caixa ORDER BY data_transacao DESC");

        const [saldos] = await db.query(
            "SELECT " +
            "SUM(CASE WHEN tipo_transacao = 'entrada' THEN valor ELSE 0 END) as total_entradas, " +
            "SUM(CASE WHEN tipo_transacao = 'saida' THEN valor ELSE 0 END) as total_saidas " +
            "FROM fluxo_caixa"
        );

        const saldo_atual = (saldos[0].total_entradas || 0) - (saldos[0].total_saidas || 0);

        res.status(200).json({
            transacoes,
            saldo_atual: saldo_atual.toFixed(2),
            total_entradas: (saldos[0].total_entradas || 0).toFixed(2),
            total_saidas: (saldos[0].total_saidas || 0).toFixed(2)
        });

    } catch (error) {
        console.error("Erro ao listar transações:", error);
        res.status(500).json({ message: "Erro interno no servidor." });
    }
};