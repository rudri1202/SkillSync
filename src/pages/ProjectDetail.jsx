import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Github,
  Users,
  Calendar,
  ExternalLink,
  Edit,
  Trash2,
} from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { Badge, SkillChip, PROJECT_TYPE_LABELS } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { PageSpinner } from '../components/ui/Spinner'
import { SkillMatchBadge } from '../components/feed/SkillMatchBadge'
import { JoinRequestPanel } from '../components/project/JoinRequestPanel'
import {
  getProject,
  getUserProfile,
  sendJoinRequest,
  getExistingRequest,
  deleteProject,
  recordInteraction,
} from '../firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { computeSkillMatch } from '../utils/skillMatch'
import toast from 'react-hot-toast'

function timeAgo(ts) {
  if (!ts) return ''
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function ProjectDetail() {
  const { id } = useParams()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [owner, setOwner] = useState(null)
  const [loading, setLoading] = useState(true)
  const [joinModal, setJoinModal] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [existingRequest, setExistingRequest] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    load()
  }, [id])

  async function load() {
    setLoading(true)
    try {
      const [p, req] = await Promise.all([
        getProject(id),
        user ? getExistingRequest(id, user.uid) : null,
      ])
      if (!p) {
        navigate('/home')
        return
      }
      setProject(p)
      setExistingRequest(req)
      const o = await getUserProfile(p.ownerId)
      setOwner(o)
    } finally {
      setLoading(false)
    }
  }

  async function submitJoin() {
    setSending(true)
    try {
      await sendJoinRequest({
        projectId: project.projectId,
        projectTitle: project.title,
        requesterId: user.uid,
        requesterName: profile.name,
        requesterAvatarUrl: profile.avatarUrl || '',
        requesterGithubUrl: profile.githubUrl || '',
        requesterSkills: profile.skills || [],
        message: message.trim(),
      })
      // Record interaction to improve future feed personalisation
      recordInteraction(user.uid, {
        projectId: project.projectId,
        type: project.type,
        skills: project.requiredSkills,
        action: 'request',
      }).catch(() => {})
      toast.success('Request sent!')
      setJoinModal(false)
      setExistingRequest({ status: 'pending' })
    } catch (err) {
      if (err.message === 'already_requested') {
        toast.error('Already sent a request')
      } else {
        toast.error('Failed to send request')
      }
    } finally {
      setSending(false)
    }
  }

  async function handleDelete() {
    setDeleting(true)
    try {
      await deleteProject(id)
      toast.success('Project deleted')
      navigate('/my-projects')
    } catch {
      toast.error('Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <><Navbar /><PageSpinner /></>
  if (!project) return null

  const isOwner = user?.uid === project.ownerId
  const { matched, total } = computeSkillMatch(profile?.skills || [], project.requiredSkills || [])

  const joinDisabled =
    !user ||
    isOwner ||
    project.status === 'closed' ||
    (existingRequest && ['pending', 'accepted'].includes(existingRequest.status))

  function joinButtonLabel() {
    if (isOwner) return 'Your Project'
    if (existingRequest?.status === 'pending') return 'Request Sent'
    if (existingRequest?.status === 'accepted') return 'Accepted!'
    if (existingRequest?.status === 'declined') return 'Request Declined'
    if (project.status === 'closed') return 'Closed'
    return 'Request to Join'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Back */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
        >
          <ArrowLeft size={16} /> Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-5">
            <div className="rounded-2xl border border-gray-200 bg-white p-6">
              {/* Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge type={project.type}>
                      {PROJECT_TYPE_LABELS[project.type] || project.type}
                    </Badge>
                    {project.status === 'closed' && <Badge type="default">Closed</Badge>}
                  </div>
                  <h1 className="text-2xl font-bold text-gray-900">{project.title}</h1>
                </div>
                {isOwner && (
                  <div className="flex gap-2 flex-shrink-0">
                    <Link to={`/edit/${project.projectId}`}>
                      <Button variant="secondary" size="sm" className="gap-1">
                        <Edit size={14} /> Edit
                      </Button>
                    </Link>
                    <Button
                      variant="danger"
                      size="sm"
                      className="gap-1"
                      onClick={() => setConfirmDelete(true)}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                )}
              </div>

              {/* Cover image */}
              {project.imageUrl && (
                <img
                  src={project.imageUrl}
                  alt="cover"
                  className="w-full h-48 object-cover rounded-xl mb-4"
                />
              )}

              {/* Description */}
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {project.description}
              </p>

              {/* Skills */}
              <div className="mt-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Required Skills</h3>
                <div className="flex flex-wrap gap-1.5">
                  {project.requiredSkills?.map((s) => (
                    <SkillChip
                      key={s}
                      skill={s}
                      matched={(profile?.skills || []).map((x) => x.toLowerCase()).includes(s.toLowerCase())}
                    />
                  ))}
                </div>
              </div>

              {/* Meta */}
              <div className="mt-5 flex flex-wrap gap-4 text-sm text-gray-500 border-t border-gray-100 pt-4">
                {project.teamSize && (
                  <span className="flex items-center gap-1.5">
                    <Users size={14} /> Team of {project.teamSize}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <Calendar size={14} /> Posted {timeAgo(project.createdAt)}
                </span>
                {project.githubRepoUrl && (
                  <a
                    href={project.githubRepoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-indigo-600 hover:underline"
                  >
                    <Github size={14} /> GitHub Repo <ExternalLink size={12} />
                  </a>
                )}
              </div>
            </div>

            {/* Join requests (owner only) */}
            {isOwner && (
              <div className="rounded-2xl border border-gray-200 bg-white p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Join Requests</h2>
                <JoinRequestPanel project={project} />
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Owner card */}
            <div className="rounded-2xl border border-gray-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-3">Posted by</h3>
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={owner?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${project.ownerName}`}
                  alt={project.ownerName}
                  className="h-10 w-10 rounded-full"
                />
                <div>
                  <p className="font-medium text-gray-900">{project.ownerName}</p>
                  {owner?.institution && (
                    <p className="text-xs text-gray-500">{owner.institution}</p>
                  )}
                </div>
              </div>
              {owner?.bio && <p className="text-sm text-gray-600 mb-3">{owner.bio}</p>}
              <Link
                to={`/profile/${project.ownerId}`}
                className="text-sm text-indigo-600 hover:underline flex items-center gap-1"
              >
                View profile <ExternalLink size={12} />
              </Link>
            </div>

            {/* Skill match */}
            {!isOwner && (
              <div className="rounded-2xl border border-gray-200 bg-white p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Your Match</h3>
                <SkillMatchBadge matched={matched} total={total} />
                {matched === 0 && total > 0 && (
                  <p className="text-xs text-gray-400 mt-2">
                    You don't match any required skills — you can still request to join!
                  </p>
                )}
              </div>
            )}

            {/* CTA */}
            {!isOwner && (
              <Button
                className="w-full"
                size="lg"
                disabled={joinDisabled}
                onClick={() => !joinDisabled && setJoinModal(true)}
                variant={existingRequest?.status === 'accepted' ? 'success' : 'primary'}
              >
                {joinButtonLabel()}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Join modal */}
      <Modal open={joinModal} onClose={() => setJoinModal(false)} title={`Join: ${project.title}`}>
        <div className="space-y-4">
          {/* Skills preview */}
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-xs font-medium text-gray-500 mb-1.5">Skills you'll share with the owner</p>
            <div className="flex flex-wrap gap-1.5">
              {(profile?.skills || []).slice(0, 12).map((s) => (
                <span key={s} className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs text-indigo-700 border border-indigo-100">
                  {s}
                </span>
              ))}
              {(profile?.skills?.length || 0) > 12 && (
                <span className="text-xs text-gray-400 self-center">+{profile.skills.length - 12} more</span>
              )}
            </div>
          </div>

          {/* Pitch note */}
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">
              Why do you want to join?
              <span className="text-gray-400 font-normal ml-1">(optional but recommended)</span>
            </label>
            <p className="text-xs text-gray-400 mb-1.5">
              Mention your relevant experience and what you'd contribute. Owners are far more likely to accept a personalised note.
            </p>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={300}
              rows={4}
              placeholder={`e.g. "I've worked on 3 React projects and can take on the frontend. Excited about this because..."`}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <p className="text-right text-xs text-gray-400">{message.length}/300</p>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setJoinModal(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={submitJoin} loading={sending} className="flex-1">
              Send Request
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirm delete modal */}
      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete Project"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to delete <strong>{project.title}</strong>? This will also
            remove all join requests. This cannot be undone.
          </p>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setConfirmDelete(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              loading={deleting}
              className="flex-1"
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
