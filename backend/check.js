const bcrypt = require('bcryptjs');
const sql = require('fs').readFileSync('src/config/schema.sql','utf8');
const i = sql.indexOf('$2a');
const h = sql.substring(i, i+60);
console.log('Hash:', h);
bcrypt.compare('Admin@123', h).then(r => console.log('Admin@123 match:', r));
bcrypt.compare('password', h).then(r => console.log('password match:', r));
