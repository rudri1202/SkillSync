/**
 * Returns the number of skills the user matches for a project.
 * @param {string[]} userSkills
 * @param {string[]} requiredSkills
 * @returns {{ matched: number, total: number, matchedSkills: string[] }}
 */
export function computeSkillMatch(userSkills, requiredSkills) {
  if (!requiredSkills || requiredSkills.length === 0) {
    return { matched: 0, total: 0, matchedSkills: [] }
  }

  const userSet = new Set(userSkills.map((s) => s.toLowerCase().trim()))
  const matchedSkills = requiredSkills.filter((s) =>
    userSet.has(s.toLowerCase().trim())
  )

  return {
    matched: matchedSkills.length,
    total: requiredSkills.length,
    matchedSkills,
  }
}

/**
 * Score 0-100 for sorting feed by relevance.
 */
export function skillMatchScore(userSkills, requiredSkills) {
  if (!requiredSkills || requiredSkills.length === 0) return 0
  const { matched } = computeSkillMatch(userSkills, requiredSkills)
  return Math.round((matched / requiredSkills.length) * 100)
}
