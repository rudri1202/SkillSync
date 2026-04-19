import { useState } from 'react'
import { Input, Textarea, Select } from '../ui/Input'
import { Button } from '../ui/Button'
import { SkillChip } from '../ui/Badge'
import { TagSuggest } from './TagSuggest'
import { searchTaxonomy } from '../../utils/taxonomy'
import { Plus } from 'lucide-react'

const PROJECT_TYPES = [
  { value: '', label: 'Select type...' },
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'research', label: 'Research' },
  { value: 'startup', label: 'Startup' },
  { value: 'opensource', label: 'Open Source' },
  { value: 'development', label: 'Development' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'design', label: 'Design' },
  { value: 'other', label: 'Other' },
]

const TEAM_SIZES = [2, 3, 4, 5, 6, 7, 8, 10]

export function ProjectForm({ initialValues = {}, onSubmit, loading, submitLabel = 'Post Project' }) {
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: '',
    requiredSkills: [],
    teamSize: 3,
    githubRepoUrl: '',
    status: 'open',
    ...initialValues,
  })
  const [errors, setErrors] = useState({})
  const [skillQuery, setSkillQuery] = useState('')
  const [skillSuggestions, setSkillSuggestions] = useState([])

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }))
  }

  function handleSkillQuery(e) {
    const val = e.target.value
    setSkillQuery(val)
    setSkillSuggestions(
      val
        ? searchTaxonomy(val)
            .filter((s) => !form.requiredSkills.includes(s))
            .slice(0, 6)
        : []
    )
  }

  function addSkill(skill) {
    if (form.requiredSkills.length >= 10) return
    if (!form.requiredSkills.includes(skill)) {
      set('requiredSkills', [...form.requiredSkills, skill])
    }
    setSkillQuery('')
    setSkillSuggestions([])
  }

  function removeSkill(skill) {
    set('requiredSkills', form.requiredSkills.filter((s) => s !== skill))
  }

  function validate() {
    const e = {}
    if (!form.title.trim()) e.title = 'Title is required'
    if (form.title.length > 80) e.title = 'Max 80 characters'
    if (!form.description.trim()) e.description = 'Description is required'
    if (form.description.length > 1000) e.description = 'Max 1000 characters'
    if (!form.type) e.type = 'Select a project type'
    if (form.requiredSkills.length === 0) e.requiredSkills = 'Add at least 1 required skill'
    return e
  }

  function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) {
      setErrors(errs)
      return
    }
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Input
        label="Project Title *"
        placeholder="e.g. AI Startup Building Vision Models"
        value={form.title}
        onChange={(e) => set('title', e.target.value)}
        maxLength={80}
        error={errors.title}
      />
      <div className="text-right text-xs text-gray-400 -mt-3">{form.title.length}/80</div>

      <Textarea
        label="Description *"
        placeholder="Describe your project, goals, and what collaborators will work on..."
        value={form.description}
        onChange={(e) => set('description', e.target.value)}
        rows={5}
        maxLength={1000}
        error={errors.description}
      />
      <div className="text-right text-xs text-gray-400 -mt-3">{form.description.length}/1000</div>

      <div className="grid grid-cols-2 gap-4">
        <Select
          label="Project Type *"
          value={form.type}
          onChange={(e) => set('type', e.target.value)}
          error={errors.type}
        >
          {PROJECT_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </Select>

        <Select
          label="Team Size"
          value={form.teamSize}
          onChange={(e) => set('teamSize', Number(e.target.value))}
        >
          {TEAM_SIZES.map((n) => (
            <option key={n} value={n}>{n} people</option>
          ))}
        </Select>
      </div>

      {/* Required Skills */}
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">
          Required Skills * ({form.requiredSkills.length}/10)
        </label>
        <div className="relative">
          <input
            type="text"
            placeholder="Search skills to add..."
            value={skillQuery}
            onChange={handleSkillQuery}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                const match = searchTaxonomy(skillQuery.trim())[0]
                if (match) addSkill(match)
              }
            }}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            disabled={form.requiredSkills.length >= 10}
          />
          {skillSuggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg">
              {skillSuggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => addSkill(s)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600"
                >
                  <Plus size={12} /> {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* AI Suggest */}
        <TagSuggest
          description={form.description}
          currentSkills={form.requiredSkills}
          onAdd={addSkill}
        />

        {errors.requiredSkills && (
          <p className="text-xs text-red-600">{errors.requiredSkills}</p>
        )}

        {form.requiredSkills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {form.requiredSkills.map((s) => (
              <SkillChip key={s} skill={s} onRemove={removeSkill} />
            ))}
          </div>
        )}
      </div>

      <Input
        label="GitHub Repo URL (optional)"
        placeholder="https://github.com/yourname/repo"
        value={form.githubRepoUrl}
        onChange={(e) => set('githubRepoUrl', e.target.value)}
        type="url"
      />

      {/* Status toggle (only for edit) */}
      {initialValues.status !== undefined && (
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-gray-700">Status</label>
          <button
            type="button"
            onClick={() => set('status', form.status === 'open' ? 'closed' : 'open')}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              form.status === 'open' ? 'bg-indigo-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                form.status === 'open' ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
          <span className="text-sm text-gray-600">
            {form.status === 'open' ? 'Open to requests' : 'Closed'}
          </span>
        </div>
      )}

      <Button type="submit" loading={loading} className="w-full" size="lg">
        {submitLabel}
      </Button>
    </form>
  )
}
