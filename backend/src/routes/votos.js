const express = require('express');
const crypto  = require('crypto');
const db      = require('../config/db');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/', authMiddleware, async (req, res) => {
  const { eleicao_id, candidato_id, cargo_id, tipo_voto } = req.body;
  const tipo = tipo_voto || 'candidato';

  if (!eleicao_id) return res.status(400).json({ message: 'eleicao_id é obrigatório' });
  if (tipo === 'candidato' && !candidato_id)
    return res.status(400).json({ message: 'Seleccione um candidato ou escolha voto em branco/nulo' });

  try {
    const { rows: el } = await db.query('SELECT * FROM eleicoes WHERE id = $1', [eleicao_id]);
    if (!el.length) return res.status(404).json({ message: 'Eleição não encontrada' });
    if (el[0].status !== 'activa')
      return res.status(400).json({ message: 'Esta eleição não está activa' });

    const agora = new Date();
    if (agora < new Date(el[0].inicio) || agora > new Date(el[0].fim))
      return res.status(400).json({ message: 'Fora do período de votação' });

    if (tipo === 'candidato' && candidato_id) {
      const { rows: cand } = await db.query(
        'SELECT id, cargo_id FROM candidatos WHERE id = $1 AND eleicao_id = $2',
        [candidato_id, eleicao_id]
      );
      if (!cand.length) return res.status(400).json({ message: 'Candidato inválido' });
    }

    const cargoVoto = cargo_id || null;
    const { rows: jaVotou } = await db.query(
      'SELECT id FROM votos WHERE eleicao_id = $1 AND eleitor_id = $2 AND COALESCE(cargo_id, 0) = COALESCE($3, 0)',
      [eleicao_id, req.user.id, cargoVoto]
    );
    if (jaVotou.length) return res.status(409).json({ message: 'Já votou neste cargo' });

    const token = crypto.randomBytes(32).toString('hex');
    await db.query(
      'INSERT INTO votos (eleicao_id, eleitor_id, cargo_id, candidato_id, tipo_voto, token_unico) VALUES ($1,$2,$3,$4,$5,$6)',
      [eleicao_id, req.user.id, cargoVoto, candidato_id || null, tipo, token]
    );

    res.json({ message: 'Voto registado com sucesso', token_voto: token });
  } catch (e) {
    if (e.code === '23505')
      return res.status(409).json({ message: 'Já votou neste cargo' });
    console.error('ERRO VOTO:', e);
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.get('/meus', authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT v.eleicao_id, v.cargo_id, v.token_unico, v.tipo_voto, v.created_at, e.titulo, cr.nome as cargo_nome
       FROM votos v
       JOIN eleicoes e ON e.id = v.eleicao_id
       LEFT JOIN cargos cr ON cr.id = v.cargo_id
       WHERE v.eleitor_id = $1
       ORDER BY v.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (e) {
    console.error('ERRO MEUS VOTOS:', e);
    res.status(500).json({ message: 'Erro interno' });
  }
});

module.exports = router;
