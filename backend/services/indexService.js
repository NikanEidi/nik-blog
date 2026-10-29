const pool = require('../db/pool');
const chatService = require('./chatService');

const CHUNK_SIZE = 800;
const CHUNK_OVERLAP = 100;

function splitIntoChunks(text) {
  const chunks = [];
  for (let i = 0; i < text.length; i += CHUNK_SIZE - CHUNK_OVERLAP) {
    chunks.push(text.slice(i, i + CHUNK_SIZE));
  }
  return chunks;
}

async function removeChunks(sourceType, sourceId) {
  const column = sourceType === 'project' ? 'project_id' : 'note_id';
  await pool.query(`DELETE FROM document_chunks WHERE ${column} = $1`, [sourceId]);
}

// Re-indexes one project or note: clears its old chunks, then — if `text`
// is given — chunks, embeds, and stores the new ones. Shared by the bulk
// script (scripts/index-content.js) and the per-write hooks below, so
// there's one chunking/embedding path, not two.
async function reindexSource(sourceType, sourceId, text) {
  await removeChunks(sourceType, sourceId);
  if (!text) return;

  const column = sourceType === 'project' ? 'project_id' : 'note_id';
  for (const chunk of splitIntoChunks(text)) {
    const embedding = await chatService.embedText(chunk);
    await pool.query(
      `INSERT INTO document_chunks (${column}, chunk_text, embedding) VALUES ($1, $2, $3::vector)`,
      [sourceId, chunk, JSON.stringify(embedding)]
    );
  }
}

function projectText(project) {
  return `${project.title}. ${project.description || ''} Tech stack: ${(project.tech_stack || []).join(', ')}`;
}

function noteText(note) {
  return `${note.title}. ${note.content}`;
}

// Called after any write that could change what's searchable. Passing
// `null` as the text (an unpublished row) clears that source's chunks
// without replacing them — so a draft or deleted post can never show up
// in a chatbot answer.
async function syncProjectIndex(project) {
  await reindexSource('project', project.id, project.status === 'published' ? projectText(project) : null);
}

async function syncNoteIndex(note) {
  await reindexSource('note', note.id, note.status === 'published' ? noteText(note) : null);
}

module.exports = { syncProjectIndex, syncNoteIndex, removeChunks, projectText, noteText };
