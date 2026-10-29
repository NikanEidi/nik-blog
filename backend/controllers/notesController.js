const noteService = require('../services/noteService');
const indexService = require('../services/indexService');

async function list(req, res) {
  const result = await noteService.listPublishedNotes();
  res.json({ status: 'ok', notes: result.rows });
}

async function getBySlug(req, res) {
  const result = await noteService.getPublishedNoteBySlug(req.params.slug);
  const note = result.rows[0];

  if (!note) {
    return res.status(404).json({ status: 'error', message: 'Note not found' });
  }

  res.json({ status: 'ok', note });
}

async function create(req, res) {
  const { title, category, content, projectId, imageUrl } = req.body;

  if (!title || !category || !content) {
    return res.status(400).json({ status: 'error', message: 'title, category, and content are required' });
  }

  const result = await noteService.createNote({ title, category: category.trim(), content, projectId, imageUrl });
  const note = result.rows[0];

  // Notes default to 'draft' (schema.sql), so this is almost always a
  // no-op in practice — kept anyway in case a future form lets a note be
  // created already published.
  await indexService.syncNoteIndex(note);

  res.status(201).json({ status: 'ok', note });
}

async function update(req, res) {
  const { title, category, content, projectId, status, imageUrl } = req.body;

  const result = await noteService.updateNote(req.params.id, {
    title,
    category: category?.trim(),
    content,
    projectId,
    status,
    imageUrl,
  });

  const note = result.rows[0];
  if (!note) {
    return res.status(404).json({ status: 'error', message: 'Note not found' });
  }

  // Covers every case: edited content, newly published, or unpublished —
  // syncNoteIndex re-chunks if published, clears the chunks otherwise.
  await indexService.syncNoteIndex(note);

  res.json({ status: 'ok', note });
}

async function remove(req, res) {
  await indexService.removeChunks('note', req.params.id);
  await noteService.deleteNote(req.params.id);
  res.status(204).send();
}

module.exports = { list, getBySlug, create, update, remove };
