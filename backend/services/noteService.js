const pool = require('../db/pool');
const { toSlug } = require('./projectService');

function listPublishedNotes() {
  return pool.query("SELECT * FROM notes WHERE status = 'published' ORDER BY pinned DESC, created_at DESC");
}

function getPublishedNoteBySlug(slug) {
  return pool.query("SELECT * FROM notes WHERE slug = $1 AND status = 'published'", [slug]);
}

function listNotes() {
  return pool.query('SELECT * FROM notes ORDER BY created_at DESC');
}

function getNoteBySlug(slug) {
  return pool.query('SELECT * FROM notes WHERE slug = $1', [slug]);
}

function getNoteById(id) {
  return pool.query('SELECT * FROM notes WHERE id = $1', [id]);
}

function createNote({ title, category, content, projectId, imageUrl }) {
  const slug = toSlug(title);
  return pool.query(
    `INSERT INTO notes (title, slug, category, content, project_id, image_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [title, slug, category, content, projectId || null, imageUrl || null]
  );
}

function updateNote(id, { title, category, content, projectId, status, imageUrl }) {
  return pool.query(
    `UPDATE notes
     SET title = $1, category = $2, content = $3, project_id = $4, status = $5, image_url = $6, updated_at = NOW()
     WHERE id = $7
     RETURNING *`,
    [title, category, content, projectId || null, status, imageUrl || null, id]
  );
}

function deleteNote(id) {
  return pool.query('DELETE FROM notes WHERE id = $1', [id]);
}

// Same focused toggle as projectService.updateProjectStatus — only touches
// `status`, for the admin dashboard's publish/draft button.
function updateNoteStatus(id, status) {
  return pool.query(
    'UPDATE notes SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [status, id]
  );
}

function setNotePinned(id, pinned) {
  return pool.query(
    'UPDATE notes SET pinned = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [pinned, id]
  );
}

module.exports = {
  listPublishedNotes,
  getPublishedNoteBySlug,
  listNotes,
  getNoteBySlug,
  getNoteById,
  createNote,
  updateNote,
  updateNoteStatus,
  setNotePinned,
  deleteNote,
};
