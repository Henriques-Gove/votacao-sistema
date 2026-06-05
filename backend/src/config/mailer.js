async function enviarOtp(email, nome, otp) {
  console.log("=== SIMULAÇÃO DE EMAIL ===");
  console.log("Para:", email);
  console.log("Nome:", nome);
  console.log("OTP:", otp);
  console.log("==========================");

  return true;
}

module.exports = { enviarOtp };