import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Github, ArrowLeft, Linkedin, Twitter, Globe, Link as LinkIcon,
  Building2, Briefcase, Star as StarIcon, CheckCircle2, Clock, XCircle,
  Zap, Users, BookOpen,
} from 'lucide-react'
import { Navbar } from '../components/layout/Navbar'
import { SkillChip, Badge, PROJECT_TYPE_LABELS } from '../components/ui/Badge'
import { PageSpinner } from '../components/ui/Spinner'
import { StarRating } from '../components/profile/StarRating'
import {
  getUserProfile, getMyProjects, getMyRatingForUser, rateUser, getRatingsForUser,
} from '../firebase/firestore'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'

// ── Config maps ────────────────────────────────────────────────────────────

const EXPERIENCE_META = {
  beginner:     { label: 'Beginner',     color: 'bg-green-100 text-green-700' },
  intermediate: { label: 'Intermediate', color: 'bg-blue-100 text-blue-700' },
  expert:       { label: 'Expert',       color: 'bg-purple-100 text-purple-700' },
}

const AVAILABILITY_META = {
  available:   { label: 'Open to collaborate', icon: CheckCircle2, color: 'text-green-600 bg-green-50 border-green-200' },
  busy:        { label: 'Limited availability', icon: Clock,        color: 'text-yellow-600 bg-yellow-50 border-yellow-200' },
  unavailable: { label: 'Not available',        icon: XCircle,      color: 'text-gray-500 bg-gray-50 border-gray-200' },
}

const LOOKING_FOR_META = {
  'co-founder':  { label: 'Looking for a co-founder',  icon: Users },
  contributor:   { label: 'Looking for contributors',   icon: Users },
  mentor:        { label: 'Looking for a mentor',       icon: BookOpen },
  mentee:        { label: 'Open to mentoring',          icon: BookOpen },
  any:           { label: 'Open to anything',           icon: Zap },
}

export default function PublicProfile() {
  const { uid } = useParams()
  const { user } = useAuth()
  const [profile, setProfile] = useState(null)
  const [projects, setProjects] = useState([])
  const [ratings, setRatings] = useState([])
  const [loading, setLoading] = useState(true)

  // Rating state
  const [myRating, setMyRating] = useState(null)
  const [selectedRating, setSelectedRating] = useState(0)
  const [review, setReview] = useState('')
  const [showRatingForm, setShowRatingForm] = useState(false)
  const [submittingRating, setSubmittingRating] = useState(false)

  const isMe = user?.uid === uid

  useEffect(() => {
    async function load() {
      try {
        const [p, proj, allRatings] = await Promise.all([
          getUserProfile(uid),
          getMyProjects(uid),
          getRatingsForUser(uid),
        ])
        setProfile(p)
        setProjects(proj.filter((x) => x.status === 'open'))
        setRatings(allRatings)

        if (user && user.uid !== uid) {
          const existing = await getMyRatingForUser(user.uid, uid)
          if (existing) {
            setMyRating(existing)
            setSelectedRating(existing.rating)
            setReview(existing.review || '')
          }
        }
      } catch (err) {
        console.error('Failed to load profile:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [uid, user])

  async function submitRating() {
    if (!selectedRating) { toast.error('Pick a star rating first'); return }
    setSubmittingRating(true)
    try {
      await rateUser(user.uid, uid, selectedRating, review)
      const [updated, allRatings] = await Promise.all([
        getUserProfile(uid),
        getRatingsForUser(uid),
      ])
      setProfile(updated)
      setRatings(allRatings)
      setMyRating({ rating: selectedRating, review })
      setShowRatingForm(false)
      toast.success(myRating ? 'Rating updated!' : 'Rating submitted!')
    } catch (err) {
      toast.error(err.message === 'self_rating' ? "You can't rate yourself" : 'Failed to submit rating')
    } finally {
      setSubmittingRating(false)
    }
  }

  if (loading) return <><Navbar /><PageSpinner /></>
  if (!profile) return <><Navbar /><div className="p-8 text-center text-gray-500">Profile not found</div></>

  const expMeta = EXPERIENCE_META[profile.experienceLevel]
  const availMeta = AVAILABILITY_META[profile.availability]
  const lookingForMeta = LOOKING_FOR_META[profile.lookingFor]

  const ratingCount = ratings.length
  const avgRating = ratingCount > 0
    ? Math.round((ratings.reduce((s, r) => s + r.rating, 0) / ratingCount) * 10) / 10
    : 0

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link to="/home" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors">
          <ArrowLeft size={16} /> Back
        </Link>

        {/* ── Main Profile Card ── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 mb-5">

          {/* Top row: avatar + identity */}
          <div className="flex items-start gap-5">
            <img
              src={profile.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${profile.name}`}
              alt={profile.name}
              className="h-24 w-24 rounded-full object-cover flex-shrink-0 ring-2 ring-gray-100"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>

                  {/* Headline */}
                  {profile.headline && (
                    <p className="text-sm text-indigo-600 font-medium mt-0.5">{profile.headline}</p>
                  )}

                  {/* Organization */}
                  {profile.organizationName && (
                    <p className="flex items-center gap-1.5 text-sm text-gray-600 mt-1">
                      <Building2 size={13} className="text-gray-400" />
                      {profile.organizationName}
                      {profile.organizationRole && (
                        <span className="text-gray-400">· {profile.organizationRole}</span>
                      )}
                    </p>
                  )}

                  {/* Institution */}
                  {profile.institution && (
                    <p className="text-sm text-gray-500 mt-0.5">
                      {profile.institution}{profile.year ? ` — ${profile.year}` : ''}
                    </p>
                  )}
                </div>

                {isMe && (
                  <Link to="/setup?edit=1" className="text-sm text-indigo-600 hover:underline flex-shrink-0">
                    Edit Profile
                  </Link>
                )}
              </div>

              {/* Badge row: experience + availability + lookingFor */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {expMeta && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${expMeta.color}`}>
                    <Briefcase size={11} /> {expMeta.label}
                  </span>
                )}
                {availMeta && (
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border ${availMeta.color}`}>
                    <availMeta.icon size={11} /> {availMeta.label}
                  </span>
                )}
                {lookingForMeta && (
                  <span className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium border bg-orange-50 text-orange-700 border-orange-200">
                    <lookingForMeta.icon size={11} /> {lookingForMeta.label}
                  </span>
                )}
              </div>

              {/* Rating summary */}
              {ratingCount > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  <StarRating rating={avgRating} size={15} />
                  <span className="text-sm font-semibold text-gray-700">{avgRating.toFixed(1)}</span>
                  <span className="text-xs text-gray-400">({ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'})</span>
                </div>
              )}
            </div>
          </div>

          {/* Bio */}
          {profile.bio && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700 mb-1.5">About</h2>
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{profile.bio}</p>
            </div>
          )}

          {/* Social links */}
          {(profile.githubUsername || profile.linkedinUrl || profile.twitterUrl || profile.websiteUrl) && (
            <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100">
              {profile.githubUsername && (
                <a href={profile.githubUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
                  <Github size={14} /> @{profile.githubUsername}
                </a>
              )}
              {profile.linkedinUrl && (
                <a href={profile.linkedinUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
                  <Linkedin size={14} /> LinkedIn
                </a>
              )}
              {profile.twitterUrl && (
                <a href={profile.twitterUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
                  <Twitter size={14} /> Twitter
                </a>
              )}
              {profile.websiteUrl && (
                <a href={profile.websiteUrl} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-indigo-600 transition-colors">
                  <Globe size={14} /> Website
                </a>
              )}
            </div>
          )}

          {/* Skills */}
          {profile.skills?.length > 0 && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Skills</h2>
              <div className="flex flex-wrap gap-1.5">
                {profile.skills.map((s) => <SkillChip key={s} skill={s} />)}
              </div>
            </div>
          )}

          {/* Preferred project types */}
          {profile.preferredProjectTypes?.length > 0 && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Interested in</h2>
              <div className="flex flex-wrap gap-1.5">
                {profile.preferredProjectTypes.map((t) => (
                  <Badge key={t} type={t}>{PROJECT_TYPE_LABELS[t] || t}</Badge>
                ))}
              </div>
            </div>
          )}

          {/* Portfolio links */}
          {profile.portfolioLinks?.length > 0 && (
            <div className="mt-5 pt-5 border-t border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700 mb-2">Portfolio & Links</h2>
              <ul className="space-y-1.5">
                {profile.portfolioLinks.map((url) => (
                  <li key={url}>
                    <a href={url} target="_blank" rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-sm text-indigo-600 hover:underline truncate max-w-full">
                      <LinkIcon size={13} className="flex-shrink-0" /> {url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* ── Rate this user (not shown to profile owner) ── */}
        {!isMe && user && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6 mb-5">
            <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <StarIcon size={16} className="text-yellow-400" />
              {myRating ? 'Your Rating' : 'Rate this collaborator'}
            </h2>

            {!showRatingForm && myRating ? (
              <div className="flex items-center gap-3">
                <StarRating rating={myRating.rating} size={18} />
                <span className="text-sm text-gray-500">
                  You rated {myRating.rating}/5
                  {myRating.review && ` — "${myRating.review}"`}
                </span>
                <button onClick={() => setShowRatingForm(true)} className="text-sm text-indigo-600 hover:underline ml-auto">
                  Edit
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <StarRating
                  rating={selectedRating}
                  interactive
                  size={26}
                  onRate={setSelectedRating}
                />
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  maxLength={200}
                  rows={2}
                  placeholder="Add a short review (optional)..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <div className="flex gap-2">
                  {showRatingForm && (
                    <button type="button" onClick={() => setShowRatingForm(false)}
                      className="rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 transition-colors">
                      Cancel
                    </button>
                  )}
                  <button type="button" onClick={submitRating} disabled={submittingRating || !selectedRating}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                    {submittingRating ? 'Submitting...' : myRating ? 'Update Rating' : 'Submit Rating'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Ratings list ── */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 mb-5">
          <h2 className="text-base font-semibold text-gray-900 mb-1 flex items-center gap-2">
            <StarIcon size={16} className="text-yellow-400" />
            Ratings &amp; Reviews
            {ratingCount > 0 && (
              <span className="ml-1 text-sm font-normal text-gray-500">
                — {avgRating.toFixed(1)} avg · {ratingCount} {ratingCount === 1 ? 'rating' : 'ratings'}
              </span>
            )}
          </h2>

          {ratings.length === 0 ? (
            <p className="text-sm text-gray-400 mt-3">No ratings yet.</p>
          ) : (
            <ul className="mt-3 space-y-4">
              {ratings.map((r) => (
                <li key={r.ratingId} className="flex gap-3">
                  <img
                    src={r.raterAvatar || `https://api.dicebear.com/7.x/initials/svg?seed=${r.raterName || r.raterId}`}
                    alt={r.raterName}
                    className="h-8 w-8 rounded-full object-cover flex-shrink-0 ring-1 ring-gray-100"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-800">{r.raterName || 'Anonymous'}</span>
                      <StarRating rating={r.rating} size={13} />
                      <span className="text-xs text-gray-400">
                        {r.createdAt?.toDate
                          ? r.createdAt.toDate().toLocaleDateString()
                          : ''}
                      </span>
                    </div>
                    {r.review && (
                      <p className="text-sm text-gray-600 mt-0.5">{r.review}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* ── Open Projects ── */}
        {projects.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Open Projects ({projects.length})</h2>
            <div className="space-y-3">
              {projects.map((p) => (
                <Link key={p.projectId} to={`/project/${p.projectId}`}
                  className="flex items-center justify-between rounded-xl border border-gray-100 p-4 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge type={p.type}>{PROJECT_TYPE_LABELS[p.type] || p.type}</Badge>
                    </div>
                    <p className="font-medium text-gray-900">{p.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{p.description}</p>
                  </div>
                  <ArrowLeft size={16} className="text-gray-400 rotate-180 flex-shrink-0 ml-4" />
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
