import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getProject, updateProject } from '../firebase/firestore'
import { Navbar } from '../components/layout/Navbar'
import { ProjectForm } from '../components/project/ProjectForm'
import { PageSpinner } from '../components/ui/Spinner'
import toast from 'react-hot-toast'

export default function EditProject() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getProject(id).then((p) => {
      if (!p || p.ownerId !== user?.uid) {
        navigate('/my-projects')
        return
      }
      setProject(p)
      setLoading(false)
    })
  }, [id])

  async function handleSubmit(form) {
    setSaving(true)
    try {
      await updateProject(id, form)
      toast.success('Project updated!')
      navigate(`/project/${id}`)
    } catch {
      toast.error('Failed to update')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <><Navbar /><PageSpinner /></>

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Edit Project</h1>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <ProjectForm
            initialValues={project}
            onSubmit={handleSubmit}
            loading={saving}
            submitLabel="Save Changes"
          />
        </div>
      </div>
    </div>
  )
}
