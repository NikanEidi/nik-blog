const projectService = require('../services/projectService');
const noteService = require('../services/noteService');
const s3Service = require('../services/s3Service');

const VALID_STATUSES = ['draft', 'published'];

async function me(req, res) {
  res.json({ status: 'ok', admin: req.admin });
}

// Admin-only "see everything" views — the public /projects and /notes
// routes only ever return published rows (notes/04-notes-module.md), so
// the dashboard needs its own routes to also see drafts.
async function listAllProjects(req, res) {
  const result = await projectService.listProjects();
  res.json({ status: 'ok', projects: result.rows });
}

async function listAllNotes(req, res) {
  const result = await noteService.listNotes();
  res.json({ status: 'ok', notes: result.rows });
}

async function getNoteById(req, res) {
  const result = await noteService.getNoteById(req.params.id);
  if (!result.rows[0]) {
    return res.status(404).json({ status: 'error', message: 'Note not found' });
  }
  res.json({ status: 'ok', note: result.rows[0] });
}

// Lightweight publish/draft toggle — only changes `status`, so the
// dashboard button doesn't need to resend the whole project/note.
async function updateProjectStatus(req, res) {
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ status: 'error', message: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  const result = await projectService.updateProjectStatus(req.params.id, status);
  if (!result.rows[0]) {
    return res.status(404).json({ status: 'error', message: 'Project not found' });
  }
  res.json({ status: 'ok', project: result.rows[0] });
}

async function updateNoteStatus(req, res) {
  const { status } = req.body;
  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({ status: 'error', message: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  const result = await noteService.updateNoteStatus(req.params.id, status);
  if (!result.rows[0]) {
    return res.status(404).json({ status: 'error', message: 'Note not found' });
  }
  res.json({ status: 'ok', note: result.rows[0] });
}

async function uploadImage(req, res) {
  if (!req.file) {
    return res.status(400).json({ status: 'error', message: 'No image file provided' });
  }

  const url = await s3Service.uploadImage(req.file.buffer, req.file.originalname, req.file.mimetype);
  res.status(201).json({ status: 'ok', url });
}

module.exports = { me, listAllProjects, listAllNotes, getNoteById, updateProjectStatus, updateNoteStatus, uploadImage };
