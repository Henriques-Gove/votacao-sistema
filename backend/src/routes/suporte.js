const express = require('express');
const db = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/', async (req, res) => {
  const { nome, email, telemovel, mensagem } = req.body;
  if (!nome || !email || !mensagem)
    return res.status(400).json({ message: 'Nome, email e mensagem são obrigatórios' });
  try {
    await db.query(
      'INSERT INTO suporte_mensagens (nome, email, telemovel, mensagem) VALUES ($1,$2,$3,$4)',
      [nome.trim(), email.trim(), telemovel || null, mensagem.trim()]
    );
    res.status(201).json({ message: 'Mensagem enviada com sucesso!' });
  } catch (e) {
    console.error('ERRO SUPORTE:', e);
    res.status(500).json({ message: 'Erro interno do servidor' });
  }
});

router.get('/', adminMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM suporte_mensagens ORDER BY lida ASC, created_at DESC'
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.put('/:id/ler', adminMiddleware, async (req, res) => {
  try {
    await db.query('UPDATE suporte_mensagens SET lida = TRUE WHERE id = $1', [req.params.id]);
    res.json({ message: 'Marcada como lida' });
  } catch (e) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM suporte_mensagens WHERE id = $1', [req.params.id]);
    res.json({ message: 'Mensagem eliminada' });
  } catch (e) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

module.exports = router;