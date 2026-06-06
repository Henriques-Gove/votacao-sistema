const express = require('express');
const db = require('../config/db');
const { adminMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', adminMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM grupos ORDER BY nome');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.post('/', adminMiddleware, async (req, res) => {
  const { nome, descricao } = req.body;
  if (!nome) return res.status(400).json({ message: 'Nome é obrigatório' });
  try {
    const { rows } = await db.query(
      'INSERT INTO grupos (nome, descricao) VALUES ($1, $2) RETURNING *',
      [nome, descricao || '']
    );
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') return res.status(409).json({ message: 'Grupo já existe' });
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.put('/:id', adminMiddleware, async (req, res) => {
  const { nome, descricao } = req.body;
  try {
    const { rows } = await db.query(
      'UPDATE grupos SET nome = $1, descricao = $2 WHERE id = $3 RETURNING *',
      [nome, descricao, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Grupo não encontrado' });
    res.json(rows[0]);
  } catch (e) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM grupos WHERE id = $1', [req.params.id]);
    res.json({ message: 'Grupo eliminado' });
  } catch (e) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.get('/:id/membros', adminMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id, u.nome, u.email, u.role
       FROM users u JOIN user_grupos ug ON ug.user_id = u.id
       WHERE ug.grupo_id = $1 ORDER BY u.nome`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.post('/:id/membros', adminMiddleware, async (req, res) => {
  const { user_id } = req.body;
  try {
    await db.query(
      'INSERT INTO user_grupos (user_id, grupo_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [user_id, req.params.id]
    );
    res.json({ message: 'Membro adicionado' });
  } catch (e) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.delete('/:id/membros/:userId', adminMiddleware, async (req, res) => {
  try {
    await db.query(
      'DELETE FROM user_grupos WHERE user_id = $1 AND grupo_id = $2',
      [req.params.userId, req.params.id]
    );
    res.json({ message: 'Membro removido' });
  } catch (e) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

module.exports = router;
