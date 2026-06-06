const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function enviarOtp(email, nome, otp) {
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      await transporter.sendMail({
        from: `"VotaçãoMZ" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Código de Verificação - VotaçãoMZ',
        html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto">
          <div style="background:#4f46e5;padding:20px;text-align:center;border-radius:12px 12px 0 0">
            <h1 style="color:white;margin:0;font-size:20px">VotaçãoMZ</h1>
          </div>
          <div style="padding:24px;border:1px solid #e2e8f0;border-radius:0 0 12px 12px">
            <p>Olá <strong>${nome}</strong>,</p>
            <p>O seu código de verificação é:</p>
            <div style="background:#f1f5f9;padding:16px;text-align:center;border-radius:8px;font-size:28px;letter-spacing:8px;font-weight:bold;color:#4f46e5;margin:16px 0">${otp}</div>
            <p style="color:#64748b;font-size:14px">Válido por 15 minutos.</p>
            <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0" />
            <p style="color:#94a3b8;font-size:12px">Se não solicitou este código, ignore este email.</p>
          </div>
        </div>`,
      });
      console.log('Email enviado para', email);
      return true;
    } catch (err) {
      console.log('Erro ao enviar email real, a usar fallback. Erro:', err.message);
    }
  }

  console.log('=== SIMULAÇÃO DE EMAIL ===');
  console.log('Para:', email);
  console.log('OTP:', otp);
  return true;
}

module.exports = { enviarOtp };
