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

  // httpOnly: client-side JavaScript can never read this cookie (even via
  // a successful XSS injection), which is the whole reason it's safer than
  // storing the token in localStorage. sameSite: 'lax' stops the browser
  // from sending it on cross-site requests (CSRF protection) while still
  // allowing normal navigation. maxAge matches the JWT's own 2h expiry.
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // dev only — must be true once this is served over HTTPS
    maxAge: 2 * 60 * 60 * 1000,
  });

  res.json({ status: 'ok' });
}

function logout(req, res) {
  res.clearCookie('token');
  res.json({ status: 'ok' });
}

module.exports = { login, logout };
