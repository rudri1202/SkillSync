import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

const colorMap = {
  hackathon: 'bg-purple-100 text-purple-700',
  research: 'bg-blue-100 text-blue-700',
  startup: 'bg-orange-100 text-orange-700',
  opensource: 'bg-green-100 text-green-700',
  development: 'bg-cyan-100 text-cyan-700',
  analytics: 'bg-violet-100 text-violet-700',
  design: 'bg-pink-100 text-pink-700',
  other: 'bg-gray-100 text-gray-700',
  skill: 'bg-indigo-50 text-indigo-700',
  matched: 'bg-green-50 text-green-700 ring-1 ring-green-300',
  default: 'bg-gray-100 text-gray-700',
}

export function Badge({ children, type, className }) {
  const color = colorMap[type] || colorMap.default
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        color,
        className
      )}
    >
      {children}
    </span>
  )
}

export function SkillChip({ skill, onRemove, matched, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium',
        matched
          ? 'bg-green-50 text-green-700 ring-1 ring-green-200'
          : 'bg-indigo-50 text-indigo-700',
        className
      )}
    >
      {skill}
      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(skill)}
          className="ml-0.5 rounded-full hover:text-red-500 transition-colors"
        >
          <X size={12} />
        </button>
      )}
    </span>
  )
}

export const PROJECT_TYPE_LABELS = {
  hackathon: 'Hackathon',
  research: 'Research',
  startup: 'Startup',
  opensource: 'Open Source',
  development: 'Development',
  analytics: 'Analytics',
  design: 'Design',
  other: 'Other',
}
