const express = require('express');
const db = require('../config/db');
const { adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/users — só admin
router.get('/', adminMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, nome, email, role, verified, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

// PUT /api/users/:id/role — só admin (promover/despromover)
router.put('/:id/role', adminMiddleware, async (req, res) => {
  const { role } = req.body;
  if (!['eleitor', 'admin'].includes(role))
    return res.status(400).json({ message: 'Role inválido' });
  try {
    await db.query('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id]);
    res.json({ message: 'Role actualizado' });
  } catch (e) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

module.exports = router;
