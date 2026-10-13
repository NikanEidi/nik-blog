const pool = require('../db/pool');

// Turns "LedgerLite — Digital Bank API" into "ledgerlite-digital-bank-api":
// lowercase, spaces and punctuation become dashes, no repeated dashes.
function toSlug(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function listProjects() {
  return pool.query('SELECT * FROM projects ORDER BY created_at DESC');
}

function getProjectBySlug(slug) {
  return pool.query('SELECT * FROM projects WHERE slug = $1', [slug]);
}

function createProject({ title, description, techStack, githubUrl, liveUrl }) {
  const slug = toSlug(title);
  return pool.query(
    `INSERT INTO projects (title, slug, description, tech_stack, github_url, live_url)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [title, slug, description, techStack, githubUrl, liveUrl]
  );
}

function updateProject(id, { title, description, techStack, githubUrl, liveUrl }) {
  return pool.query(
    `UPDATE projects
     SET title = $1, description = $2, tech_stack = $3, github_url = $4, live_url = $5, updated_at = NOW()
     WHERE id = $6
     RETURNING *`,
    [title, description, techStack, githubUrl, liveUrl, id]
  );
}

function deleteProject(id) {
  return pool.query('DELETE FROM projects WHERE id = $1', [id]);
}

module.exports = { toSlug, listProjects, getProjectBySlug, createProject, updateProject, deleteProject };
