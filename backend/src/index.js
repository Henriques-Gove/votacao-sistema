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