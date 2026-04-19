import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Layers,
  LayoutDashboard,
  PlusCircle,
  Inbox,
  User,
  LogOut,
  Menu,
  X,
  Bell,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { signOut } from '../../firebase/auth'
import { UserAvatar } from '../ui/UserAvatar'
import { getMyProjects, subscribeToMyRequestsBadge } from '../../firebase/firestore'
import toast from 'react-hot-toast'

export function Navbar() {
  const { user, profile } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  useEffect(() => {
    if (!user) return
    let unsub = () => {}
    getMyProjects(user.uid).then((projects) => {
      const ids = projects.map((p) => p.projectId)
      unsub = subscribeToMyRequestsBadge(ids, setPendingCount)
    })
    return () => unsub()
  }, [user])

  async function handleSignOut() {
    await signOut()
    navigate('/')
    toast.success('Signed out')
  }

  const navLinks = [
    { to: '/home', label: 'Feed', icon: LayoutDashboard },
    { to: '/create', label: 'Post Project', icon: PlusCircle },
    { to: '/my-projects', label: 'My Projects', icon: Layers },
    { to: '/my-requests', label: 'My Requests', icon: Inbox },
  ]

  function isActive(path) {
    return location.pathname === path
  }

  if (!user) return null

  return (
    <nav className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Logo */}
          <Link to="/home" className="flex items-center gap-2 font-bold text-indigo-600 text-lg">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white text-xs font-bold">
              SS
            </div>
            SkillSync
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors relative ${
                  isActive(to)
                    ? 'bg-indigo-50 text-indigo-600'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon size={16} />
                {label}
                {to === '/my-projects' && pendingCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-[10px] text-white flex items-center justify-center font-bold">
                    {pendingCount > 9 ? '9+' : pendingCount}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Right: avatar + menu */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <UserAvatar
                  name={profile?.name}
                  avatarUrl={profile?.avatarUrl}
                  avatarColor={profile?.avatarColor}
                  size="sm"
                />
                <span className="hidden sm:block max-w-[120px] truncate">
                  {profile?.name?.split(' ')[0] || 'Me'}
                </span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-1 w-48 rounded-xl border border-gray-100 bg-white shadow-lg py-1 z-50">
                  <Link
                    to={`/profile/${user.uid}`}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                    onClick={() => setMenuOpen(false)}
                  >
                    <User size={14} /> View Profile
                  </Link>
                  <hr className="my-1 border-gray-100" />
                  <button
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={14} /> Sign Out
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 pb-4 pt-2">
          {navLinks.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium mb-1 relative ${
                isActive(to)
                  ? 'bg-indigo-50 text-indigo-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon size={16} />
              {label}
              {to === '/my-projects' && pendingCount > 0 && (
                <span className="ml-auto h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center font-bold">
                  {pendingCount}
                </span>
              )}
            </Link>
          ))}
        </div>
      )}
    </nav>
  )
}
