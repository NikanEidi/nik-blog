const GITHUB_USERNAME = 'NikanEidi';

async function fetchRepos() {
  // Unauthenticated GitHub API requests are capped at 60/hour per IP, easy
  // to exhaust on Render's shared IPs. A token raises that to 5000/hour.
  const headers = process.env.GITHUB_TOKEN ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` } : {};

  const response = await fetch(`https://api.github.com/users/${GITHUB_USERNAME}/repos?per_page=100`, { headers });

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
      // GitHub's own "last push" timestamp — the real data behind the
      // homepage's Live Pulse indicator (DESIGN.md), not a decorative
      // number. Distinct from our own `updated_at`, which is when *we*
      // last wrote to the row, not when Nikan last pushed a commit.
      github_pushed_at: repo.pushed_at,
    }));
}

module.exports = { fetchRepos };
