const express = require('express');
const router = express.Router();
const pool = require('../db/pool');

// Basic liveness check — just confirms the server process is up.
router.get('/', (req, res) => {
  res.json({ status: 'ok' });
});

// Deeper check — actually queries Postgres, so this fails if the
// database connection is broken, not just the server itself.
router.get('/db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', db_time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

module.exports = router;
