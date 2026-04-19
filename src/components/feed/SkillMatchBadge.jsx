export function SkillMatchBadge({ matched, total }) {
  if (total === 0) return null
  const pct = Math.round((matched / total) * 100)
  const color =
    pct >= 70
      ? 'bg-green-50 text-green-700 ring-green-200'
      : pct >= 40
      ? 'bg-yellow-50 text-yellow-700 ring-yellow-200'
      : 'bg-gray-50 text-gray-500 ring-gray-200'

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${color}`}
    >
      {matched}/{total} skills matched
    </span>
  )
}
