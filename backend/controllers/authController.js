const pool = require('../db/pool');
const { comparePassword, generateToken } = require('../services/authService');

async function login(req, res) {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ status: 'error', message: 'Email and password are required' });
  }

  const result = await pool.query(
    'SELECT * FROM admin_users WHERE email = $1',
    [email]
  );
  const adminUser = result.rows[0];

  // Same generic error whether the email doesn't exist or the password
  // is wrong — telling them apart would let an attacker discover which
  // emails have accounts.
  if (!adminUser) {
    return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
  }

  const passwordMatches = await comparePassword(password, adminUser.password_hash);
  if (!passwordMatches) {
    return res.status(401).json({ status: 'error', message: 'Invalid email or password' });
  }

  const token = generateToken(adminUser);
  res.json({ status: 'ok', token });
}

module.exports = { login };
