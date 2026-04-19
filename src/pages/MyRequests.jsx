import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Clock, CheckCircle, XCircle, Github, Inbox } from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { PageSpinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { getMyRequests } from '../firebase/firestore'
import { useAuth } from '../context/AuthContext'

const STATUS_CONFIG = {
  pending: { icon: Clock, color: 'text-yellow-500', bg: 'bg-yellow-50', label: 'Pending' },
  accepted: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-50', label: 'Accepted' },
  declined: { icon: XCircle, color: 'text-gray-400', bg: 'bg-gray-50', label: 'Declined' },
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
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMyRequests(user.uid).then((data) => {
      setRequests(data)
      setLoading(false)
    })
  }, [user.uid])

  const grouped = {
    pending: requests.filter((r) => r.status === 'pending'),
    accepted: requests.filter((r) => r.status === 'accepted'),
    declined: requests.filter((r) => r.status === 'declined'),
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">My Requests</h1>
          <p className="text-sm text-gray-500">{requests.length} total request{requests.length !== 1 ? 's' : ''}</p>
        </div>

        {loading ? (
          <PageSpinner />
        ) : requests.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title="No requests yet"
            description="Browse the feed and request to join a project!"
            action={
              <Link to="/home" className="text-indigo-600 hover:underline text-sm">
                Browse Projects →
              </Link>
            }
          />
        ) : (
          <div className="space-y-6">
            {['pending', 'accepted', 'declined'].map((status) => {
              const group = grouped[status]
              if (group.length === 0) return null
              const config = STATUS_CONFIG[status]
              const Icon = config.icon

              return (
                <div key={status}>
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    {config.label} ({group.length})
                  </h2>
                  <div className="space-y-3">
                    {group.map((req) => (
                      <div
                        key={req.requestId}
                        className="rounded-xl border border-gray-200 bg-white p-4 flex items-start gap-4"
                      >
                        <div className={`mt-0.5 rounded-full p-1.5 ${config.bg}`}>
                          <Icon size={16} className={config.color} />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <Link
                                to={`/project/${req.projectId}`}
                                className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors"
                              >
                                {req.projectTitle}
                              </Link>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {timeAgo(req.createdAt)}
                              </p>
                            </div>
                            <span
                              className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${config.bg} ${config.color}`}
                            >
                              {config.label}
                            </span>
                          </div>

                          {req.message && (
                            <p className="text-sm text-gray-600 mt-2 italic">
                              "{req.message}"
                            </p>
                          )}

                          {req.status === 'accepted' && (
                            <div className="mt-3 flex items-center gap-3">
                              <span className="text-sm text-green-700 font-medium">
                                You're in! Check your GitHub for the invite.
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
