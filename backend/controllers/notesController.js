const noteService = require('../services/noteService');

const VALID_CATEGORIES = ['ai-ml', 'backend', 'infrastructure', 'ios', 'dsa'];

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

  if (!VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ status: 'error', message: `category must be one of: ${VALID_CATEGORIES.join(', ')}` });
  }

  const result = await noteService.createNote({ title, category, content, projectId, imageUrl });
  res.status(201).json({ status: 'ok', note: result.rows[0] });
}

async function update(req, res) {
  const { title, category, content, projectId, status, imageUrl } = req.body;

  if (category && !VALID_CATEGORIES.includes(category)) {
    return res.status(400).json({ status: 'error', message: `category must be one of: ${VALID_CATEGORIES.join(', ')}` });
  }

  const result = await noteService.updateNote(req.params.id, { title, category, content, projectId, status, imageUrl });

  if (!result.rows[0]) {
    return res.status(404).json({ status: 'error', message: 'Note not found' });
  }

  res.json({ status: 'ok', note: result.rows[0] });
}

async function remove(req, res) {
  await noteService.deleteNote(req.params.id);
  res.status(204).send();
}

module.exports = { list, getBySlug, create, update, remove };
