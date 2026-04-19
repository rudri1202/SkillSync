/**
 * POST /api/github-invite
 * Body: { owner: string, repo: string, username: string }
 * Sends a GitHub collaborator invite using the app-level GitHub token.
 *
 * NOTE: The GITHUB_TOKEN must have write/admin access to the repo.
 * For best results, the project owner should store their own PAT,
 * but for MVP we use a single app token.
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { owner, repo, username } = req.body || {}
  if (!owner || !repo || !username) {
    return res.status(400).json({ error: 'owner, repo, and username are required' })
  }

  const token = process.env.GITHUB_TOKEN
  if (!token) {
    return res.status(503).json({ error: 'GitHub integration not configured' })
  }

  try {
    const response = await fetch(
      `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/collaborators/${encodeURIComponent(username)}`,
      {
        method: 'PUT',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'User-Agent': 'SkillSync-App',
        },
        body: JSON.stringify({ permission: 'push' }),
      }
    )

    if (response.status === 201) {
      return res.status(201).json({ success: true, message: `Invite sent to @${username}` })
    }
    if (response.status === 204) {
      return res.status(200).json({ success: true, message: `@${username} is already a collaborator` })
    }
    if (response.status === 404) {
      return res.status(404).json({ error: 'Repository or user not found' })
    }
    if (response.status === 403) {
      return res.status(403).json({ error: 'Insufficient GitHub permissions' })
    }

    const data = await response.json().catch(() => ({}))
    return res.status(response.status).json({ error: data.message || 'GitHub API error' })
  } catch (err) {
    console.error('github-invite error:', err)
    return res.status(500).json({ error: 'Failed to send GitHub invite' })
  }
}
