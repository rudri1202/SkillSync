import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createProject } from '../firebase/firestore'
import { Navbar } from '../components/layout/Navbar'
import { ProjectForm } from '../components/project/ProjectForm'
import toast from 'react-hot-toast'

export default function CreateProject() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  if (!profile?.profileComplete) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Complete Your Profile First</h2>
          <p className="text-gray-500 mb-6">
            You need a complete profile (GitHub username + at least one skill) before posting.
          </p>
          <button
            onClick={() => navigate('/setup')}
            className="text-indigo-600 hover:underline"
          >
            Go to Profile Setup →
          </button>
        </div>
      </div>
    )
  }

  async function handleSubmit(form) {
    setLoading(true)
    try {
      const id = await createProject({
        ...form,
        ownerId: user.uid,
        ownerName: profile.name,
        ownerAvatarUrl: profile.avatarUrl || '',
        ownerAvatarColor: profile.avatarColor || '',
      })
      toast.success('Project posted!')
      navigate(`/project/${id}`)
    } catch {
      toast.error('Failed to post project')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Post a Project</h1>
          <p className="text-sm text-gray-500 mt-1">
            Describe your project and find collaborators with the right skills
          </p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6">
          <ProjectForm
            onSubmit={handleSubmit}
            loading={loading}
            submitLabel="Post Project"
          />
        </div>
      </div>
    </div>
  )
}
