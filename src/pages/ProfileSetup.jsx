import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, X, Link as LinkIcon } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { updateUserProfile } from '../firebase/firestore'
import { Button } from '../components/ui/Button'
import { Input, Select } from '../components/ui/Input'
import { AvatarUpload } from '../components/profile/AvatarUpload'
import { SkillsInput } from '../components/profile/SkillsInput'
import toast from 'react-hot-toast'

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', 'Masters', 'PhD', 'Other']

const EXPERIENCE_LEVELS = [
  { value: '', label: 'Select level...' },
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'expert', label: 'Expert' },
]

const AVAILABILITY_OPTIONS = [
  { value: 'available', label: 'Open to collaborate' },
  { value: 'busy', label: 'Limited availability' },
  { value: 'unavailable', label: 'Not available right now' },
]

const LOOKING_FOR_OPTIONS = [
  { value: '', label: 'Select...' },
  { value: 'co-founder', label: 'Co-founder' },
  { value: 'contributor', label: 'Contributors for my projects' },
  { value: 'mentor', label: 'A mentor' },
  { value: 'mentee', label: 'Someone to mentor' },
  { value: 'any', label: 'Open to anything' },
]

// Project types the user can express preference for
const PROJECT_TYPE_OPTIONS = [
  { value: 'hackathon', label: 'Hackathon' },
  { value: 'research', label: 'Research' },
  { value: 'startup', label: 'Startup' },
  { value: 'opensource', label: 'Open Source' },
  { value: 'development', label: 'Development' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'design', label: 'Design' },
  { value: 'other', label: 'Other' },
]

export default function ProfileSetup() {
  const { user, profile, refreshProfile } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isEditMode = searchParams.get('edit') === '1'
  const [loading, setLoading] = useState(false)

  // Only redirect away if this is the initial setup (not an edit)
  useEffect(() => {
    if (!isEditMode && profile?.profileComplete) {
      navigate('/home', { replace: true })
    }
  }, [isEditMode, profile, navigate])

  const [form, setForm] = useState({
    name: profile?.name || user?.displayName || '',
    headline: profile?.headline || '',
    bio: profile?.bio || '',
    institution: profile?.institution || '',
    year: profile?.year || '',
    githubUsername: profile?.githubUsername || '',
    skills: profile?.skills || [],
    experienceLevel: profile?.experienceLevel || '',
    availability: profile?.availability || 'available',
    organizationName: profile?.organizationName || '',
    organizationRole: profile?.organizationRole || '',
    portfolioLinks: profile?.portfolioLinks || [],
    linkedinUrl: profile?.linkedinUrl || '',
    twitterUrl: profile?.twitterUrl || '',
    websiteUrl: profile?.websiteUrl || '',
    preferredProjectTypes: profile?.preferredProjectTypes || [],
    lookingFor: profile?.lookingFor || '',
  })

  const [linkInput, setLinkInput] = useState('')

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  function toggleProjectType(type) {
    set(
      'preferredProjectTypes',
      form.preferredProjectTypes.includes(type)
        ? form.preferredProjectTypes.filter((t) => t !== type)
        : [...form.preferredProjectTypes, type]
    )
  }

  function addPortfolioLink() {
    const url = linkInput.trim()
    if (!url) return
    if (form.portfolioLinks.length >= 5) { toast.error('Max 5 portfolio links'); return }
    if (form.portfolioLinks.includes(url)) { toast.error('Link already added'); return }
    set('portfolioLinks', [...form.portfolioLinks, url])
    setLinkInput('')
  }

  function removePortfolioLink(url) {
    set('portfolioLinks', form.portfolioLinks.filter((l) => l !== url))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.githubUsername.trim()) { toast.error('GitHub username is required'); return }
    if (form.skills.length === 0) { toast.error('Add at least one skill'); return }
    setLoading(true)
    try {
      const updates = {
        ...form,
        githubUsername: form.githubUsername.trim(),
        githubUrl: `https://github.com/${form.githubUsername.trim()}`,
        profileComplete: true,
      }
      await updateUserProfile(user.uid, updates)
      refreshProfile(updates)
      toast.success('Profile saved!')
      // In edit mode go back to the user's public profile; otherwise continue to feed
      navigate(isEditMode ? `/profile/${user.uid}` : '/home')
    } catch {
      toast.error('Failed to save profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl bg-white p-8 shadow-sm border border-gray-100">
          {isEditMode && (
            <button
              type="button"
              onClick={() => navigate(`/profile/${user.uid}`)}
              className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
            >
              ← Back to profile
            </button>
          )}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">
              {isEditMode ? 'Edit Your Profile' : 'Set Up Your Profile'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">Help collaborators find you based on your skills</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Avatar */}
            <div className="flex justify-center mb-2">
              <AvatarUpload />
            </div>

            {/* ── Identity ── */}
            <Input
              label="Full Name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Your name"
            />

            <Input
              label="Professional Headline"
              value={form.headline}
              onChange={(e) => set('headline', e.target.value)}
              placeholder="e.g. Full-stack dev · Building AI tools · Open source contributor"
              maxLength={100}
            />
            <p className="text-right text-xs text-gray-400 -mt-3">{form.headline.length}/100</p>

            <Input
              label="GitHub Username *"
              value={form.githubUsername}
              onChange={(e) => set('githubUsername', e.target.value)}
              placeholder="e.g. octocat"
              required
            />
            <p className="text-xs text-gray-400 -mt-3">Required — used to send collaborator invites</p>

            {/* ── Experience & Availability ── */}
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Experience Level"
                value={form.experienceLevel}
                onChange={(e) => set('experienceLevel', e.target.value)}
              >
                {EXPERIENCE_LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>{l.label}</option>
                ))}
              </Select>

              <Select
                label="Availability"
                value={form.availability}
                onChange={(e) => set('availability', e.target.value)}
              >
                {AVAILABILITY_OPTIONS.map((a) => (
                  <option key={a.value} value={a.value}>{a.label}</option>
                ))}
              </Select>
            </div>

            {/* ── Looking for ── */}
            <Select
              label="I'm looking for..."
              value={form.lookingFor}
              onChange={(e) => set('lookingFor', e.target.value)}
            >
              {LOOKING_FOR_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </Select>

            {/* ── Organization ── */}
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Organization / Institute"
                value={form.organizationName}
                onChange={(e) => set('organizationName', e.target.value)}
                placeholder="e.g. Google, MIT"
              />
              <Input
                label="Role / Title"
                value={form.organizationRole}
                onChange={(e) => set('organizationRole', e.target.value)}
                placeholder="e.g. SWE Intern"
              />
            </div>

            <Input
              label="University / College"
              value={form.institution}
              onChange={(e) => set('institution', e.target.value)}
              placeholder="e.g. IIT Delhi"
            />

            <Select
              label="Year of Study"
              value={form.year}
              onChange={(e) => set('year', e.target.value)}
            >
              <option value="">Select year...</option>
              {YEARS.map((y) => (<option key={y} value={y}>{y}</option>))}
            </Select>

            {/* ── Bio ── */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Bio</label>
              <textarea
                value={form.bio}
                onChange={(e) => set('bio', e.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Tell collaborators about yourself, what you're building, and what excites you..."
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <p className="text-right text-xs text-gray-400 mt-0.5">{form.bio.length}/500</p>
            </div>

            {/* ── Skills ── */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-700">Your Skills *</label>
              <p className="text-xs text-gray-400">Import from GitHub or resume, or add manually</p>
              <SkillsInput skills={form.skills} onChange={(skills) => set('skills', skills)} />
            </div>

            {/* ── Preferred Project Types ── */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Preferred Project Types
                <span className="text-gray-400 font-normal ml-1">— powers your personalised feed</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {PROJECT_TYPE_OPTIONS.map((t) => {
                  const active = form.preferredProjectTypes.includes(t.value)
                  return (
                    <button
                      key={t.value}
                      type="button"
                      onClick={() => toggleProjectType(t.value)}
                      className={`rounded-full px-3 py-1 text-sm font-medium border transition-colors ${
                        active
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-white text-gray-600 border-gray-300 hover:border-indigo-400 hover:text-indigo-600'
                      }`}
                    >
                      {t.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── Portfolio Links ── */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Portfolio / Project Links
                <span className="text-gray-400 font-normal ml-1">(up to 5)</span>
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <LinkIcon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="url"
                    placeholder="https://your-project.com"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addPortfolioLink() } }}
                    className="w-full rounded-lg border border-gray-300 py-2 pl-8 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={addPortfolioLink}
                  disabled={form.portfolioLinks.length >= 5}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              {form.portfolioLinks.length > 0 && (
                <ul className="space-y-1.5 mt-1">
                  {form.portfolioLinks.map((url) => (
                    <li key={url} className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm">
                      <LinkIcon size={12} className="text-gray-400 flex-shrink-0" />
                      <a href={url} target="_blank" rel="noreferrer" className="flex-1 truncate text-indigo-600 hover:underline">{url}</a>
                      <button type="button" onClick={() => removePortfolioLink(url)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* ── Social Links ── */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-700">Social Links</label>
              <Input
                label="LinkedIn URL"
                value={form.linkedinUrl}
                onChange={(e) => set('linkedinUrl', e.target.value)}
                placeholder="https://linkedin.com/in/yourname"
                type="url"
              />
              <Input
                label="Twitter / X URL"
                value={form.twitterUrl}
                onChange={(e) => set('twitterUrl', e.target.value)}
                placeholder="https://twitter.com/yourhandle"
                type="url"
              />
              <Input
                label="Personal Website"
                value={form.websiteUrl}
                onChange={(e) => set('websiteUrl', e.target.value)}
                placeholder="https://yoursite.com"
                type="url"
              />
            </div>

            <Button type="submit" loading={loading} className="w-full" size="lg">
              {isEditMode ? 'Save Changes' : 'Save Profile & Continue'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
