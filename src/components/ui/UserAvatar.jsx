const COLORS = [
  { bg: 'bg-indigo-500', hex: '#6366f1' },
  { bg: 'bg-violet-500', hex: '#8b5cf6' },
  { bg: 'bg-pink-500', hex: '#ec4899' },
  { bg: 'bg-rose-500', hex: '#f43f5e' },
  { bg: 'bg-amber-500', hex: '#f59e0b' },
  { bg: 'bg-emerald-500', hex: '#10b981' },
  { bg: 'bg-cyan-500', hex: '#06b6d4' },
  { bg: 'bg-slate-500', hex: '#64748b' },
]

export const AVATAR_COLORS = COLORS

function getInitials(name) {
  if (!name) return '?'
  // Keep only words that start with a letter — filters out "(IITJ)" style tokens
  const words = name.trim().split(/\s+/).filter((w) => /^[a-zA-Z]/.test(w))
  if (words.length === 0) return name[0]?.toUpperCase() || '?'
  if (words.length === 1) return words[0][0].toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

/**
 * @param {{ name: string, avatarUrl?: string, avatarColor?: string, size?: 'sm'|'md'|'lg', className?: string }} props
 */
export function UserAvatar({ name, avatarUrl, avatarColor, size = 'md', className = '' }) {
  const sizeClass = size === 'sm' ? 'h-7 w-7 text-xs' : size === 'lg' ? 'h-20 w-20 text-2xl' : 'h-9 w-9 text-sm'
  const color = AVATAR_COLORS.find((c) => c.hex === avatarColor) || AVATAR_COLORS[0]

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt={name}
        className={`rounded-full object-cover ${sizeClass} ${className}`}
      />
    )
  }

  return (
    <div
      className={`rounded-full flex items-center justify-center font-bold text-white ${sizeClass} ${color.bg} ${className}`}
    >
      {getInitials(name)}
    </div>
  )
}
