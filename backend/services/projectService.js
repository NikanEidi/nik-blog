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

// Public endpoints must never leak a draft (e.g. a freshly GitHub-synced
// repo Nikan hasn't reviewed yet) — these are the versions the public
// routes call. listProjects/getProjectBySlug stay unfiltered for later
// admin-only views that need to see drafts too.
function listPublishedProjects() {
  return pool.query("SELECT * FROM projects WHERE status = 'published' ORDER BY created_at DESC");
}

function getPublishedProjectBySlug(slug) {
  return pool.query("SELECT * FROM projects WHERE slug = $1 AND status = 'published'", [slug]);
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

// A focused update for the admin dashboard's publish/draft toggle — only
// touches `status`, so the button doesn't need to resend the whole project.
function updateProjectStatus(id, status) {
  return pool.query(
    'UPDATE projects SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
    [status, id]
  );
}

async function upsertFromGithub({ title, description, tech_stack, github_url, live_url }) {
  // Match by github_url first — this is how an already-synced row (source
  // 'github' or a manual row that got linked below) is found on every later
  // run. Metadata gets refreshed but status/source are left alone, so a
  // published project never gets reset to draft just by re-syncing.
  const byUrl = await pool.query(
    'SELECT id FROM projects WHERE github_url = $1',
    [github_url]
  );

  if (byUrl.rows.length > 0) {
    const result = await pool.query(
      `UPDATE projects
       SET title = $1, description = $2, tech_stack = $3, live_url = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [title, description, tech_stack, live_url, byUrl.rows[0].id]
    );
    return { row: result.rows[0], wasInserted: false };
  }

  const slug = toSlug(title);

  // A manual project can already own this exact slug (e.g. LedgerLite was
  // added by hand before this sync ever ran). Instead of clashing on the
  // unique slug or skipping it, adopt it: link github_url onto that row and
  // refresh its metadata, but keep its current status/source as-is so a
  // manually published project stays published.
  const slugOwner = await pool.query(
    'SELECT id FROM projects WHERE slug = $1',
    [slug]
  );
  if (slugOwner.rows.length > 0) {
    const result = await pool.query(
      `UPDATE projects
       SET description = $1, tech_stack = $2, github_url = $3, live_url = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [description, tech_stack, github_url, live_url, slugOwner.rows[0].id]
    );
    return { row: result.rows[0], wasInserted: false };
  }

  const result = await pool.query(
    `INSERT INTO projects (title, slug, description, tech_stack, github_url, live_url, source, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'github', 'draft')
     RETURNING *`,
    [title, slug, description, tech_stack, github_url, live_url]
  );
  return { row: result.rows[0], wasInserted: true };
}

module.exports = {
  toSlug,
  listProjects,
  getProjectBySlug,
  listPublishedProjects,
  getPublishedProjectBySlug,
  createProject,
  updateProject,
  updateProjectStatus,
  deleteProject,
  upsertFromGithub,
};
