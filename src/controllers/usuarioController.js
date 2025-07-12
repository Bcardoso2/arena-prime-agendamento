// src/controllers/usuarioController.js

const db = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

//--- FUNÇÃO DE CADASTRO (CRIAR USUÁRIO) ---
exports.criarUsuario = async (req, res) => {
  const { nome, cpf, email, senha } = req.body;
  if (!nome || !cpf || !email || !senha) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
  }

  try {
    const [usuariosExistentes] = await db.query(
      'SELECT id FROM usuarios WHERE cpf = ? OR email = ?',
      [cpf, email]
    );
    if (usuariosExistentes.length > 0) {
      return res.status(409).json({ message: 'CPF ou E-mail já cadastrado.' });
    }
    
    // Criptografa a senha antes de salvar
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    const [resultado] = await db.query(
      'INSERT INTO usuarios (nome, cpf, email, senha, tipo) VALUES (?, ?, ?, ?, ?)',
      [nome, cpf, email, senhaHash, 'cliente']
    );

    res.status(201).json({ message: 'Usuário criado com sucesso!', idUsuario: resultado.insertId });
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

//--- FUNÇÃO DE LOGIN ---
exports.login = async (req, res) => {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ message: 'E-mail e senha são obrigatórios.' });
  }

  try {
    const [usuarios] = await db.query('SELECT * FROM usuarios WHERE email = ?', [email]);
    if (usuarios.length === 0) {
      return res.status(401).json({ message: 'Credenciais inválidas.' }); // Usuário não encontrado
    }

    const usuario = usuarios[0];

    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);
    if (!senhaCorreta) {
      return res.status(401).json({ message: 'Credenciais inválidas.' }); // Senha incorreta
    }

    // Gera o Token JWT
    const token = jwt.sign(
      { id: usuario.id, tipo: usuario.tipo },
      process.env.JWT_SECRET || 'um_segredo_muito_forte',
      { expiresIn: '8h' }
    );
    
    delete usuario.senha;

    res.status(200).json({ message: 'Login bem-sucedido!', token, usuario });

  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ message: 'Erro interno no servidor.' });
  }
};

//--- NOVA FUNÇÃO ADICIONADA ---
// Admin: Listar todos os usuários do tipo 'cliente'
exports.listarClientes = async (req, res) => {
    try {
        const [clientes] = await db.query(
            "SELECT id, nome FROM usuarios WHERE tipo = 'cliente' ORDER BY nome ASC"
        );
        res.status(200).json(clientes);
    } catch (error) {
        console.error("Erro ao listar clientes:", error);
        res.status(500).json({ message: "Erro interno no servidor." });
    }
};