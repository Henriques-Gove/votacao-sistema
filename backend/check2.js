const bcrypt = require('bcryptjs');
const hash = '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2uheWG/igi.';

async function test() {
  // Test various passwords
  const passwords = ['Admin@123', 'admin', 'password', 'admin123', 'Admin123', '123456', 'admin@123'];
  for (const pwd of passwords) {
    const r = await bcrypt.compare(pwd, hash);
    if (r) console.log('MATCHED:', pwd);
  }

  // Generate fresh hash for Admin@123 to verify
  const newHash = await bcrypt.hash('Admin@123', 10);
  console.log('New hash for Admin@123:', newHash);

  // Verify new hash works
  const verify = await bcrypt.compare('Admin@123', newHash);
  console.log('New hash verifies:', verify);
}
test();
