require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const db = require('./config/db');

const authRouter = require('./routes/auth');
const eleicaoRouter = require('./routes/eleicoes');
const votoRouter = require('./routes/votos');
const userRouter = require('./routes/users');
const grupoRouter = require('./routes/grupos');
const suporteRouter = require('./routes/suporte');

const { autoUpdateStatus } = require('./routes/eleicoes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || '*'
}));

app.use(express.json({ limit: '30mb' }));

// Rotas
app.use('/api/auth', authRouter);
app.use('/api/eleicoes', eleicaoRouter);
app.use('/api/votos', votoRouter);
app.use('/api/users', userRouter);
app.use('/api/grupos', grupoRouter);
app.use('/api/suporte', suporteRouter);

// Debug migrate
app.get('/api/debug/migrate', async (req, res) => {
  const results = [];
  const queries = [
    `ALTER TABLE eleicoes ADD COLUMN IF NOT EXISTS multi_cargo BOOLEAN NOT NULL DEFAULT FALSE`,
    `ALTER TABLE eleicoes ADD COLUMN IF NOT EXISTS grupo_id INT`,
    `ALTER TABLE users ADD COLUMN IF NOT EXISTS foto TEXT`,
    `ALTER TABLE eleicoes ADD FOREIGN KEY (grupo_id) REFERENCES grupos(id)`,
    `ALTER TABLE candidatos ADD COLUMN IF NOT EXISTS cargo_id INT REFERENCES cargos(id)`,
    `ALTER TABLE votos ADD COLUMN IF NOT EXISTS cargo_id INT REFERENCES cargos(id)`,
    `ALTER TABLE votos ADD COLUMN IF NOT EXISTS tipo_voto VARCHAR(20) NOT NULL DEFAULT 'candidato'`,
    `ALTER TABLE votos ADD COLUMN IF NOT EXISTS hash_voto VARCHAR(64)`,
    `UPDATE users SET verified = TRUE WHERE verified = FALSE`,
    `SELECT COUNT(*)::int as unverified FROM users WHERE verified = FALSE`,
  ];
  for (const q of queries) {
    try {
      const r = await require('./config/db').query(q);
      results.push({ sql: q.substring(0, 60), ok: true, rows: r.rowCount ?? r.rows?.length });
    } catch (e) {
      results.push({ sql: q.substring(0, 60), ok: false, error: e.message });
    }
  }
  res.json({ results });
});

// Seed test data
app.post('/api/seed', async (req, res) => {
  const crypto = require('crypto');
  try {
    // Limpar dados anteriores
    await db.query('DELETE FROM votos');
    await db.query('DELETE FROM candidatos');
    await db.query('DELETE FROM cargos');
    await db.query('DELETE FROM eleicoes');
    await db.query("DELETE FROM users WHERE role = 'eleitor'");
    try { await db.query('DELETE FROM audit_log'); } catch (_) {}
    await db.query('DELETE FROM suporte_mensagens');

    const hash = await bcrypt.hash('Teste@123', 10);
    const eleitores = [
      ['Maria Silva', 'maria@teste.com'],
      ['João Santos', 'joao@teste.com'],
      ['Ana Oliveira', 'ana@teste.com'],
      ['Carlos Pereira', 'carlos@teste.com'],
      ['Sofia Costa', 'sofia@teste.com'],
      ['Pedro Martins', 'pedro@teste.com'],
      ['Isabel Rodrigues', 'isabel@teste.com'],
      ['Luís Almeida', 'luis@teste.com'],
      ['Catarina Fernandes', 'catarina@teste.com'],
      ['Miguel Gonçalves', 'miguel@teste.com'],
      ['André Matos', 'andre@teste.com'],
      ['Bárbara Nunes', 'barbara@teste.com'],
      ['Cláudio Ramos', 'claudio@teste.com'],
      ['Dulce Fonseca', 'dulce@teste.com'],
      ['Eduardo Lopes', 'eduardo@teste.com'],
      ['Francisca Neves', 'francisca@teste.com'],
      ['Gilberto Martins', 'gilberto@teste.com'],
      ['Helena Figo', 'helena@teste.com'],
      ['Ivan Pereira', 'ivan@teste.com'],
      ['Joana Matias', 'joana@teste.com'],
    ];
    for (const [nome, email] of eleitores) {
      await db.query(
        'INSERT INTO users (nome, email, password, role, verified) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (email) DO NOTHING',
        [nome, email, hash, 'eleitor', true]
      );
    }

    const agora = new Date();
    const poolNomes = [
      'Alberto Vasco', 'Beatriz Lopes', 'Celso Mendes', 'Diana Faria',
      'Eduardo Silva', 'Filipa Gomes', 'Gustavo Neves', 'Helena Correia',
      'Igor Pinto', 'Joana Tavares', 'Kelvin Ramos', 'Lúcia Barbosa',
      'Manuel Castro', 'Natália Freitas', 'Óscar Matos', 'Paula Teixeira',
      'Rita Carvalho', 'Samuel Moreira', 'Tânia Andrade', 'Ulisses Fonseca',
      'Vitória Melo', 'Wilson Oliveira', 'Xavier Dias', 'Yara Santos',
      'André Lopes', 'Bruna Castro', 'Cristiano Neves', 'Daniela Faria',
      'Érica Gomes', 'Fábio Martins', 'Gonçalo Pinto', 'Henrique Lopes',
    ];

    function randomCandidatos(min = 2, max = 4) {
      const qtd = Math.floor(Math.random() * (max - min + 1)) + min;
      const shuffled = [...poolNomes].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, qtd);
    }

    const eleicoes = [
      {
        titulo: 'Eleição Presidencial',
        descricao: 'Eleição para Presidente e Vice-Presidente da República',
        inicio: new Date(agora.getTime() - 1*86400000),
        fim: new Date(agora.getTime() + 6*86400000),
        status: 'activa',
        multi_cargo: true,
        cargos: [
          { nome: 'Presidente', candidatos: randomCandidatos() },
          { nome: 'Vice-Presidente', candidatos: randomCandidatos() },
        ]
      },
      {
        titulo: 'Eleição do Conselho de Administração',
        descricao: 'Escolha dos membros do Conselho de Administração',
        inicio: new Date(agora.getTime() - 3*86400000),
        fim: new Date(agora.getTime() + 4*86400000),
        status: 'activa',
        multi_cargo: false,
        candidatos: randomCandidatos()
      },
      {
        titulo: 'Eleição do Delegado dos Funcionários',
        descricao: 'Representante dos funcionários junto da direcção',
        inicio: new Date(agora.getTime() + 10*86400000),
        fim: new Date(agora.getTime() + 17*86400000),
        status: 'rascunho',
        multi_cargo: false,
        candidatos: randomCandidatos()
      },
      {
        titulo: 'Eleição do Representante de Turma',
        descricao: 'Eleição anual do representante de turma',
        inicio: new Date(agora.getTime() - 10*86400000),
        fim: new Date(agora.getTime() - 3*86400000),
        status: 'encerrada',
        multi_cargo: false,
        candidatos: randomCandidatos()
      },
      {
        titulo: 'Eleição da Comissão de Ética',
        descricao: 'Composição da Comissão de Ética e Disciplina',
        inicio: new Date(agora.getTime() - 2*86400000),
        fim: new Date(agora.getTime() + 8*86400000),
        status: 'activa',
        multi_cargo: true,
        cargos: [
          { nome: 'Presidente', candidatos: randomCandidatos() },
          { nome: 'Secretário', candidatos: randomCandidatos() },
          { nome: 'Vogal', candidatos: randomCandidatos() },
        ]
      },
    ];

    // Guardar eleicoes e candidatos para votação
    const eleicoesCriadas = [];

    for (const el of eleicoes) {
      const { rows } = await db.query(
        'INSERT INTO eleicoes (titulo, descricao, inicio, fim, status, multi_cargo, criado_por) VALUES ($1,$2,$3,$4,$5,$6,1) RETURNING id',
        [el.titulo, el.descricao, el.inicio, el.fim, el.status, el.multi_cargo]
      );
      const eid = rows[0].id;
      const info = { id: eid, multi_cargo: el.multi_cargo, status: el.status, cargos: [] };

      if (el.multi_cargo) {
        for (let i = 0; i < el.cargos.length; i++) {
          const crg = el.cargos[i];
          const { rows: cr } = await db.query(
            'INSERT INTO cargos (eleicao_id, nome, ordem) VALUES ($1,$2,$3) RETURNING id',
            [eid, crg.nome, i]
          );
          const cargoInfo = { id: cr.id, nome: crg.nome, candidatos: [] };
          for (const nome of crg.candidatos) {
            const { rows: cand } = await db.query(
              'INSERT INTO candidatos (eleicao_id, cargo_id, nome) VALUES ($1,$2,$3) RETURNING id',
              [eid, cr.id, nome]
            );
            cargoInfo.candidatos.push({ id: cand[0].id, nome });
          }
          info.cargos.push(cargoInfo);
        }
      } else {
        info.candidatos = [];
        for (const nome of el.candidatos) {
          const { rows: cand } = await db.query(
            'INSERT INTO candidatos (eleicao_id, nome) VALUES ($1,$2) RETURNING id',
            [eid, nome]
          );
          info.candidatos.push({ id: cand[0].id, nome });
        }
      }
      eleicoesCriadas.push(info);
    }

    // Votar nas eleições activas
    const { rows: votantes } = await db.query(
      "SELECT id FROM users WHERE role = 'eleitor' AND verified = TRUE ORDER BY id"
    );
    const primeiros = votantes.slice(0, 15);

    for (const el of eleicoesCriadas) {
      if (el.status !== 'activa') continue;

      if (el.multi_cargo) {
        for (const cargo of el.cargos) {
          for (const u of primeiros) {
            const tipo = Math.random() < 0.85 ? 'candidato' : (Math.random() < 0.5 ? 'branco' : 'nulo');
            let candidato_id = null;
            if (tipo === 'candidato') {
              const rand = cargo.candidatos[Math.floor(Math.random() * cargo.candidatos.length)];
              candidato_id = rand.id;
            }
            const token = crypto.randomBytes(32).toString('hex');
            const hashVoto = candidato_id
              ? crypto.createHmac('sha256', token).update(String(candidato_id)).digest('hex')
              : null;
            try {
              await db.query(
                'INSERT INTO votos (eleicao_id, eleitor_id, cargo_id, candidato_id, tipo_voto, token_unico, hash_voto) VALUES ($1,$2,$3,$4,$5,$6,$7)',
                [el.id, u.id, cargo.id, candidato_id, tipo, token, hashVoto]
              );
            } catch (e) { if (e.code !== '23505') throw e }
          }
        }
      } else {
        for (const u of primeiros) {
          const tipo = Math.random() < 0.85 ? 'candidato' : (Math.random() < 0.5 ? 'branco' : 'nulo');
          let candidato_id = null;
          if (tipo === 'candidato') {
            const rand = el.candidatos[Math.floor(Math.random() * el.candidatos.length)];
            candidato_id = rand.id;
          }
          const token = crypto.randomBytes(32).toString('hex');
          const hashVoto = candidato_id
            ? crypto.createHmac('sha256', token).update(String(candidato_id)).digest('hex')
            : null;
          try {
            await db.query(
              'INSERT INTO votos (eleicao_id, eleitor_id, cargo_id, candidato_id, tipo_voto, token_unico, hash_voto) VALUES ($1,$2,$3,$4,$5,$6,$7)',
              [el.id, u.id, null, candidato_id, tipo, token, hashVoto]
            );
          } catch (e) { if (e.code !== '23505') throw e }
        }
      }
    }

    res.json({
      message: 'Dados de teste criados com sucesso!',
      eleitores: eleitores.length,
      eleicoes: eleicoes.length,
      votos_registados: '15 votantes em 3 eleições activas'
    });
  } catch (e) {
    console.error('ERRO SEED:', e);
    res.status(500).json({ message: 'Erro ao criar dados de teste', error: e.message });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    message: 'Rota não encontrada'
  });
});

app.listen(PORT, async () => {
  console.log(`Servidor a correr em http://localhost:${PORT}`);
  await autoUpdateStatus();
  console.log('Status das eleições actualizado');
});