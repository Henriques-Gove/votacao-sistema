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
      'SELECT id, nome, email, role, foto FROM users WHERE id = $1',
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (e) {
    console.error('ERRO ME:', e);
    res.status(500).json({ message: 'Erro interno do servidor', error: e.message });
  }
});

router.put('/foto', require('../middleware/auth').authMiddleware, async (req, res) => {
  const { foto } = req.body;
  if (!foto) return res.status(400).json({ message: 'Foto é obrigatória' });
  if (foto.length > 20_000_000) return res.status(400).json({ message: 'Imagem muito grande (máx 20MB)' });
  try {
    await db.query('UPDATE users SET foto = $1 WHERE id = $2', [foto, req.user.id]);
    res.json({ message: 'Foto actualizada', foto });
  } catch (e) {
    console.error('ERRO FOTO:', e);
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.delete('/foto', require('../middleware/auth').authMiddleware, async (req, res) => {
  try {
    await db.query('UPDATE users SET foto = NULL WHERE id = $1', [req.user.id]);
    res.json({ message: 'Foto removida' });
  } catch (e) {
    console.error('ERRO REMOVER FOTO:', e);
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.put('/profile', require('../middleware/auth').authMiddleware, async (req, res) => {
  const { nome, email } = req.body;
  try {
    if (email && email !== req.user.email) {
      const { rows } = await db.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, req.user.id]);
      if (rows.length) return res.status(409).json({ message: 'Email já usado' });
    }
    const { rows } = await db.query(
      'UPDATE users SET nome = COALESCE($1, nome), email = COALESCE($2, email) WHERE id = $3 RETURNING id, nome, email, role',
      [nome || null, email || null, req.user.id]
    );
    const token = require('jsonwebtoken').sign(
      { id: rows[0].id, email: rows[0].email, role: rows[0].role, nome: rows[0].nome },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );
    res.json({ user: rows[0], access_token: token });
  } catch (e) {
    console.error('ERRO UPDATE PROFILE:', e);
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.put('/password', require('../middleware/auth').authMiddleware, async (req, res) => {
  const { current_password, new_password } = req.body;
  if (!current_password || !new_password)
    return res.status(400).json({ message: 'Senha actual e nova são obrigatórias' });
  if (new_password.length < 6)
    return res.status(400).json({ message: 'Nova senha deve ter mínimo 6 caracteres' });
  try {
    const { rows } = await db.query('SELECT password FROM users WHERE id = $1', [req.user.id]);
    if (!await require('bcryptjs').compare(current_password, rows[0].password))
      return res.status(401).json({ message: 'Senha actual incorrecta' });
    const hash = await require('bcryptjs').hash(new_password, 10);
    await db.query('UPDATE users SET password = $1 WHERE id = $2', [hash, req.user.id]);
    res.json({ message: 'Senha alterada com sucesso' });
  } catch (e) {
    console.error('ERRO CHANGE PASSWORD:', e);
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ message: 'Email é obrigatório' });
  try {
    const { rows } = await db.query('SELECT id, nome FROM users WHERE email = $1', [email]);
    if (!rows.length) return res.json({ message: 'Se o email existir, receberá instruções' });
    const token = require('crypto').randomBytes(32).toString('hex');
    const exp = new Date(Date.now() + 60 * 60 * 1000);
    await db.query('UPDATE users SET reset_token = $1, reset_expires = $2 WHERE id = $3', [token, exp, rows[0].id]);
    console.log('=== SIMULAÇÃO RESET PASSWORD ===');
    console.log('Para:', email);
    console.log('Link: https://votacao-frontend.onrender.com/reset-password?token=' + token + '&email=' + email);
    res.json({ message: 'Se o email existir, receberá instruções' });
  } catch (e) {
    console.error('ERRO FORGOT PASSWORD:', e);
    res.status(500).json({ message: 'Erro interno' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { email, token, password } = req.body;
  if (!email || !token || !password)
    return res.status(400).json({ message: 'Email, token e nova senha são obrigatórios' });
  if (password.length < 6)
    return res.status(400).json({ message: 'Senha deve ter mínimo 6 caracteres' });
  try {
    const { rows } = await db.query(
      'SELECT id FROM users WHERE email = $1 AND reset_token = $2 AND reset_expires > NOW()',
      [email, token]
    );
    if (!rows.length) return res.status(400).json({ message: 'Link inválido ou expirado' });
    const hash = await require('bcryptjs').hash(password, 10);
    await db.query('UPDATE users SET password = $1, reset_token = NULL, reset_expires = NULL WHERE id = $2', [hash, rows[0].id]);
    res.json({ message: 'Senha redefinida com sucesso' });
  } catch (e) {
    console.error('ERRO RESET PASSWORD:', e);
    res.status(500).json({ message: 'Erro interno' });
  }
});

module.exports = router;
