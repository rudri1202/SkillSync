import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bookmark, BookmarkCheck, Clock, Users, ExternalLink } from 'lucide-react'
import { Badge, SkillChip, PROJECT_TYPE_LABELS } from '../ui/Badge'
import { SkillMatchBadge } from './SkillMatchBadge'
import { Button } from '../ui/Button'
import { toggleSaveProject, recordInteraction } from '../../firebase/firestore'
import { useAuth } from '../../context/AuthContext'
import { computeSkillMatch } from '../../utils/skillMatch'
import { UserAvatar } from '../ui/UserAvatar'
import toast from 'react-hot-toast'

function timeAgo(ts) {
  if (!ts) return ''
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  const diff = (Date.now() - date.getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export function ProjectCard({ project, requestStatus, onRequestJoin }) {
  const { user, profile } = useAuth()
  const isSaved = project.savedBy?.includes(user?.uid)
  const [saving, setSaving] = useState(false)
  const [localSaved, setLocalSaved] = useState(isSaved)

  const { matched, total, matchedSkills } = computeSkillMatch(
    profile?.skills || [],
    project.requiredSkills || []
  )
  const isOwner = user?.uid === project.ownerId

  async function handleSave(e) {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    try {
      await toggleSaveProject(project.projectId, user.uid, localSaved)
      const nowSaved = !localSaved
      setLocalSaved(nowSaved)
      // Record save interaction to improve feed personalisation (fire-and-forget)
      if (nowSaved) {
        recordInteraction(user.uid, {
          projectId: project.projectId,
          type: project.type,
          skills: project.requiredSkills,
          action: 'save',
        }).catch(() => {})
      }
    } catch {
      toast.error('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const shownSkills = project.requiredSkills?.slice(0, 5) || []
  const extra = (project.requiredSkills?.length || 0) - 5

  return (
    <div className="group rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <UserAvatar
            name={project.ownerName}
            avatarUrl={project.ownerAvatarUrl}
            avatarColor={project.ownerAvatarColor}
            size="sm"
            className="flex-shrink-0 !h-8 !w-8"
          />
          <div className="min-w-0">
            <p className="text-xs text-gray-500 truncate">{project.ownerName}</p>
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={10} />
              {timeAgo(project.createdAt)}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Badge type={project.type}>
            {PROJECT_TYPE_LABELS[project.type] || project.type}
          </Badge>
          {project.status === 'closed' && (
            <Badge type="default">Closed</Badge>
          )}
        </div>
      </div>

      {/* Title */}
      <h3 className="font-semibold text-gray-900 leading-tight mb-1 line-clamp-2">
        {project.title}
      </h3>

      {/* Description */}
      <p className="text-sm text-gray-500 line-clamp-2 mb-3">
        {project.description}
      </p>

      {/* Cover image */}
      {project.imageUrl && (
        <img
          src={project.imageUrl}
          alt="cover"
          className="w-full h-28 object-cover rounded-lg mb-3"
        />
      )}

      {/* Skills */}
      <div className="flex flex-wrap gap-1 mb-3">
        {shownSkills.map((s) => (
          <SkillChip key={s} skill={s} matched={matchedSkills.includes(s)} />
        ))}
        {extra > 0 && (
          <span className="text-xs text-gray-400 self-center">+{extra} more</span>
        )}
      </div>

      {/* Match + team */}
      <div className="flex items-center gap-2 mb-3">
        <SkillMatchBadge matched={matched} total={total} />
        {project.teamSize && (
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Users size={12} /> Team of {project.teamSize}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Link
          to={`/project/${project.projectId}`}
          className="flex-1 text-center rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          View Details
        </Link>

        {!isOwner && project.status === 'open' && (
          requestStatus ? (
            <span className={`flex-1 text-center rounded-lg px-3 py-1.5 text-sm font-medium ${
              requestStatus === 'pending' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
              requestStatus === 'accepted' ? 'bg-green-50 text-green-700 border border-green-200' :
              'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {requestStatus === 'pending' ? 'Pending' : requestStatus === 'accepted' ? 'Accepted' : 'Declined'}
            </span>
          ) : (
            <Button
              size="sm"
              onClick={() => onRequestJoin?.(project)}
              className="flex-1"
            >
              Request to Join
            </Button>
          )
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:text-indigo-500 hover:border-indigo-300 transition-colors"
          title={localSaved ? 'Unsave' : 'Save'}
        >
          {localSaved ? (
            <BookmarkCheck size={16} className="text-indigo-500" />
          ) : (
            <Bookmark size={16} />
          )}
        </button>
      </div>
    </div>
  )
}
