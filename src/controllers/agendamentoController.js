// src/controllers/agendamentoController.js
const db = require('../config/db');
// Agora importamos ambas as funções do nosso serviço
const { sendNotification, sendNotificationToAdmins } = require('../services/notificationService');

// Cliente: Criar uma solicitação de agendamento
exports.solicitarAgendamento = async (req, res) => {
    const { data_hora_inicio, preco } = req.body;
    const { id: id_usuario, nome: nome_usuario } = req.user;
    const formatarParaMySQL = (data) => new Date(data).toISOString().slice(0, 19).replace('T', ' ');
    const dataInicioObj = new Date(data_hora_inicio);
    const dataFimObj = new Date(dataInicioObj.getTime() + 60 * 60 * 1000);
    const dataInicioFormatada = formatarParaMySQL(dataInicioObj);
    const dataFimFormatada = formatarParaMySQL(dataFimObj);

    try {
        const [resultado] = await db.query(
            'INSERT INTO agendamentos (id_usuario, data_hora_inicio, data_hora_fim, preco, status) VALUES (?, ?, ?, ?, ?)',
            [id_usuario, dataInicioFormatada, dataFimFormatada, preco, 'pendente_aprovacao']
        );

        // --- NOTIFICAÇÃO PARA O ADMIN ---
        const payload = {
            title: 'Nova Solicitação de Horário! 🗓️',
            body: `${nome_usuario} solicitou o horário das ${dataInicioObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.`
        };
        await sendNotificationToAdmins(payload);
        // --- FIM DA NOTIFICAÇÃO ---
        
        res.status(201).json({ message: 'Solicitação de agendamento enviada com sucesso!', id: resultado.insertId });
    } catch (error) {
        console.error("Erro ao solicitar agendamento:", error);
        res.status(500).json({ message: "Erro interno no servidor." });
    }
};

// Cliente/Admin: Listar agendamentos (por dia)
exports.listarAgendamentosPorData = async (req, res) => {
    const { data } = req.query;
    try {
        const [agendamentos] = await db.query(
            `SELECT a.id, a.data_hora_inicio, a.status, u.nome as nome_cliente 
             FROM agendamentos a 
             JOIN usuarios u ON a.id_usuario = u.id 
             WHERE DATE(a.data_hora_inicio) = ?`, [data]);
        res.status(200).json(agendamentos);
    } catch (error) {
        console.error("Erro ao listar agendamentos por data:", error);
        res.status(500).json({ message: "Erro interno no servidor." });
    }
};

// Admin: Listar agendamentos pendentes
exports.listarPendentes = async (req, res) => {
    try {
        const [pendentes] = await db.query(
            `SELECT a.id, a.data_hora_inicio, a.preco, a.status, u.nome as nome_cliente 
             FROM agendamentos a 
             JOIN usuarios u ON a.id_usuario = u.id 
             WHERE a.status = 'pendente_aprovacao' 
             ORDER BY a.data_hora_inicio ASC`
        );
        res.status(200).json(pendentes);
    } catch (error) {
        console.error("Erro ao listar pendentes:", error);
        res.status(500).json({ message: "Erro interno no servidor." });
    }
};


// Admin: Atualizar status de um agendamento (Aprovar/Reprovar)
exports.atualizarStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
        const [agendamentos] = await db.query('SELECT id_usuario FROM agendamentos WHERE id = ?', [id]);
        
        if (agendamentos.length > 0) {
            await db.query('UPDATE agendamentos SET status = ? WHERE id = ?', [status, id]);
            
            if (status === 'aguardando_pagamento') {
                const payload = {
                    title: 'Seu horário foi APROVADO! ✅',
                    body: 'Seu agendamento na Arena Prime foi confirmado. Realize o pagamento para garantir sua vaga.'
                };
                await sendNotification(agendamentos[0].id_usuario, payload);
            }
        }
        
        res.status(200).json({ message: 'Status do agendamento atualizado com sucesso!' });
    } catch (error) {
        console.error("Erro ao atualizar status:", error);
        res.status(500).json({ message: "Erro interno no servidor." });
    }
};

// Admin: Confirmar pagamento e registrar no caixa
exports.confirmarPagamento = async (req, res) => {
    const { id_agendamento } = req.params;
    const { metodo_pagamento } = req.body;
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        const [updateInfo] = await connection.query("UPDATE agendamentos SET status = 'pago' WHERE id = ?", [id_agendamento]);
        if (updateInfo.affectedRows === 0) throw new Error('Agendamento não encontrado ou já processado.');
        const [agendamento] = await connection.query('SELECT id_usuario, preco FROM agendamentos WHERE id = ?', [id_agendamento]);
        const valor = agendamento[0].preco;
        const [pagamentoResult] = await connection.query("INSERT INTO pagamentos (id_agendamento, valor, metodo_pagamento, status_pagamento) VALUES (?, ?, ?, 'concluido')", [id_agendamento, valor, metodo_pagamento]);
        const id_pagamento = pagamentoResult.insertId;
        const descricao = `Pagamento do Agendamento #${id_agendamento}`;
        await connection.query("INSERT INTO fluxo_caixa (descricao, valor, tipo_transacao, metodo_pagamento, id_pagamento_origem, data_transacao) VALUES (?, ?, 'entrada', ?, ?, NOW())", [descricao, valor, metodo_pagamento, id_pagamento]);
        
        const payload = {
            title: 'Pagamento Confirmado! 🎉',
            body: `Seu pagamento para o agendamento foi confirmado. Bom jogo!`
        };
        await sendNotification(agendamento[0].id_usuario, payload);

        await connection.commit();
        res.status(200).json({ message: 'Pagamento confirmado e lançado no caixa!' });
    } catch (error) {
        await connection.rollback();
        console.error("Erro ao confirmar pagamento:", error);
        res.status(500).json({ message: "Erro interno no servidor: " + error.message });
    } finally {
        connection.release();
    }
};

// Cliente: Listar seus próprios agendamentos
exports.listarMeusAgendamentos = async (req, res) => {
    const id_usuario = req.user.id; 
    try {
        const [agendamentos] = await db.query(
            `SELECT id, data_hora_inicio, preco, status 
             FROM agendamentos 
             WHERE id_usuario = ? 
             ORDER BY data_hora_inicio DESC`, [id_usuario]);
        res.status(200).json(agendamentos);
    } catch (error) {
        console.error("Erro ao listar meus agendamentos:", error);
        res.status(500).json({ message: "Erro interno no servidor." });
    }
};

// Admin: Criar um novo agendamento diretamente
exports.criarAgendamentoAdmin = async (req, res) => {
    const { id_usuario, data_hora_inicio, preco } = req.body;
    if (!id_usuario || !data_hora_inicio || !preco) return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    const formatarParaMySQL = (data) => new Date(data).toISOString().slice(0, 19).replace('T', ' ');
    const dataInicioObj = new Date(data_hora_inicio);
    const dataFimObj = new Date(dataInicioObj.getTime() + 60 * 60 * 1000);
    const dataInicioFormatada = formatarParaMySQL(dataInicioObj);
    const dataFimFormatada = formatarParaMySQL(dataFimObj);
    try {
        await db.query("INSERT INTO agendamentos (id_usuario, data_hora_inicio, data_hora_fim, preco, status) VALUES (?, ?, ?, ?, 'aguardando_pagamento')", [id_usuario, dataInicioFormatada, dataFimFormatada, preco]);
        
        const payload = {
            title: 'Novo agendamento criado para você!',
            body: `O administrador agendou um novo horário para você no dia ${new Date(data_hora_inicio).toLocaleDateString('pt-BR')}.`
        };
        await sendNotification(id_usuario, payload);

        res.status(201).json({ message: 'Agendamento criado pelo admin com sucesso!' });
    } catch (error) {
        console.error("Erro ao criar agendamento pelo admin:", error);
        if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Este horário já está ocupado.' });
        res.status(500).json({ message: "Erro interno no servidor." });
    }
};

// Cliente ou Admin: Cancelar um agendamento
exports.cancelarAgendamento = async (req, res) => {
    const { id: idAgendamento } = req.params;
    const { id: idUsuario, tipo: tipoUsuario, nome: nomeUsuario } = req.user;

    try {
        const [agendamentos] = await db.query('SELECT * FROM agendamentos WHERE id = ?', [idAgendamento]);
        if (agendamentos.length === 0) return res.status(404).json({ message: 'Agendamento não encontrado.' });
        
        const agendamento = agendamentos[0];

        if (tipoUsuario === 'cliente' && agendamento.id_usuario !== idUsuario) {
            return res.status(403).json({ message: 'Acesso negado. Você não pode cancelar este agendamento.' });
        }
        if (tipoUsuario === 'cliente' && !['pendente_aprovacao', 'aguardando_pagamento'].includes(agendamento.status)) {
            return res.status(400).json({ message: 'Não é mais possível cancelar este agendamento. Entre em contato com o administrador.' });
        }

        const novoStatus = tipoUsuario === 'admin' ? 'cancelado_pelo_admin' : 'cancelado_pelo_usuario';
        await db.query('UPDATE agendamentos SET status = ? WHERE id = ?', [novoStatus, idAgendamento]);
        
        // --- NOTIFICAÇÃO PARA O LADO OPOSTO ---
        if (tipoUsuario === 'admin') {
            const payload = {
                title: 'Agendamento Cancelado',
                body: `Seu horário do dia ${new Date(agendamento.data_hora_inicio).toLocaleString('pt-BR')} foi cancelado pelo administrador.`
            };
            await sendNotification(agendamento.id_usuario, payload);
        } else { // se foi o cliente que cancelou
            const payload = {
                title: 'Agendamento Cancelado por Cliente',
                body: `${nomeUsuario} cancelou o agendamento do dia ${new Date(agendamento.data_hora_inicio).toLocaleString('pt-BR')}.`
            };
            await sendNotificationToAdmins(payload);
        }
        // --- FIM DA NOTIFICAÇÃO ---
        
        res.status(200).json({ message: 'Agendamento cancelado com sucesso.' });
    } catch (error) {
        console.error("Erro ao cancelar agendamento:", error);
        res.status(500).json({ message: "Erro interno no servidor." });
    }
};
