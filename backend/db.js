const { Pool } = require('pg');
require('dotenv').config();

// Shared connection pool for the whole app — every route reuses this
// instead of opening a new database connection per request.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = pool;