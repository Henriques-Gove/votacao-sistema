const express = require('express');
const db = require('../config/db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

async function runMigrations() {
  try {
    await db.query(`ALTER TABLE eleicoes ADD COLUMN IF NOT EXISTS multi_cargo BOOLEAN NOT NULL DEFAULT FALSE`);
    await db.query(`ALTER TABLE eleicoes ADD COLUMN IF NOT EXISTS grupo_id INT REFERENCES grupos(id)`);
    await db.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS foto TEXT`);
    console.log('Migrations applied');
  } catch (e) {
    console.error('Migration error:', e.message);
  }
}

async function autoUpdateStatus() {
  try {
    const { rowCount: ativadas } = await db.query(
      `UPDATE eleicoes SET status = 'activa'
       WHERE status = 'rascunho' AND inicio <= NOW()`
    );
    const { rowCount: encerradas } = await db.query(
      `UPDATE eleicoes SET status = 'encerrada'
       WHERE status = 'activa' AND fim <= NOW()`
    );
    if (ativadas > 0 || encerradas > 0) {
      console.log(`Auto-status: ${ativadas} activadas, ${encerradas} encerradas`);
    }
  } catch (e) {
    console.error('Erro autoUpdateStatus:', e.message);
  }
}

const MINUTO = 60 * 1000;
setInterval(autoUpdateStatus, MINUTO);

module.exports.autoUpdateStatus = autoUpdateStatus;

router.get('/', authMiddleware, async (req, res) => {
  try {
    await autoUpdateStatus();

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
    res.status(500).json({ message: 'Erro interno: ' + e.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    await autoUpdateStatus();

    const { rows: el } = await db.query(
      'SELECT e.*, g.nome as grupo_nome FROM eleicoes e LEFT JOIN grupos g ON g.id = e.grupo_id WHERE e.id = $1',
      [req.params.id]
    );
    if (!el.length) return res.status(404).json({ message: 'Eleição não encontrada' });

    const { rows: cargos } = await db.query(
      'SELECT * FROM cargos WHERE eleicao_id = $1 ORDER BY ordem',
      [req.params.id]
    );

    let candidatos;
    if (cargos.length > 0) {
      const { rows: c } = await db.query(
        `SELECT c.*, cr.nome as cargo_nome,
                COALESCE(COUNT(v.id) FILTER (WHERE v.tipo_voto = 'candidato'), 0)::int as total_votos
         FROM candidatos c
         JOIN cargos cr ON cr.id = c.cargo_id
         LEFT JOIN votos v ON v.candidato_id = c.id
         WHERE c.eleicao_id = $1
         GROUP BY c.id, cr.nome
         ORDER BY c.cargo_id, c.id`,
        [req.params.id]
      );
      candidatos = c;
    } else {
      const { rows: c } = await db.query(
        `SELECT c.*, NULL as cargo_nome,
                COALESCE(COUNT(v.id) FILTER (WHERE v.tipo_voto = 'candidato'), 0)::int as total_votos
         FROM candidatos c
         LEFT JOIN votos v ON v.candidato_id = c.id
         WHERE c.eleicao_id = $1
         GROUP BY c.id
         ORDER BY c.id`,
        [req.params.id]
      );
      candidatos = c;
    }

    const { rows: jaVotou } = await db.query(
      'SELECT cargo_id, tipo_voto FROM votos WHERE eleicao_id = $1 AND eleitor_id = $2',
      [req.params.id, req.user.id]
    );

    const { rows: totalInscritos } = el[0].grupo_id
      ? await db.query('SELECT COUNT(*)::int as total FROM user_grupos WHERE grupo_id = $1', [el[0].grupo_id])
      : await db.query('SELECT COUNT(*)::int as total FROM users WHERE role = \'eleitor\'');

    res.json({
      ...el[0],
      cargos,
      candidatos,
      ja_votou: jaVotou,
      total_inscritos: totalInscritos[0].total,
    });
  } catch (e) {
    console.error('Erro buscar eleição:', e);
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.post('/', adminMiddleware, async (req, res) => {
  const { titulo, descricao, inicio, fim, candidatos, grupo_id, cargos } = req.body;
  if (!titulo || !inicio || !fim)
    return res.status(400).json({ message: 'Título, início e fim são obrigatórios' });
  if (new Date(inicio) >= new Date(fim))
    return res.status(400).json({ message: 'A data de fim deve ser posterior à data de início' });

  const isMulti = cargos && cargos.length > 0;

  if (isMulti) {
    if (cargos.some(c => !c.nome || !c.candidatos || c.candidatos.length < 2))
      return res.status(400).json({ message: 'Cada cargo precisa de nome e pelo menos 2 candidatos' });
  } else {
    if (!candidatos || candidatos.length < 2)
      return res.status(400).json({ message: 'São necessários pelo menos 2 candidatos' });
    if (candidatos.some(c => !c.nome || !c.nome.trim()))
      return res.status(400).json({ message: 'Todos os candidatos devem ter um nome' });
  }

  try {
    const { rows } = await db.query(
      'INSERT INTO eleicoes (titulo, descricao, inicio, fim, multi_cargo, criado_por, grupo_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id',
      [titulo.trim(), descricao || '', inicio, fim, isMulti, req.user.id, grupo_id || null]
    );
    const eleicaoId = rows[0].id;

    if (isMulti) {
      for (let i = 0; i < cargos.length; i++) {
        const crg = cargos[i];
        const { rows: cargoRows } = await db.query(
          'INSERT INTO cargos (eleicao_id, nome, descricao, ordem) VALUES ($1,$2,$3,$4) RETURNING id',
          [eleicaoId, crg.nome.trim(), crg.descricao || '', i]
        );
        const cargoId = cargoRows[0].id;
        for (const cand of crg.candidatos) {
          await db.query(
            'INSERT INTO candidatos (eleicao_id, cargo_id, nome, descricao) VALUES ($1,$2,$3,$4)',
            [eleicaoId, cargoId, cand.nome.trim(), cand.descricao || '']
          );
        }
      }
    } else {
      for (const c of candidatos) {
        await db.query(
          'INSERT INTO candidatos (eleicao_id, nome, descricao) VALUES ($1,$2,$3)',
          [eleicaoId, c.nome.trim(), c.descricao || '']
        );
      }
    }

    res.status(201).json({ message: 'Eleição criada', id: eleicaoId });
  } catch (e) {
    console.error('Erro ao criar eleição:', e);
    res.status(500).json({ message: 'Erro interno ao criar eleição: ' + e.message });
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
    await autoUpdateStatus();

    const { rows: el } = await db.query(
      'SELECT e.*, g.nome as grupo_nome FROM eleicoes e LEFT JOIN grupos g ON g.id = e.grupo_id WHERE e.id = $1',
      [req.params.id]
    );
    if (!el.length) return res.status(404).json({ message: 'Não encontrada' });

    if (req.user.role !== 'admin' && el[0].status !== 'encerrada')
      return res.status(403).json({ message: 'Resultados disponíveis apenas após encerramento' });

    const { rows: cargos } = await db.query(
      'SELECT * FROM cargos WHERE eleicao_id = $1 ORDER BY ordem',
      [req.params.id]
    );

    let candidatos;
    if (cargos.length > 0) {
      const { rows: c } = await db.query(
        `SELECT c.id, c.nome, c.descricao, c.cargo_id, cr.nome as cargo_nome,
                COALESCE(COUNT(v.id) FILTER (WHERE v.tipo_voto = 'candidato'), 0)::int as votos
         FROM candidatos c
         JOIN cargos cr ON cr.id = c.cargo_id
         LEFT JOIN votos v ON v.candidato_id = c.id
         WHERE c.eleicao_id = $1
         GROUP BY c.id, cr.nome
         ORDER BY c.cargo_id, votos DESC`,
        [req.params.id]
      );
      candidatos = c;
    } else {
      const { rows: c } = await db.query(
        `SELECT c.id, c.nome, c.descricao, NULL as cargo_id, NULL as cargo_nome,
                COALESCE(COUNT(v.id) FILTER (WHERE v.tipo_voto = 'candidato'), 0)::int as votos
         FROM candidatos c
         LEFT JOIN votos v ON v.candidato_id = c.id
         WHERE c.eleicao_id = $1
         GROUP BY c.id
         ORDER BY votos DESC`,
        [req.params.id]
      );
      candidatos = c;
    }

    const { rows: contagem } = await db.query(
      `SELECT cargo_id, tipo_voto, COUNT(*)::int as total
       FROM votos WHERE eleicao_id = $1 GROUP BY cargo_id, tipo_voto ORDER BY cargo_id`,
      [req.params.id]
    );

    const { rows: totalInscritos } = el[0].grupo_id
      ? await db.query('SELECT COUNT(*)::int as total FROM user_grupos WHERE grupo_id = $1', [el[0].grupo_id])
      : await db.query('SELECT COUNT(*)::int as total FROM users WHERE role = \'eleitor\'');

    const totalInsc = totalInscritos[0].total;

    const votosCandidato = contagem.filter(r => r.tipo_voto === 'candidato').reduce((s, r) => s + r.total, 0);
    const votosBranco = contagem.filter(r => r.tipo_voto === 'branco').reduce((s, r) => s + r.total, 0);
    const votosNulo = contagem.filter(r => r.tipo_voto === 'nulo').reduce((s, r) => s + r.total, 0);
    const totalVotos = votosCandidato + votosBranco + votosNulo;

    res.json({
      eleicao: el[0],
      cargos,
      candidatos,
      contagem,
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
      `SELECT u.id, u.nome, u.email, v.created_at as votou_em, v.tipo_voto, v.cargo_id, cr.nome as cargo_nome
       FROM votos v
       JOIN users u ON u.id = v.eleitor_id
       LEFT JOIN cargos cr ON cr.id = v.cargo_id
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
module.exports.autoUpdateStatus = autoUpdateStatus;
