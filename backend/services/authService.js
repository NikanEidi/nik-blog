const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const SALT_ROUNDS = 10;

// Turns a plain-text password into a one-way hash before it ever
// touches the database — we never store the real password.
function hashPassword(plainPassword) {
  return bcrypt.hash(plainPassword, SALT_ROUNDS);
}

// Compares a plain-text password against a stored hash. Returns
// true/false, never the original password.
function comparePassword(plainPassword, hash) {
  return bcrypt.compare(plainPassword, hash);
}

// Issues a short-lived JWT for a logged-in admin. The payload only
// carries non-sensitive identifiers (id, email) — never the password hash.
function generateToken(adminUser) {
  return jwt.sign(
    { id: adminUser.id, email: adminUser.email },
    process.env.JWT_SECRET,
    { expiresIn: '2h' }
  );
}

// Verifies a token's signature and expiry. Throws if invalid —
// the caller (middleware) decides how to respond.
function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

module.exports = { hashPassword, comparePassword, generateToken, verifyToken };
