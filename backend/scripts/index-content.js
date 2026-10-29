require('dotenv').config();
const pool = require('../db/pool');
const indexService = require('../services/indexService');

// Bulk (re)build of the whole index — the chunk/embed/store logic itself
// now lives in indexService, shared with the per-write hooks in the
// controllers, so running this script and saving one note from the admin
// panel go through the exact same code path.
async function run() {
  const [projectsResult, notesResult] = await Promise.all([
    pool.query('SELECT * FROM projects WHERE status = $1', ['published']),
    pool.query('SELECT * FROM notes WHERE status = $1', ['published']),
  ]);

  for (const project of projectsResult.rows) {
    await indexService.syncProjectIndex(project);
    console.log(`Indexed project ${project.id}.`);
  }

  for (const note of notesResult.rows) {
    await indexService.syncNoteIndex(note);
    console.log(`Indexed note ${note.id}.`);
  }

  console.log('Indexing done.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Indexing failed:', err);
  process.exit(1);
});
