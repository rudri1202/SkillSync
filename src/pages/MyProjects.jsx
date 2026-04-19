import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { PlusCircle, Edit, Layers } from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { Badge, PROJECT_TYPE_LABELS } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { PageSpinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { getMyProjects, getRequestsForProject } from '../firebase/firestore'
import { useAuth } from '../context/AuthContext'

export default function MyProjects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState([])
  const [pendingCounts, setPendingCounts] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const data = await getMyProjects(user.uid)
      setProjects(data)
      setLoading(false)

      // fetch pending request counts for each project
      const counts = {}
      await Promise.all(
        data.map(async (p) => {
          const reqs = await getRequestsForProject(p.projectId)
          counts[p.projectId] = reqs.filter((r) => r.status === 'pending').length
        })
      )
      setPendingCounts(counts)
    }
    load()
  }, [user.uid])

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Projects</h1>
            <p className="text-sm text-gray-500">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
          </div>
          <Link to="/create">
            <Button className="gap-1.5">
              <PlusCircle size={16} /> Post Project
            </Button>
          </Link>
        </div>

        {loading ? (
          <PageSpinner />
        ) : projects.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No projects yet"
            description="Post your first project to start finding collaborators."
            action={
              <Link to="/create">
                <Button>Post a Project</Button>
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {projects.map((project) => {
              const pending = pendingCounts[project.projectId] || 0
              return (
                <div
                  key={project.projectId}
                  className="rounded-xl border border-gray-200 bg-white p-5 flex items-center justify-between gap-4"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge type={project.type}>
                        {PROJECT_TYPE_LABELS[project.type] || project.type}
                      </Badge>
                      <Badge type={project.status === 'open' ? 'skill' : 'default'}>
                        {project.status}
                      </Badge>
                      {pending > 0 && (
                        <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600">
                          {pending} pending
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900 truncate">{project.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-1 mt-0.5">{project.description}</p>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Link to={`/project/${project.projectId}`}>
                      <Button variant="secondary" size="sm">
                        {pending > 0 ? `View (${pending} new)` : 'View'}
                      </Button>
                    </Link>
                    <Link to={`/edit/${project.projectId}`}>
                      <Button variant="ghost" size="sm" className="gap-1">
                        <Edit size={14} />
                      </Button>
                    </Link>
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
