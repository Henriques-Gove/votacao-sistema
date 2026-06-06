require('dotenv').config();

const express = require('express');
const cors = require('cors');

const authRouter = require('./routes/auth');
const eleicaoRouter = require('./routes/eleicoes');
const votoRouter = require('./routes/votos');
const userRouter = require('./routes/users');
const grupoRouter = require('./routes/grupos');
const suporteRouter = require('./routes/suporte');

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
  const bcrypt = require('bcryptjs');
  const db = require('./config/db');
  try {
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
    ];
    for (const [nome, email] of eleitores) {
      await db.query(
        'INSERT INTO users (nome, email, password, role, verified) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (email) DO NOTHING',
        [nome, email, hash, 'eleitor', true]
      );
    }

    const agora = new Date();
    const eleicoes = [
      {
        titulo: 'Eleição Presidencial',
        descricao: 'Eleição para Presidente e Vice-Presidente da República',
        inicio: new Date(agora.getTime() - 1*86400000),
        fim: new Date(agora.getTime() + 6*86400000),
        status: 'activa',
        multi_cargo: true,
        cargos: [
          { nome: 'Presidente', candidatos: ['Alberto Vasco', 'Beatriz Lopes', 'Celso Mendes', 'Diana Faria'] },
          { nome: 'Vice-Presidente', candidatos: ['Eduardo Silva', 'Filipa Gomes', 'Gustavo Neves'] },
        ]
      },
      {
        titulo: 'Eleição do Conselho de Administração',
        descricao: 'Escolha dos membros do Conselho de Administração',
        inicio: new Date(agora.getTime() - 3*86400000),
        fim: new Date(agora.getTime() + 4*86400000),
        status: 'activa',
        multi_cargo: false,
        candidatos: ['Helena Correia', 'Igor Pinto', 'Joana Tavares', 'Kelvin Ramos', 'Lúcia Barbosa']
      },
      {
        titulo: 'Eleição do Delegado dos Funcionários',
        descricao: 'Representante dos funcionários junto da direcção',
        inicio: new Date(agora.getTime() + 10*86400000),
        fim: new Date(agora.getTime() + 17*86400000),
        status: 'rascunho',
        multi_cargo: false,
        candidatos: ['Manuel Castro', 'Natália Freitas', 'Óscar Matos', 'Paula Teixeira']
      },
      {
        titulo: 'Eleição do Representante de Turma',
        descricao: 'Eleição anual do representante de turma',
        inicio: new Date(agora.getTime() - 10*86400000),
        fim: new Date(agora.getTime() - 3*86400000),
        status: 'encerrada',
        multi_cargo: false,
        candidatos: ['Rita Carvalho', 'Samuel Moreira', 'Tânia Andrade', 'Ulisses Fonseca', 'Vitória Melo']
      },
      {
        titulo: 'Eleição da Comissão de Ética',
        descricao: 'Composição da Comissão de Ética e Disciplina',
        inicio: new Date(agora.getTime() - 2*86400000),
        fim: new Date(agora.getTime() + 8*86400000),
        status: 'activa',
        multi_cargo: true,
        cargos: [
          { nome: 'Presidente', candidatos: ['Wilson Oliveira', 'Xavier Dias', 'Yara Santos'] },
          { nome: 'Secretário', candidatos: ['André Lopes', 'Bruna Castro', 'Cristiano Neves'] },
          { nome: 'Vogal', candidatos: ['Daniela Faria', 'Érica Gomes', 'Fábio Martins'] },
        ]
      },
    ];

    for (const el of eleicoes) {
      const { rows } = await db.query(
        'INSERT INTO eleicoes (titulo, descricao, inicio, fim, status, multi_cargo, criado_por) VALUES ($1,$2,$3,$4,$5,$6,1) RETURNING id',
        [el.titulo, el.descricao, el.inicio, el.fim, el.status, el.multi_cargo]
      );
      const eid = rows[0].id;

      if (el.multi_cargo) {
        for (let i = 0; i < el.cargos.length; i++) {
          const crg = el.cargos[i];
          const { rows: cr } = await db.query(
            'INSERT INTO cargos (eleicao_id, nome, ordem) VALUES ($1,$2,$3) RETURNING id',
            [eid, crg.nome, i]
          );
          for (const nome of crg.candidatos) {
            await db.query('INSERT INTO candidatos (eleicao_id, cargo_id, nome) VALUES ($1,$2,$3)', [eid, cr.id, nome]);
          }
        }
      } else {
        for (const nome of el.candidatos) {
          await db.query('INSERT INTO candidatos (eleicao_id, nome) VALUES ($1,$2)', [eid, nome]);
        }
      }
    }

    await autoUpdateStatus();
    res.json({ message: 'Dados de teste criados com sucesso!', eleitores: eleitores.length, eleicoes: eleicoes.length });
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

// Auto-schedule elections on startup
const { autoUpdateStatus } = require('./routes/eleicoes');

app.listen(PORT, async () => {
  console.log(`Servidor a correr em http://localhost:${PORT}`);
  await autoUpdateStatus();
  console.log('Status das eleições actualizado');
});