/**
 * GET /api/github-repos?username=octocat
 * Fetches user repos + language breakdown and returns mapped skill tags.
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { username } = req.query
  if (!username) {
    return res.status(400).json({ error: 'username is required' })
  }

  const token = process.env.GITHUB_TOKEN
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'SkillSync-App',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  try {
    // Fetch repos
    const reposRes = await fetch(
      `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=30&type=public`,
      { headers }
    )

    if (!reposRes.ok) {
      if (reposRes.status === 404) {
        return res.status(404).json({ error: 'GitHub user not found' })
      }
      if (reposRes.status === 403) {
        return res.status(429).json({ error: 'GitHub rate limit hit. Try again shortly.' })
      }
      throw new Error(`GitHub API error ${reposRes.status}`)
    }

    const repos = await reposRes.json()

    // Collect all languages from top 5 repos
    const top5 = repos.slice(0, 5)
    const languageCounts = {}

    // Primary language from each repo
    repos.forEach((repo) => {
      if (repo.language) {
        languageCounts[repo.language] = (languageCounts[repo.language] || 0) + 1
      }
      // Also add repo topics
      if (repo.topics) {
        repo.topics.forEach((topic) => {
          languageCounts[topic] = (languageCounts[topic] || 0) + 1
        })
      }
    })

    // Fetch detailed language bytes for top 5 repos
    await Promise.all(
      top5.map(async (repo) => {
        try {
          const langRes = await fetch(
            `https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(repo.name)}/languages`,
            { headers }
          )
          if (langRes.ok) {
            const langs = await langRes.json()
            Object.keys(langs).forEach((lang) => {
              languageCounts[lang] = (languageCounts[lang] || 0) + Math.round(langs[lang] / 1000)
            })
          }
        } catch {
          // ignore individual repo errors
        }
      })
    )

    // Sort by count descending, return top 15
    const languages = Object.entries(languageCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 15)
      .map(([lang]) => lang)

    return res.status(200).json({ languages })
  } catch (err) {
    console.error('github-repos error:', err)
    return res.status(500).json({ error: 'Failed to fetch GitHub data' })
  }
}
