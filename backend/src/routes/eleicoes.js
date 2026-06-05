const express = require('express');
const db = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/eleicoes — lista (eleitor: só activas; admin: todas)
router.get('/', authMiddleware, async (req, res) => {
  try {
    let sql, params = [];
    if (req.user.role === 'admin') {
      sql = 'SELECT e.*, u.nome as criado_por_nome FROM eleicoes e JOIN users u ON u.id = e.criado_por ORDER BY e.created_at DESC';
    } else {
      sql = "SELECT e.*, u.nome as criado_por_nome FROM eleicoes e JOIN users u ON u.id = e.criado_por WHERE e.status = 'activa' ORDER BY e.fim ASC";
    }
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

// GET /api/eleicoes/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const [el] = await db.query('SELECT * FROM eleicoes WHERE id = ?', [req.params.id]);
    if (!el.length) return res.status(404).json({ message: 'Eleição não encontrada' });

    const [candidatos] = await db.query(
      'SELECT c.*, COUNT(v.id) as total_votos FROM candidatos c LEFT JOIN votos v ON v.candidato_id = c.id WHERE c.eleicao_id = ? GROUP BY c.id',
      [req.params.id]
    );

    // Verifica se o utilizador já votou
    const [jaVotou] = await db.query(
      'SELECT id FROM votos WHERE eleicao_id = ? AND eleitor_id = ?',
      [req.params.id, req.user.id]
    );

    res.json({ ...el[0], candidatos, ja_votou: jaVotou.length > 0 });
  } catch (e) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

// POST /api/eleicoes — só admin
router.post('/', adminMiddleware, async (req, res) => {
  const { titulo, descricao, inicio, fim, candidatos } = req.body;
  if (!titulo || !inicio || !fim)
    return res.status(400).json({ message: 'Título, início e fim são obrigatórios' });
  if (!candidatos || candidatos.length < 2)
    return res.status(400).json({ message: 'São necessários pelo menos 2 candidatos' });

  try {
    const [result] = await db.query(
      'INSERT INTO eleicoes (titulo, descricao, inicio, fim, criado_por) VALUES (?,?,?,?,?)',
      [titulo, descricao || '', inicio, fim, req.user.id]
    );
    const eleicaoId = result.insertId;

    for (const c of candidatos) {
      await db.query(
        'INSERT INTO candidatos (eleicao_id, nome, descricao) VALUES (?,?,?)',
        [eleicaoId, c.nome, c.descricao || '']
      );
    }

    res.status(201).json({ message: 'Eleição criada', id: eleicaoId });
  } catch (e) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

// PUT /api/eleicoes/:id — só admin
router.put('/:id', adminMiddleware, async (req, res) => {
  const { titulo, descricao, inicio, fim, status } = req.body;
  try {
    await db.query(
      'UPDATE eleicoes SET titulo=?, descricao=?, inicio=?, fim=?, status=? WHERE id=?',
      [titulo, descricao, inicio, fim, status, req.params.id]
    );
    res.json({ message: 'Eleição actualizada' });
  } catch (e) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

// DELETE /api/eleicoes/:id — só admin
router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM eleicoes WHERE id = ?', [req.params.id]);
    res.json({ message: 'Eleição eliminada' });
  } catch (e) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

// GET /api/eleicoes/:id/resultados
router.get('/:id/resultados', authMiddleware, async (req, res) => {
  try {
    const [el] = await db.query('SELECT * FROM eleicoes WHERE id = ?', [req.params.id]);
    if (!el.length) return res.status(404).json({ message: 'Não encontrada' });

    // Eleitor só pode ver resultados de eleições encerradas
    if (req.user.role !== 'admin' && el[0].status !== 'encerrada')
      return res.status(403).json({ message: 'Resultados disponíveis apenas após encerramento' });

    const [candidatos] = await db.query(
      `SELECT c.id, c.nome, c.descricao,
              COUNT(v.id) as votos
       FROM candidatos c
       LEFT JOIN votos v ON v.candidato_id = c.id
       WHERE c.eleicao_id = ?
       GROUP BY c.id
       ORDER BY votos DESC`,
      [req.params.id]
    );

    const totalVotos = candidatos.reduce((s, c) => s + Number(c.votos), 0);
    res.json({ eleicao: el[0], candidatos, total_votos: totalVotos });
  } catch (e) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

module.exports = router;
