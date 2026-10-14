const { verifyToken } = require('../services/authService');

// Protects a route: no valid token, no access. Attach this to any
// route that only the admin (Nikan) should be able to call.
//
// Checks the httpOnly cookie first (how the browser/admin-panel
// authenticates), falling back to a Bearer header (how curl/a future
// non-browser client authenticates) — the admin panel never has to send
// an Authorization header itself, the browser attaches the cookie
// automatically on every request.
function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;
  const token = req.cookies.token || bearerToken;

  if (!token) {
    return res.status(401).json({ status: 'error', message: 'Missing or expired login' });
  }

  try {
    req.admin = verifyToken(token);
    next();
  } catch (err) {
    res.status(401).json({ status: 'error', message: 'Invalid or expired token' });
  }
}

module.exports = requireAuth;
