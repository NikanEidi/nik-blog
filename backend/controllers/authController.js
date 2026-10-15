const pool = require('../db/pool');
const { comparePassword, generateToken } = require('../services/authService');

// httpOnly: client-side JavaScript can never read this cookie (even via a
// successful XSS injection), which is the whole reason it's safer than
// storing the token in localStorage. In production the frontend (Vercel)
// and backend (Render) live on different domains, so this is a genuine
// cross-site request — that needs sameSite: 'none' + secure: true, or the
// browser silently refuses to send the cookie back on later requests.
// Locally both run on localhost with different ports, which the browser
// treats as same-site, so 'lax' + non-secure (plain HTTP) still works there.
const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 2 * 60 * 60 * 1000, // matches the JWT's own 2h expiry
};

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

  res.cookie('token', token, COOKIE_OPTIONS);

  res.json({ status: 'ok' });
}

function logout(req, res) {
  // clearCookie must be called with the same attributes the cookie was set
  // with (sameSite/secure/path) — a mismatch means the browser treats it as
  // a different cookie and silently fails to clear the real one.
  res.clearCookie('token', COOKIE_OPTIONS);
  res.json({ status: 'ok' });
}

module.exports = { login, logout };
