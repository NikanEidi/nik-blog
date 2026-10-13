const GITHUB_USERNAME = 'NikanEidi';

async function fetchRepos() {
  const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100`);

  if (!response.ok) {
    throw new Error(`GitHub API request failed: ${response.status}`);
  }

  const repos = await response.json();

  return repos
    .filter((repo) => !repo.fork)
    .map((repo) => ({
      title: repo.name,
      description: repo.description || '',
      tech_stack: repo.language ? [repo.language] : [],
      github_url: repo.html_url,
      live_url: repo.homepage || null,
    }));
}

module.exports = { fetchRepos };
