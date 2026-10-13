require('dotenv').config();
const githubService = require('../services/githubService');
const projectService = require('../services/projectService');

async function run() {
  const repos = await githubService.fetchRepos();

  let inserted = 0;
  let updated = 0;

  for (const repo of repos) {
    const { wasInserted } = await projectService.upsertFromGithub(repo);
    if (wasInserted) {
      inserted++;
    } else {
      updated++;
    }
  }

  console.log(`Synced ${repos.length} repos: ${inserted} inserted, ${updated} updated.`);
  process.exit(0);
}

run().catch((err) => {
  console.error('GitHub sync failed:', err.message);
  process.exit(1);
});
