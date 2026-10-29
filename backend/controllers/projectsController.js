const projectService = require('../services/projectService');
const indexService = require('../services/indexService');

async function list(req, res) {
  const result = await projectService.listPublishedProjects();
  res.json({ status: 'ok', projects: result.rows });
}

async function getBySlug(req, res) {
  const result = await projectService.getPublishedProjectBySlug(req.params.slug);
  const project = result.rows[0];

  if (!project) {
    return res.status(404).json({ status: 'error', message: 'Project not found' });
  }

  res.json({ status: 'ok', project });
}

async function create(req, res) {
  const { title, description, techStack, githubUrl, liveUrl, imageUrl } = req.body;

  if (!title) {
    return res.status(400).json({ status: 'error', message: 'title is required' });
  }

  const result = await projectService.createProject({
    title,
    description,
    techStack: techStack || [],
    githubUrl,
    liveUrl,
    imageUrl,
  });
  const project = result.rows[0];

  // Projects default to 'published' (schema.sql) — unlike notes, this is
  // the normal case, not an edge case.
  await indexService.syncProjectIndex(project);

  res.status(201).json({ status: 'ok', project });
}

async function update(req, res) {
  const { title, description, techStack, githubUrl, liveUrl, imageUrl } = req.body;
  const result = await projectService.updateProject(req.params.id, {
    title,
    description,
    techStack: techStack || [],
    githubUrl,
    liveUrl,
    imageUrl,
  });

  const project = result.rows[0];
  if (!project) {
    return res.status(404).json({ status: 'error', message: 'Project not found' });
  }

  await indexService.syncProjectIndex(project);

  res.json({ status: 'ok', project });
}

async function remove(req, res) {
  await indexService.removeChunks('project', req.params.id);
  await projectService.deleteProject(req.params.id);
  res.status(204).send();
}

module.exports = { list, getBySlug, create, update, remove };
