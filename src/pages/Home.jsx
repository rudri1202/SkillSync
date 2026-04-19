import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, FolderOpen } from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { ProjectCard } from '../components/feed/ProjectCard'
import { FeedFilters } from '../components/feed/FeedFilters'
import { Modal } from '../components/ui/Modal'
import { Button } from '../components/ui/Button'
import { PageSpinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import {
  getFeedProjects,
  getSavedProjects,
  sendJoinRequest,
  getExistingRequest,
  recordInteraction,
} from '../firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { skillMatchScore } from '../utils/skillMatch'
import { computeFeedScore } from '../utils/feedRanking'
import toast from 'react-hot-toast'

export default function Home() {
  const { user, profile } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({ query: '', type: 'all', status: 'open', sort: 'relevant', savedOnly: false })
  const [joinTarget, setJoinTarget] = useState(null)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [existingRequests, setExistingRequests] = useState({})

  useEffect(() => {
    loadProjects()
  }, [filters.type, filters.status, filters.savedOnly])

  async function loadProjects() {
    setLoading(true)
    try {
      let data
      if (filters.savedOnly) {
        data = await getSavedProjects(user.uid)
      } else {
        data = await getFeedProjects(filters.type, filters.status)
      }
      setProjects(data)
    } catch (e) {
      toast.error('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  // client-side filter + sort
  const displayed = projects
    .filter((p) => {
      if (p.ownerId === user?.uid) return false
      const q = filters.query.toLowerCase()
      if (!q) return true
      return (
        p.title?.toLowerCase().includes(q) ||
        p.requiredSkills?.some((s) => s.toLowerCase().includes(q))
      )
    })
    .sort((a, b) => {
      if (filters.sort === 'latest') {
        const ta = a.createdAt?.toMillis?.() || 0
        const tb = b.createdAt?.toMillis?.() || 0
        return tb - ta
      }
      if (filters.sort === 'popular') {
        return (b.savedBy?.length || 0) - (a.savedBy?.length || 0)
      }
      // relevant — ML-weighted score (skills + preferences + interaction history + recency + popularity)
      return computeFeedScore(b, profile) - computeFeedScore(a, profile)
    })

  async function openJoinModal(project) {
    // check for existing request
    const existing = await getExistingRequest(project.projectId, user.uid)
    if (existing) {
      toast(`You already have a ${existing.status} request for this project`)
      return
    }
    if (!profile?.profileComplete) {
      toast.error('Complete your profile first')
      return
    }
    setJoinTarget(project)
    setMessage('')
  }

  async function submitJoin() {
    if (!joinTarget) return
    setSending(true)
    try {
      await sendJoinRequest({
        projectId: joinTarget.projectId,
        projectTitle: joinTarget.title,
        requesterId: user.uid,
        requesterName: profile.name,
        requesterAvatarUrl: profile.avatarUrl || '',
        requesterGithubUrl: profile.githubUrl || '',
        requesterSkills: profile.skills || [],
        message: message.trim(),
      })
      // Record interaction to improve future feed personalisation
      recordInteraction(user.uid, {
        projectId: joinTarget.projectId,
        type: joinTarget.type,
        skills: joinTarget.requiredSkills,
        action: 'request',
      }).catch(() => {}) // fire-and-forget
      toast.success('Request sent!')
      setJoinTarget(null)
    } catch (err) {
      if (err.message === 'already_requested') {
        toast.error('You already sent a request for this project')
      } else {
        toast.error('Failed to send request')
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Top bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {filters.savedOnly ? 'Saved Projects' : 'Project Feed'}
            </h1>
            <p className="text-sm text-gray-500">
              {displayed.length} project{displayed.length !== 1 ? 's' : ''}
              {filters.sort === 'relevant' && !filters.savedOnly ? ' — sorted by skill match' : ''}
            </p>
          </div>
          <Link to="/create">
            <Button className="gap-1.5">
              <PlusCircle size={16} /> Post a Project
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-5">
          <FeedFilters filters={filters} onChange={setFilters} />
        </div>

        {/* Grid */}
        {loading ? (
          <PageSpinner />
        ) : displayed.length === 0 ? (
          <EmptyState
            icon={FolderOpen}
            title={filters.savedOnly ? 'No saved projects' : 'No projects found'}
            description={
              filters.savedOnly
                ? 'Bookmark projects from the feed to save them here.'
                : 'Be the first to post a project!'
            }
            action={
              !filters.savedOnly && (
                <Link to="/create">
                  <Button>Post a Project</Button>
                </Link>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayed.map((project) => (
              <ProjectCard
                key={project.projectId}
                project={project}
                onRequestJoin={openJoinModal}
              />
            ))}
          </div>
        )}
      </div>

      {/* Join Modal */}
      <Modal
        open={!!joinTarget}
        onClose={() => setJoinTarget(null)}
        title={`Request to join: ${joinTarget?.title}`}
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-2">Your skills that will be shared:</p>
            <div className="flex flex-wrap gap-1.5">
              {(profile?.skills || []).slice(0, 10).map((s) => (
                <span key={s} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700">
                  {s}
                </span>
              ))}
              {(profile?.skills?.length || 0) > 10 && (
                <span className="text-xs text-gray-400 self-center">
                  +{profile.skills.length - 10} more
                </span>
              )}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Why do you want to join? <span className="text-gray-400 font-normal">(optional but recommended)</span>
            </label>
            <p className="text-xs text-gray-400 mb-1.5">
              A good note — your relevant experience, what you'll contribute, or why you're excited — greatly increases acceptance chances.
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={300}
              rows={4}
              placeholder={`e.g. "I've built two ML pipelines in PyTorch and would love to contribute to the model training part. I'm especially interested in this because..."`}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <p className="text-right text-xs text-gray-400 mt-0.5">{message.length}/300</p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setJoinTarget(null)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button onClick={submitJoin} loading={sending} className="flex-1">
              Send Request
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
