import { Search } from 'lucide-react'

const TYPES = [
  { value: 'all', label: 'All Types' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'research', label: 'Research' },
  { value: 'startup', label: 'Startup' },
  { value: 'opensource', label: 'Open Source' },
  { value: 'development', label: 'Development' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'design', label: 'Design' },
  { value: 'other', label: 'Other' },
]

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'closed', label: 'Closed' },
]

const SORTS = [
  { value: 'relevant', label: 'Relevant' },
  { value: 'latest', label: 'Latest' },
  { value: 'popular', label: 'Popular' },
]

export function FeedFilters({ filters, onChange }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative flex-1 min-w-[180px]">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        />
        <input
          type="text"
          placeholder="Search projects..."
          value={filters.query}
          onChange={(e) => onChange({ ...filters, query: e.target.value })}
          className="w-full rounded-lg border border-gray-300 py-2 pl-8 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>

      {/* Type filter */}
      <select
        value={filters.type}
        onChange={(e) => onChange({ ...filters, type: e.target.value })}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        {TYPES.map((t) => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>

      {/* Status filter */}
      <select
        value={filters.status}
        onChange={(e) => onChange({ ...filters, status: e.target.value })}
        className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      {/* Sort */}
      <div className="flex rounded-lg border border-gray-200 overflow-hidden">
        {SORTS.map((s) => (
          <button
            key={s.value}
            type="button"
            onClick={() => onChange({ ...filters, sort: s.value })}
            className={`px-3 py-2 text-sm font-medium transition-colors ${
              filters.sort === s.value
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Saved toggle */}
      <label className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-600 select-none">
        <input
          type="checkbox"
          checked={filters.savedOnly}
          onChange={(e) => onChange({ ...filters, savedOnly: e.target.checked })}
          className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
        />
        Saved only
      </label>
    </div>
  )
}
