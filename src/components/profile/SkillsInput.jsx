import { useState, useRef } from 'react'
import { Github, FileText, Pencil, Plus, Loader } from 'lucide-react'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { SkillChip } from '../ui/Badge'
import { Button } from '../ui/Button'
import { searchTaxonomy, normalizeGithubLanguage, filterToTaxonomy } from '../../utils/taxonomy'
import { extractSkillsFromResume } from '../../utils/gemini'
import toast from 'react-hot-toast'

export function SkillsInput({ skills, onChange }) {
  const [tab, setTab] = useState('manual')
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [githubUsername, setGithubUsername] = useState('')
  const [loadingGithub, setLoadingGithub] = useState(false)
  const [loadingResume, setLoadingResume] = useState(false)
  const fileInputRef = useRef()

  function handleQueryChange(e) {
    const val = e.target.value
    setQuery(val)
    setSuggestions(
      val ? searchTaxonomy(val).filter((s) => !skills.includes(s)).slice(0, 8) : []
    )
  }

  function addSkill(skill) {
    if (!skills.includes(skill)) {
      onChange([...skills, skill])
    }
    setQuery('')
    setSuggestions([])
  }

  function removeSkill(skill) {
    onChange(skills.filter((s) => s !== skill))
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && query.trim()) {
      e.preventDefault()
      const match = searchTaxonomy(query.trim())[0]
      if (match) addSkill(match)
    }
  }

  async function importFromGithub() {
    const username = githubUsername.trim()
    if (!username) { toast.error('Enter a GitHub username'); return }
    setLoadingGithub(true)
    try {
      // Call GitHub API directly from the browser (public repos, no token needed)
      const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'SkillSync-App' }
      const reposRes = await fetch(
        `https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=30&type=public`,
        { headers }
      )
      if (!reposRes.ok) {
        if (reposRes.status === 404) throw new Error('GitHub user not found')
        if (reposRes.status === 403) throw new Error('GitHub rate limit hit')
        throw new Error('GitHub API error')
      }
      const repos = await reposRes.json()

      // Collect languages from primary field + top-5 repo language breakdowns
      const langCounts = {}
      repos.forEach((r) => {
        if (r.language) langCounts[r.language] = (langCounts[r.language] || 0) + 1
      })
      await Promise.all(
        repos.slice(0, 5).map(async (r) => {
          try {
            const lr = await fetch(
              `https://api.github.com/repos/${encodeURIComponent(username)}/${encodeURIComponent(r.name)}/languages`,
              { headers }
            )
            if (lr.ok) {
              const langs = await lr.json()
              Object.keys(langs).forEach((l) => {
                langCounts[l] = (langCounts[l] || 0) + Math.round(langs[l] / 1000)
              })
            }
          } catch { /* ignore individual repo errors */ }
        })
      )

      const topLangs = Object.entries(langCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 15)
        .map(([l]) => l)

      const mapped = topLangs.map(normalizeGithubLanguage)
      const valid = filterToTaxonomy(mapped)
      onChange([...new Set([...skills, ...valid])])
      toast.success(`Added ${valid.length} skills from GitHub`)
    } catch (err) {
      toast.error(err.message || 'GitHub temporarily unavailable — add skills manually')
    } finally {
      setLoadingGithub(false)
    }
  }

  async function extractFromResume(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      toast.error('Please upload a PDF file')
      return
    }
    setLoadingResume(true)
    try {
      const pdfjsLib = await import('pdfjs-dist')
      pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

      const buffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
      let text = ''
      for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        text += content.items.map((item) => item.str).join(' ') + '\n'
      }

      const extracted = await extractSkillsFromResume(text)
      const newSkills = [...new Set([...skills, ...extracted])]
      onChange(newSkills)
      toast.success(`Added ${extracted.length} skills from resume`)
    } catch (err) {
      console.error('Resume extraction error:', err)
      toast.error('Resume AI unavailable — please add skills manually')
    } finally {
      setLoadingResume(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const tabs = [
    { id: 'manual', label: 'Manual', icon: Pencil },
    { id: 'github', label: 'GitHub', icon: Github },
    { id: 'resume', label: 'Resume (AI)', icon: FileText },
  ]

  return (
    <div className="space-y-3">
      {/* Tab switcher */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium transition-colors ${
              tab === id
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon size={12} />
            {label}
          </button>
        ))}
      </div>

      {/* Manual tab */}
      {tab === 'manual' && (
        <div className="space-y-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Type a skill (e.g. React, Python)..."
              value={query}
              onChange={handleQueryChange}
              onKeyDown={handleKeyDown}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-10 mt-1 rounded-lg border border-gray-200 bg-white shadow-lg">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addSkill(s)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 first:rounded-t-lg last:rounded-b-lg"
                  >
                    <Plus size={12} /> {s}
                  </button>
                ))}
              </div>
            )}
          </div>
          <p className="text-xs text-gray-400">Press Enter to add the top match</p>
        </div>
      )}

      {/* GitHub tab */}
      {tab === 'github' && (
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="GitHub username"
              value={githubUsername}
              onChange={(e) => setGithubUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && importFromGithub()}
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <Button onClick={importFromGithub} loading={loadingGithub} size="sm">
              Import
            </Button>
          </div>
          <p className="text-xs text-gray-400">
            Fetches your public repos and maps languages to skill tags.
          </p>
        </div>
      )}

      {/* Resume tab */}
      {tab === 'resume' && (
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-500 transition-colors">
            {loadingResume ? (
              <>
                <Loader size={16} className="animate-spin" />
                Extracting skills...
              </>
            ) : (
              <>
                <FileText size={16} />
                Click to upload PDF resume
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={extractFromResume}
              disabled={loadingResume}
            />
          </label>
          <p className="text-xs text-gray-400">
            AI extracts skill tags from your resume text. Max 5 pages used.
          </p>
        </div>
      )}

      {/* Skill chips */}
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {skills.map((s) => (
            <SkillChip key={s} skill={s} onRemove={removeSkill} />
          ))}
        </div>
      )}
    </div>
  )
}
