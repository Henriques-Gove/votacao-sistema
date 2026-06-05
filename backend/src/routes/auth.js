const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { enviarOtp } = require('../config/mailer');

const router = express.Router();

function gerarOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

router.post('/register', async (req, res) => {
  const { nome, email, password } = req.body;

  if (!nome || !email || !password) {
    return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'A password deve ter mínimo 6 caracteres' });
  }

  try {
    const { rows } = await db.query('SELECT id FROM users WHERE email = $1', [email]);

    if (rows.length) {
      return res.status(409).json({ message: 'Email já registado' });
    }

    const hash = await bcrypt.hash(password, 10);
    const otp = gerarOtp();
    const exp = new Date(Date.now() + 15 * 60 * 1000);

    await db.query(
      'INSERT INTO users (nome, email, password, otp_code, otp_expires_at) VALUES ($1,$2,$3,$4,$5)',
      [nome, email, hash, otp, exp]
    );

    await enviarOtp(email, nome, otp);

    res.json({ message: 'Registo efectuado. Verifique o email.' });
  } catch (e) {
    console.error('ERRO REGISTER:', e);
    res.status(500).json({ message: 'Erro interno do servidor', error: e.message });
  }
});

router.post('/verify-otp', async (req, res) => {
  const { email, otp_code } = req.body;

  try {
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ message: 'Utilizador não encontrado' });
    }

    if (user.otp_code !== otp_code || new Date(user.otp_expires_at) < new Date()) {
      return res.status(400).json({ message: 'Código inválido ou expirado' });
    }

    await db.query(
      'UPDATE users SET verified = TRUE, otp_code = NULL, otp_expires_at = NULL WHERE id = $1',
      [user.id]
    );

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, nome: user.nome },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      access_token: token,
      user: { id: user.id, nome: user.nome, email: user.email, role: user.role }
    });
  } catch (e) {
    console.error('ERRO VERIFY OTP:', e);
    res.status(500).json({ message: 'Erro interno do servidor', error: e.message });
  }
});

router.post('/resend-otp', async (req, res) => {
  const { email } = req.body;

  try {
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ message: 'Email não encontrado' });
    }

    const otp = gerarOtp();
    const exp = new Date(Date.now() + 15 * 60 * 1000);

    await db.query(
      'UPDATE users SET otp_code = $1, otp_expires_at = $2 WHERE id = $3',
      [otp, exp, user.id]
    );

    await enviarOtp(email, user.nome, otp);

    res.json({ message: 'Código reenviado.' });
  } catch (e) {
    console.error('ERRO RESEND OTP:', e);
    res.status(500).json({ message: 'Erro interno do servidor', error: e.message });
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Campos obrigatórios' });
  }

  try {
    const { rows } = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    const passwordOk = await bcrypt.compare(password, user.password);

    if (!passwordOk) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    if (!user.verified) {
      return res.status(403).json({ message: 'Email não verificado' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, nome: user.nome },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      access_token: token,
      user: { id: user.id, nome: user.nome, email: user.email, role: user.role }
    });
  } catch (e) {
    console.error('ERRO LOGIN:', e);
    res.status(500).json({ message: 'Erro interno do servidor', error: e.message });
  }
});

router.get('/me', require('../middleware/auth').authMiddleware, async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT id, nome, email, role FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error('ERRO ME:', e);
    res.status(500).json({ message: 'Erro interno do servidor', error: e.message });
  }
});

module.exports = router;
