import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Clock, CheckCircle, XCircle, Inbox, Users } from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { PageSpinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { Button } from '../components/ui/Button'
import {
  getMyRequests, getIncomingRequestsForOwner, updateRequestStatus,
} from '../firebase/firestore'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  pending:  { icon: Clock,        color: 'text-yellow-500', bg: 'bg-yellow-50',  label: 'Pending' },
  accepted: { icon: CheckCircle,  color: 'text-green-500',  bg: 'bg-green-50',   label: 'Accepted' },
  declined: { icon: XCircle,      color: 'text-gray-400',   bg: 'bg-gray-50',    label: 'Declined' },
}

function timeAgo(ts) {
  if (!ts) return ''
  const date = ts.toDate ? ts.toDate() : new Date(ts)
  const diff = (Date.now() - date.getTime()) / 1000
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function MyRequests() {
  const { user } = useAuth()
  const [tab, setTab] = useState('incoming')
  const [sent, setSent] = useState([])
  const [incoming, setIncoming] = useState([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)

  useEffect(() => {
    async function load() {
      try {
        const [myReqs, incomingReqs] = await Promise.all([
          getMyRequests(user.uid),
          getIncomingRequestsForOwner(user.uid),
        ])
        setSent(myReqs)
        setIncoming(incomingReqs)
      } catch (err) {
        console.error('Failed to load requests:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user.uid])

  async function handleDecision(requestId, status) {
    setUpdating(requestId)
    try {
      await updateRequestStatus(requestId, status)
      setIncoming((prev) =>
        prev.map((r) => r.requestId === requestId ? { ...r, status } : r)
      )
      toast.success(status === 'accepted' ? 'Request accepted!' : 'Request declined')
    } catch {
      toast.error('Failed to update request')
    } finally {
      setUpdating(null)
    }
  }

  const pendingIncoming = incoming.filter((r) => r.status === 'pending')

  const tabs = [
    { id: 'incoming', label: 'Incoming', count: pendingIncoming.length },
    { id: 'sent',     label: 'Sent',     count: sent.filter((r) => r.status === 'pending').length },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Requests</h1>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 rounded-lg bg-gray-100 p-1 mb-6">
          {tabs.map(({ id, label, count }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-md py-2 text-sm font-medium transition-colors ${
                tab === id ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
              {count > 0 && (
                <span className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                  tab === id ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-600'
                }`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <PageSpinner />
        ) : tab === 'incoming' ? (
          <IncomingTab
            requests={incoming}
            updating={updating}
            onDecide={handleDecision}
          />
        ) : (
          <SentTab requests={sent} />
        )}
      </div>
    </div>
  )
}

function IncomingTab({ requests, updating, onDecide }) {
  if (requests.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No incoming requests"
        description="When someone requests to join your project, it'll appear here."
      />
    )
  }

  const pending  = requests.filter((r) => r.status === 'pending')
  const reviewed = requests.filter((r) => r.status !== 'pending')

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Pending ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map((req) => (
              <RequestCard key={req.requestId} req={req} updating={updating} onDecide={onDecide} incoming />
            ))}
          </div>
        </section>
      )}
      {reviewed.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Reviewed ({reviewed.length})
          </h2>
          <div className="space-y-3">
            {reviewed.map((req) => (
              <RequestCard key={req.requestId} req={req} updating={updating} onDecide={onDecide} incoming />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function SentTab({ requests }) {
  if (requests.length === 0) {
    return (
      <EmptyState
        icon={Inbox}
        title="No requests sent"
        description="Browse the feed and request to join a project!"
        action={
          <Link to="/home" className="text-indigo-600 hover:underline text-sm">
            Browse Projects →
          </Link>
        }
      />
    )
  }

  const grouped = {
    pending:  requests.filter((r) => r.status === 'pending'),
    accepted: requests.filter((r) => r.status === 'accepted'),
    declined: requests.filter((r) => r.status === 'declined'),
  }

  return (
    <div className="space-y-6">
      {['pending', 'accepted', 'declined'].map((status) => {
        const group = grouped[status]
        if (group.length === 0) return null
        return (
          <section key={status}>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              {STATUS_CONFIG[status].label} ({group.length})
            </h2>
            <div className="space-y-3">
              {group.map((req) => (
                <RequestCard key={req.requestId} req={req} />
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}

function RequestCard({ req, incoming = false, updating, onDecide }) {
  const config = STATUS_CONFIG[req.status] || STATUS_CONFIG.pending
  const Icon = config.icon

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-start gap-4">
        <div className={`mt-0.5 rounded-full p-1.5 flex-shrink-0 ${config.bg}`}>
          <Icon size={16} className={config.color} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div>
              <Link
                to={`/project/${req.projectId}`}
                className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
              >
                {req.projectTitle}
              </Link>
              {incoming && req.requesterName && (
                <p className="text-sm text-gray-500 mt-0.5">
                  from{' '}
                  <Link to={`/profile/${req.requesterId}`} className="text-indigo-600 hover:underline">
                    {req.requesterName}
                  </Link>
                </p>
              )}
              <p className="text-xs text-gray-400 mt-0.5">{timeAgo(req.createdAt)}</p>
            </div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${config.bg} ${config.color}`}>
              {config.label}
            </span>
          </div>

          {req.message && (
            <p className="text-sm text-gray-600 mt-2 italic">"{req.message}"</p>
          )}

          {req.requesterSkills?.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {req.requesterSkills.map((s) => (
                <span key={s} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>
              ))}
            </div>
          )}

          {incoming && req.status === 'pending' && (
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={() => onDecide(req.requestId, 'accepted')}
                loading={updating === req.requestId}
              >
                Accept
              </Button>
              <button
                onClick={() => onDecide(req.requestId, 'declined')}
                disabled={updating === req.requestId}
                className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              >
                Decline
              </button>
            </div>
          )}

          {req.status === 'accepted' && !incoming && (
            <p className="text-sm text-green-700 font-medium mt-2">
              You're in! Check your GitHub for the invite.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
