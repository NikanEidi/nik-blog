const { verifyToken } = require('../services/authService');

// Protects a route: no valid token, no access. Attach this to any
// route that only the admin (Nikan) should be able to call.
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'Missing or malformed Authorization header' });
  }

  const token = authHeader.split(' ')[1];

  try {
    req.admin = verifyToken(token);
    next();
  } catch (err) {
    res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
  }
}

module.exports = requireAuth;
