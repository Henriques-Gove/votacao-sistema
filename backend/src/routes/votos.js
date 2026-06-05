const express = require('express');
const crypto  = require('crypto');
const db      = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// POST /api/votos — submeter voto
router.post('/', authMiddleware, async (req, res) => {
  const { eleicao_id, candidato_id } = req.body;
  if (!eleicao_id || !candidato_id)
    return res.status(400).json({ message: 'eleicao_id e candidato_id são obrigatórios' });

  try {
    // Verificar se a eleição existe e está activa
    const [el] = await db.query('SELECT * FROM eleicoes WHERE id = ?', [eleicao_id]);
    if (!el.length) return res.status(404).json({ message: 'Eleição não encontrada' });
    if (el[0].status !== 'activa')
      return res.status(400).json({ message: 'Esta eleição não está activa' });

    const agora = new Date();
    if (agora < new Date(el[0].inicio) || agora > new Date(el[0].fim))
      return res.status(400).json({ message: 'Fora do período de votação' });

    // Verificar se o candidato pertence à eleição
    const [cand] = await db.query(
      'SELECT id FROM candidatos WHERE id = ? AND eleicao_id = ?',
      [candidato_id, eleicao_id]
    );
    if (!cand.length) return res.status(400).json({ message: 'Candidato inválido' });

    // Verificar se já votou
    const [jaVotou] = await db.query(
      'SELECT id FROM votos WHERE eleicao_id = ? AND eleitor_id = ?',
      [eleicao_id, req.user.id]
    );
    if (jaVotou.length) return res.status(409).json({ message: 'Já votou nesta eleição' });

    // Registar voto com token único
    const token = crypto.randomBytes(32).toString('hex');
    await db.query(
      'INSERT INTO votos (eleicao_id, eleitor_id, candidato_id, token_unico) VALUES (?,?,?,?)',
      [eleicao_id, req.user.id, candidato_id, token]
    );

    res.json({ message: 'Voto registado com sucesso', token_voto: token });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY')
      return res.status(409).json({ message: 'Já votou nesta eleição' });
    res.status(500).json({ message: 'Erro interno' });
  }
});

// GET /api/votos/meus — eleições em que o utilizador já votou
router.get('/meus', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT v.eleicao_id, v.token_unico, v.created_at, e.titulo
       FROM votos v
       JOIN eleicoes e ON e.id = v.eleicao_id
       WHERE v.eleitor_id = ?`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Erro interno' });
  }
});

module.exports = router;
