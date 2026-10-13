const express = require('express');
const pool = require('./db');
const app = express();
const PORT = process.env.PORT || 3001;

// Basic liveness check — just confirms the server process is up.
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Deeper check — actually queries Postgres, so this fails if the
// database connection is broken, not just the server itself.
app.get('/health/db', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', db_time: result.rows[0].now });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});