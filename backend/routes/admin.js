const express = require('express');
const router = express.Router();
const requireAuth = require('../middleware/requireAuth');

// A minimal protected route to prove the auth flow works end to end
// before we build real admin features (creating notes/projects) on
// top of it. Real admin routes will sit behind this same middleware.
router.get('/me', requireAuth, (req, res) => {
  res.json({ status: 'ok', admin: req.admin });
});

module.exports = router;
