// One-time script to create the single admin account. There is no
// public signup route on purpose — this is the only way an
// admin_users row gets created.
//
// Usage: node scripts/create-admin.js <email> <password>

const pool = require('../db/pool');
const { hashPassword } = require('../services/authService');

async function main() {
  const [, , email, password] = process.argv;

  if (!email || !password) {
    console.error('Usage: node scripts/create-admin.js <email> <password>');
    process.exit(1);
  }

  const passwordHash = await hashPassword(password);

  await pool.query(
    'INSERT INTO admin_users (email, password_hash) VALUES ($1, $2)',
    [email, passwordHash]
  );

  console.log(`Admin user created: ${email}`);
  process.exit(0);
}

main().catch((err) => {
  console.error('Failed to create admin user:', err.message);
  process.exit(1);
});
