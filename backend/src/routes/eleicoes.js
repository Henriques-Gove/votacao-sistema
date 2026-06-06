const express = require('express');
const db = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    let sql, params;
    if (req.user.role === 'admin') {
      sql = `SELECT e.*, u.nome as criado_por_nome, g.nome as grupo_nome
             FROM eleicoes e
             JOIN users u ON u.id = e.criado_por
             LEFT JOIN grupos g ON g.id = e.grupo_id
             ORDER BY e.created_at DESC`;
      params = [];
    } else {
      sql = `SELECT DISTINCT e.*, u.nome as criado_por_nome, g.nome as grupo_nome
             FROM eleicoes e
             JOIN users u ON u.id = e.criado_por
             LEFT JOIN grupos g ON g.id = e.grupo_id
             LEFT JOIN user_grupos ug ON ug.grupo_id = e.grupo_id
             WHERE e.status = 'activa'
               AND (e.grupo_id IS NULL OR ug.user_id = $1)
             ORDER BY e.fim ASC`;
      params = [req.user.id];
    }
    const { rows } = await db.query(sql, params);
    res.json(rows);
  } catch (e) {
    console.error('Erro listar eleições:', e);
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { rows: el } = await db.query(
      'SELECT e.*, g.nome as grupo_nome FROM eleicoes e LEFT JOIN grupos g ON g.id = e.grupo_id WHERE e.id = $1',
      [req.params.id]
    );
    if (!el.length) return res.status(404).json({ message: 'Eleição não encontrada' });

    const { rows: candidatos } = await db.query(
      'SELECT c.*, COALESCE(COUNT(v.id) FILTER (WHERE v.tipo_voto = \'candidato\'), 0)::int as total_votos FROM candidatos c LEFT JOIN votos v ON v.candidato_id = c.id WHERE c.eleicao_id = $1 GROUP BY c.id',
      [req.params.id]
    );

    const { rows: jaVotou } = await db.query(
      'SELECT id, tipo_voto FROM votos WHERE eleicao_id = $1 AND eleitor_id = $2',
      [req.params.id, req.user.id]
    );

    const { rows: totalInscritos } = el[0].grupo_id
      ? await db.query('SELECT COUNT(*)::int as total FROM user_grupos WHERE grupo_id = $1', [el[0].grupo_id])
      : await db.query('SELECT COUNT(*)::int as total FROM users WHERE role = \'eleitor\'');

    res.json({
      ...el[0],
      candidatos,
      ja_votou: jaVotou.length > 0,
      tipo_voto_usuario: jaVotou[0]?.tipo_voto || null,
      total_inscritos: totalInscritos[0].total,
    });
  } catch (e) {
    console.error('Erro buscar eleição:', e);
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.post('/', adminMiddleware, async (req, res) => {
  const { titulo, descricao, inicio, fim, candidatos, grupo_id } = req.body;
  if (!titulo || !inicio || !fim)
    return res.status(400).json({ message: 'Título, início e fim são obrigatórios' });
  if (!candidatos || candidatos.length < 2)
    return res.status(400).json({ message: 'São necessários pelo menos 2 candidatos' });
  if (candidatos.some(c => !c.nome || !c.nome.trim()))
    return res.status(400).json({ message: 'Todos os candidatos devem ter um nome' });
  if (new Date(inicio) >= new Date(fim))
    return res.status(400).json({ message: 'A data de fim deve ser posterior à data de início' });

  try {
    const { rows } = await db.query(
      'INSERT INTO eleicoes (titulo, descricao, inicio, fim, criado_por, grupo_id) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id',
      [titulo.trim(), descricao || '', inicio, fim, req.user.id, grupo_id || null]
    );
    const eleicaoId = rows[0].id;

    for (const c of candidatos) {
      await db.query(
        'INSERT INTO candidatos (eleicao_id, nome, descricao) VALUES ($1,$2,$3)',
        [eleicaoId, c.nome.trim(), c.descricao || '']
      );
    }

    res.status(201).json({ message: 'Eleição criada', id: eleicaoId });
  } catch (e) {
    console.error('Erro ao criar eleição:', e);
    res.status(500).json({ message: 'Erro interno ao criar eleição' });
  }
});

router.put('/:id', adminMiddleware, async (req, res) => {
  const { titulo, descricao, inicio, fim, status } = req.body;
  try {
    await db.query(
      'UPDATE eleicoes SET titulo=$1, descricao=$2, inicio=$3, fim=$4, status=$5 WHERE id=$6',
      [titulo, descricao, inicio, fim, status, req.params.id]
    );
    res.json({ message: 'Eleição actualizada' });
  } catch (e) {
    console.error('Erro actualizar eleição:', e);
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.delete('/:id', adminMiddleware, async (req, res) => {
  try {
    await db.query('DELETE FROM eleicoes WHERE id = $1', [req.params.id]);
    res.json({ message: 'Eleição eliminada' });
  } catch (e) {
    console.error('Erro eliminar eleição:', e);
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.get('/:id/resultados', authMiddleware, async (req, res) => {
  try {
    const { rows: el } = await db.query(
      'SELECT e.*, g.nome as grupo_nome FROM eleicoes e LEFT JOIN grupos g ON g.id = e.grupo_id WHERE e.id = $1',
      [req.params.id]
    );
    if (!el.length) return res.status(404).json({ message: 'Não encontrada' });

    if (req.user.role !== 'admin' && el[0].status !== 'encerrada')
      return res.status(403).json({ message: 'Resultados disponíveis apenas após encerramento' });

    const { rows: candidatos } = await db.query(
      `SELECT c.id, c.nome, c.descricao, COALESCE(COUNT(v.id) FILTER (WHERE v.tipo_voto = 'candidato'), 0)::int as votos
       FROM candidatos c
       LEFT JOIN votos v ON v.candidato_id = c.id
       WHERE c.eleicao_id = $1
       GROUP BY c.id
       ORDER BY votos DESC`,
      [req.params.id]
    );

    const { rows: contagem } = await db.query(
      `SELECT tipo_voto, COUNT(*)::int as total
       FROM votos WHERE eleicao_id = $1 GROUP BY tipo_voto`,
      [req.params.id]
    );

    const votosCandidato = contagem.find(r => r.tipo_voto === 'candidato')?.total || 0;
    const votosBranco = contagem.find(r => r.tipo_voto === 'branco')?.total || 0;
    const votosNulo = contagem.find(r => r.tipo_voto === 'nulo')?.total || 0;
    const totalVotos = votosCandidato + votosBranco + votosNulo;

    const { rows: totalInscritos } = el[0].grupo_id
      ? await db.query('SELECT COUNT(*)::int as total FROM user_grupos WHERE grupo_id = $1', [el[0].grupo_id])
      : await db.query('SELECT COUNT(*)::int as total FROM users WHERE role = \'eleitor\'');

    const totalInsc = totalInscritos[0].total;

    res.json({
      eleicao: el[0],
      candidatos,
      total_votos: totalVotos,
      votos_branco: votosBranco,
      votos_nulo: votosNulo,
      total_inscritos: totalInsc,
      abstencao: totalInsc - totalVotos,
    });
  } catch (e) {
    console.error('Erro resultados:', e);
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.get('/:id/votantes', adminMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT u.id, u.nome, u.email, v.created_at as votou_em, v.tipo_voto
       FROM votos v
       JOIN users u ON u.id = v.eleitor_id
       WHERE v.eleicao_id = $1
       ORDER BY v.created_at`,
      [req.params.id]
    );
    res.json(rows);
  } catch (e) {
    console.error('Erro votantes:', e);
    res.status(500).json({ message: 'Erro interno' });
  }
});

module.exports = router;
