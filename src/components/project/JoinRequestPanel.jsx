import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Check, X, Github, ExternalLink } from 'lucide-react'
import { SkillChip } from '../ui/Badge'
import { Button } from '../ui/Button'
import {
  getRequestsForProject,
  updateRequestStatus,
} from '../../firebase/firestore'
import { computeSkillMatch } from '../../utils/skillMatch'
import toast from 'react-hot-toast'

export function JoinRequestPanel({ project }) {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState({})

  async function load() {
    setLoading(true)
    const data = await getRequestsForProject(project.projectId)
    setRequests(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [project.projectId])

  async function accept(request) {
    setProcessing((p) => ({ ...p, [request.requestId]: 'accepting' }))
    try {
      await updateRequestStatus(request.requestId, 'accepted')

      // Attempt GitHub invite if repo is set
      if (project.githubRepoUrl && request.requesterGithubUrl) {
        const match = project.githubRepoUrl.match(/github\.com\/([^/]+)\/([^/]+)/)
        const username = request.requesterGithubUrl.split('github.com/').pop()?.replace(/\/$/, '')
        if (match && username) {
          try {
            const res = await fetch('/api/github-invite', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                owner: match[1],
                repo: match[2].replace(/\.git$/, ''),
                username,
              }),
            })
            if (res.ok) {
              toast.success(`Accepted & invited @${username} on GitHub`)
            } else {
              toast.success('Accepted! GitHub invite failed — invite manually.')
            }
          } catch {
            toast.success('Accepted! GitHub invite failed — invite manually.')
          }
        }
      } else {
        toast.success('Request accepted!')
      }

      setRequests((prev) =>
        prev.map((r) =>
          r.requestId === request.requestId ? { ...r, status: 'accepted' } : r
        )
      )
    } catch {
      toast.error('Failed to accept')
    } finally {
      setProcessing((p) => ({ ...p, [request.requestId]: null }))
    }
  }

  async function decline(request) {
    setProcessing((p) => ({ ...p, [request.requestId]: 'declining' }))
    try {
      await updateRequestStatus(request.requestId, 'declined')
      setRequests((prev) =>
        prev.map((r) =>
          r.requestId === request.requestId ? { ...r, status: 'declined' } : r
        )
      )
      toast.success('Request declined')
    } catch {
      toast.error('Failed to decline')
    } finally {
      setProcessing((p) => ({ ...p, [request.requestId]: null }))
    }
  }

  const pending = requests.filter((r) => r.status === 'pending')
  const reviewed = requests.filter((r) => r.status !== 'pending')

  if (loading)
    return <p className="text-sm text-gray-400 py-4">Loading requests...</p>

  if (requests.length === 0)
    return (
      <p className="text-sm text-gray-400 py-4 text-center">
        No join requests yet.
      </p>
    )

  return (
    <div className="space-y-4">
      {pending.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-2">
            Pending ({pending.length})
          </h4>
          <div className="space-y-3">
            {pending.map((req) => (
              <RequestCard
                key={req.requestId}
                request={req}
                project={project}
                onAccept={() => accept(req)}
                onDecline={() => decline(req)}
                accepting={processing[req.requestId] === 'accepting'}
                declining={processing[req.requestId] === 'declining'}
              />
            ))}
          </div>
        </div>
      )}

      {reviewed.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-gray-500 mb-2">
            Reviewed ({reviewed.length})
          </h4>
          <div className="space-y-2">
            {reviewed.map((req) => (
              <div
                key={req.requestId}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <img
                    src={req.requesterAvatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${req.requesterName}`}
                    alt={req.requesterName}
                    className="h-6 w-6 rounded-full"
                  />
                  <span className="text-sm text-gray-700">{req.requesterName}</span>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    req.status === 'accepted'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function RequestCard({ request, project, onAccept, onDecline, accepting, declining }) {
  const { matchedSkills } = computeSkillMatch(
    request.requesterSkills || [],
    project.requiredSkills || []
  )

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img
            src={request.requesterAvatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${request.requesterName}`}
            alt={request.requesterName}
            className="h-9 w-9 rounded-full"
          />
          <div>
            <p className="text-sm font-semibold text-gray-900">{request.requesterName}</p>
            {request.requesterGithubUrl && (
              <a
                href={request.requesterGithubUrl}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-0.5 text-xs text-gray-400 hover:text-indigo-500"
              >
                <Github size={10} /> GitHub
              </a>
            )}
          </div>
        </div>
        <Link
          to={`/profile/${request.requesterId}`}
          className="flex items-center gap-1 text-xs text-indigo-600 hover:underline"
        >
          Full Profile <ExternalLink size={10} />
        </Link>
      </div>

      {/* Skills */}
      {request.requesterSkills?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {request.requesterSkills.map((s) => (
            <SkillChip key={s} skill={s} matched={matchedSkills.includes(s)} />
          ))}
        </div>
      )}

      {/* Message */}
      {request.message && (
        <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 italic">
          "{request.message}"
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="success"
          size="sm"
          onClick={onAccept}
          loading={accepting}
          className="flex-1 gap-1"
        >
          <Check size={14} /> Accept
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onDecline}
          loading={declining}
          className="flex-1 gap-1"
        >
          <X size={14} /> Decline
        </Button>
      </div>
    </div>
  )
}
