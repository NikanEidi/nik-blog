require('dotenv').config();
const fs = require('fs');
const path = require('path');
const readline = require('readline/promises');
const { stdin, stdout } = require('process');

const githubService = require('../services/githubService');
const projectService = require('../services/projectService');
const noteService = require('../services/noteService');
const indexService = require('../services/indexService');


const STATE_PATH = path.join(__dirname, '.review-cli-state.json');

function loadState() {
  if (!fs.existsSync(STATE_PATH)) return { skippedNoteFiles: [] };
  return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
}

function saveState(state) {
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
}

function findMarkdownFiles(dir) {
  let results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(findMarkdownFiles(fullPath));
    } else if (entry.name.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

// A note file's title: the first markdown H1 ("# Some Title") if the file
// has one, otherwise its filename with the extension stripped.
function titleFromFile(filePath, content) {
  const h1Match = content.match(/^#\s+(.+)$/m);
  if (h1Match) return h1Match[1].trim();
  return path.basename(filePath, '.md');
}

async function reviewProjects(rl) {
  console.log('\n=== Checking GitHub for new projects ===');
  const repos = await githubService.fetchRepos();
  let inserted = 0;
  for (const repo of repos) {
    const { wasInserted } = await projectService.upsertFromGithub(repo);
    if (wasInserted) inserted++;
  }
  console.log(`Synced ${repos.length} repos (${inserted} brand new, inserted as draft).`);

  const draftsResult = await projectService.listProjects();
  const drafts = draftsResult.rows.filter((p) => p.status === 'draft');

  if (drafts.length === 0) {
    console.log('No unreviewed draft projects. Nothing to ask about.');
    return;
  }

  console.log(`\n${drafts.length} project(s) waiting for review:\n`);

  for (const project of drafts) {
    console.log(`--- ${project.title} ---`);
    console.log(project.description || '(no description)');
    console.log('GitHub:', project.github_url);
    console.log('Detected tags:', project.tech_stack.join(', ') || '(none)');

    const answer = (await rl.question('Add this project? [y/n] ')).trim().toLowerCase();

    if (answer !== 'y') {
      await projectService.updateProjectStatus(project.id, 'skipped');
      console.log('Skipped -- will not ask again.\n');
      continue;
    }

    const tagsInput = (await rl.question(
      `Tags (comma-separated) [${project.tech_stack.join(', ')}]: `
    )).trim();
    const tags = tagsInput ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean) : project.tech_stack;

    await projectService.updateProject(project.id, {
      title: project.title,
      description: project.description,
      techStack: tags,
      githubUrl: project.github_url,
      liveUrl: project.live_url,
      imageUrl: project.image_url,
    });
    const publishedResult = await projectService.updateProjectStatus(project.id, 'published');
    await indexService.syncProjectIndex(publishedResult.rows[0]);
    console.log('Published.\n');
  }
}

async function reviewNotes(rl) {
  console.log('\n=== Adding notes ===');
  const folder = (await rl.question('Which folder should I search for .md note files? ')).trim();

  if (!folder || !fs.existsSync(folder)) {
    console.log('That folder does not exist, skipping notes.');
    return;
  }

  const state = loadState();
  const mdFiles = findMarkdownFiles(folder);

  const existingNotesResult = await noteService.listNotes();
  const existingSlugs = new Set(existingNotesResult.rows.map((n) => n.slug));

  const newFiles = mdFiles.filter(
    (f) => !state.skippedNoteFiles.includes(f)
  );

  if (newFiles.length === 0) {
    console.log('No new .md files found in that folder.');
    return;
  }

  const projectsResult = await projectService.listProjects();
  const projects = projectsResult.rows;

  for (const filePath of newFiles) {
    const content = fs.readFileSync(filePath, 'utf8');
    const title = titleFromFile(filePath, content);
    const slug = projectService.toSlug(title);

    if (existingSlugs.has(slug)) {
      continue; // already in the database under this title, nothing to do
    }

    console.log(`\n--- ${path.relative(folder, filePath)} ---`);
    console.log('Title:', title);

    const answer = (await rl.question('Add this note? [y/n] ')).trim().toLowerCase();
    if (answer !== 'y') {
      state.skippedNoteFiles.push(filePath);
      saveState(state);
      console.log('Skipped -- will not ask again.');
      continue;
    }

    console.log('\nProjects:');
    projects.forEach((p, i) => console.log(`  ${i + 1}. ${p.title}`));
    console.log('  0. (no project)');
    const projectChoice = (await rl.question('Link to which project? [number] ')).trim();
    const chosenIndex = parseInt(projectChoice, 10) - 1;
    const projectId = projects[chosenIndex] ? projects[chosenIndex].id : null;

    const category = (await rl.question('Category/tag: ')).trim() || 'general';

    const result = await noteService.createNote({ title, category, content, projectId });
    console.log(`Created as draft: "${title}" (publish it from the admin panel when ready).`);

    existingSlugs.add(slug);
  }
}

function printDatabaseTarget() {
  // Easy to point this at the wrong database by accident (e.g. the local
  // .env's DATABASE_URL instead of production's) and not notice until
  // wondering why the live site didn't change. Always say out loud which
  // database host this run is actually writing to.
  try {
    const host = new URL(process.env.DATABASE_URL).host;
    const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
    console.log(`\nConnected to database host: ${host}${isLocal ? '  <-- LOCAL, not production!' : ''}`);
  } catch {
    console.log('\nCould not parse DATABASE_URL to show which database this is.');
  }
}

async function main() {
  printDatabaseTarget();
  const rl = readline.createInterface({ input: stdin, output: stdout });
  try {
    await reviewProjects(rl);
    await reviewNotes(rl);
  } finally {
    rl.close();
  }
  console.log('\nDone.');
  process.exit(0);
}

main().catch((err) => {
  console.error('review-cli failed:', err.message);
  process.exit(1);
});
