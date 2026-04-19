import { skillMatchScore } from './skillMatch'

/**
 * Content-based feed ranking algorithm.
 *
 * Produces a 0–1 score for each project given the current user's profile.
 * Higher score → shown first in the "Relevant" feed.
 *
 * Weight breakdown (sums to 1.0):
 *   35%  Direct skill match        — user has the skills the project needs
 *   20%  Preferred project type    — user explicitly marked this type as preferred
 *   20%  Interaction history type  — user has saved/requested similar project types before
 *   10%  Historic skill overlap    — skills from projects user engaged with match this project
 *    8%  Recency                   — newer projects get a small boost (decays over 14 days)
 *    7%  Popularity                — projects with more saves rank slightly higher
 */
export function computeFeedScore(project, profile) {
  if (!profile) return 0

  const history = profile.interactionHistory || []           // [{type, skills, action, ...}]
  const preferredTypes = profile.preferredProjectTypes || [] // ['research', 'opensource', ...]
  const userSkills = profile.skills || []

  // ── 1. Direct skill match (35%) ──────────────────────────────────────────
  // skillMatchScore returns 0-100; normalise to 0-1
  const skillScore = skillMatchScore(userSkills, project.requiredSkills || []) / 100

  // ── 2. Preferred type match (20%) ─────────────────────────────────────────
  // Binary: 1 if this project's type is in the user's preference list
  const typeScore = preferredTypes.includes(project.type) ? 1 : 0

  // ── 3. Interaction history — type frequency (20%) ────────────────────────
  // How many of the last 30 interactions involved this project type?
  // Normalise: 5+ interactions with this type → full score
  const typeInteractions = history.filter((h) => h.type === project.type).length
  const historyTypeScore = Math.min(typeInteractions / 5, 1)

  // ── 4. Interaction history — skill overlap (10%) ─────────────────────────
  // Union of skills from all projects the user engaged with previously
  const historicSkills = [...new Set(history.flatMap((h) => h.skills || []))]
  const historicSkillScore =
    historicSkills.length > 0
      ? skillMatchScore(historicSkills, project.requiredSkills || []) / 100
      : 0

  // ── 5. Recency (8%) ──────────────────────────────────────────────────────
  // Linear decay: full score on day 0, zero at day 14
  const ageMs = Date.now() - (project.createdAt?.toMillis?.() || 0)
  const ageDays = ageMs / (1000 * 60 * 60 * 24)
  const recencyScore = Math.max(0, 1 - ageDays / 14)

  // ── 6. Popularity (7%) ───────────────────────────────────────────────────
  // Normalise: 20+ saves → full score
  const popularityScore = Math.min((project.savedBy?.length || 0) / 20, 1)

  // ── Weighted sum ──────────────────────────────────────────────────────────
  return (
    skillScore       * 0.35 +
    typeScore        * 0.20 +
    historyTypeScore * 0.20 +
    historicSkillScore * 0.10 +
    recencyScore     * 0.08 +
    popularityScore  * 0.07
  )
}
