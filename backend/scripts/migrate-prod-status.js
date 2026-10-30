// One-off migration runner: reads DATABASE_URL from .env.neon (a file you
// create yourself, never committed) instead of a shell argument, so special
// characters in the connection string (like & in the query string) can't
// get mangled by the shell. Delete .env.neon when you're done with this.
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.neon') });

const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('No DATABASE_URL found in backend/.env.neon -- create that file first.');
  process.exit(1);
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

(async () => {
  const host = new URL(process.env.DATABASE_URL).host;
  console.log('Connected to:', host);

  await pool.query("ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check");
  await pool.query("ALTER TABLE projects ADD CONSTRAINT projects_status_check CHECK (status IN ('draft', 'published', 'skipped'))");
  console.log('Migration applied: skipped status allowed.');

  process.exit(0);
})().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
