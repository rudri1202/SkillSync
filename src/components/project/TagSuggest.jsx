import { useState } from 'react'
import { Sparkles, Plus } from 'lucide-react'
import { Button } from '../ui/Button'
import { filterToTaxonomy } from '../../utils/taxonomy'
import { suggestTagsForDescription } from '../../utils/gemini'
import toast from 'react-hot-toast'

export function TagSuggest({ description, currentSkills, onAdd }) {
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)

  async function suggest() {
    if (!description || description.trim().length < 20) {
      toast.error('Write a longer description first')
      return
    }
    setLoading(true)
    setSuggestions([])
    try {
      const skills = await suggestTagsForDescription(description)
      const valid = filterToTaxonomy(skills).filter((s) => !currentSkills.includes(s))
      setSuggestions(valid.slice(0, 8))
      if (valid.length === 0) toast('No new suggestions found')
    } catch (err) {
      console.error('Tag suggest error:', err)
      toast.error('AI unavailable — add tags manually')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={suggest}
        loading={loading}
        className="gap-1.5"
      >
        <Sparkles size={14} /> Suggest Tags with AI
      </Button>

      {suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                onAdd(s)
                setSuggestions((prev) => prev.filter((x) => x !== s))
              }}
              className="flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-100 transition-colors border border-indigo-200"
            >
              <Plus size={10} /> {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
