require('dotenv').config();

console.log('JWT_SECRET =', process.env.JWT_SECRET);

const express = require('express');
const cors = require('cors');

const authRouter = require('./routes/auth');
const eleicaoRouter = require('./routes/eleicoes');
const votoRouter = require('./routes/votos');
const userRouter = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || '*'
}));

app.use(express.json());

// Rotas
app.use('/api/auth', authRouter);
app.use('/api/eleicoes', eleicaoRouter);
app.use('/api/votos', votoRouter);
app.use('/api/users', userRouter);

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

app.listen(PORT, () => {
  console.log(`Servidor a correr em http://localhost:${PORT}`);
});