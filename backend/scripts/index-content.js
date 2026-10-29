require('dotenv').config();
const pool = require('../db/pool');
const chatService = require('../services/chatService');

async function run() {
  // Step 1 — fetch published projects and notes from the database.
  const [projectsResult, notesResult] = await Promise.all([
  pool.query("SELECT * FROM projects WHERE status = $1", ['published']),
  pool.query("SELECT * FROM notes WHERE status = $1", ['published'])
]);

const projects = projectsResult.rows;
const notes = notesResult.rows;

  // Step 2 — for each project/note, build the raw text to embed.
  const documents = [
    ...projects.map((p) => ({
      sourceType: 'project',
      sourceId: p.id,
      text: `${p.title}. ${p.description || ''} Tech stack: ${(p.tech_stack || []).join(', ')}`,
    })),
    ...notes.map((n) => ({
      sourceType: 'note',
      sourceId: n.id,
      text: `${n.title}. ${n.content}`,
    })),
  ];

  const CHUNK_SIZE = 800;
  const CHUNK_OVERLAP = 100;

  for (const doc of documents) {
    //   split this document's text into overlapping chunks.
    const chunks = [];
    for (let i = 0; i < doc.text.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
      chunks.push(doc.text.slice(i, i + CHUNK_SIZE));
    }

    // clear any chunks already indexed for this source, so
    // re-running this script never leaves stale or duplicate rows.
    const sourceColumn = doc.sourceType === 'project' ? 'project_id' : 'note_id';
    await pool.query(`DELETE FROM document_chunks WHERE ${sourceColumn} = $1`, [doc.sourceId]);

    for (const chunkText of chunks) {
      // embed this chunk — same embedText() the live /chat endpoint uses,
      // so indexing and querying are always on the same model.
      const embedding = await chatService.embedText(chunkText);

      // insert the chunk + its embedding.
      await pool.query(
        `INSERT INTO document_chunks (${sourceColumn}, chunk_text, embedding)
         VALUES ($1, $2, $3::vector)`,
        [doc.sourceId, chunkText, JSON.stringify(embedding)]
      );
    }

    console.log(`Indexed ${doc.sourceType} ${doc.sourceId}: ${chunks.length} chunk(s).`);
  }

  console.log('Indexing done.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Indexing failed:', err);
  process.exit(1);
});
