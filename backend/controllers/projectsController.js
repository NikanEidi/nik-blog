const projectService = require('../services/projectService');

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
  res.status(201).json({ status: 'ok', project: result.rows[0] });
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

  if (!result.rows[0]) {
    return res.status(404).json({ status: 'error', message: 'Project not found' });
  }

  res.json({ status: 'ok', project: result.rows[0] });
}

async function remove(req, res) {
  await projectService.deleteProject(req.params.id);
  res.status(204).send();
}

module.exports = { list, getBySlug, create, update, remove };
