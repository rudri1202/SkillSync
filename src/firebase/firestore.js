import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  addDoc,
  deleteDoc,
  collection,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  writeBatch,
  limit,
} from 'firebase/firestore'
import { db } from './config'

// ── Users ──────────────────────────────────────────────────────────────────

export async function createOrGetUser(user) {
  const ref = doc(db, 'users', user.uid)
  const snap = await getDoc(ref)
  if (!snap.exists()) {
    const newUser = {
      uid: user.uid,
      name: user.displayName || '',
      email: user.email || '',
      avatarUrl: user.photoURL || '',
      bio: '',
      institution: '',
      year: '',
      githubUsername: '',
      githubUrl: '',
      skills: [],
      skillSource: 'manual',
      resumeUrl: '',
      profileComplete: false,
      // ── Profile enhancement fields ──
      headline: '',                 // short professional tagline
      experienceLevel: '',          // 'beginner' | 'intermediate' | 'expert'
      availability: 'available',    // 'available' | 'busy' | 'unavailable'
      organizationName: '',
      organizationRole: '',
      portfolioLinks: [],           // array of URL strings (max 5)
      linkedinUrl: '',
      twitterUrl: '',
      websiteUrl: '',
      preferredProjectTypes: [],    // project types the user wants to work on
      lookingFor: '',               // 'co-founder' | 'contributor' | 'mentor' | 'mentee' | 'any'
      interactionHistory: [],       // [{projectId, type, skills, action, timestamp}] — last 30
      averageRating: 0,
      totalRatings: 0,
      createdAt: serverTimestamp(),
    }
    await setDoc(ref, newUser)
    return { ...newUser, isNew: true }
  }
  return { ...snap.data(), isNew: false }
}

export async function getUserProfile(uid) {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  return snap.exists() ? snap.data() : null
}

export async function updateUserProfile(uid, data) {
  const ref = doc(db, 'users', uid)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

// ── Projects ───────────────────────────────────────────────────────────────

export async function createProject(data) {
  const ref = await addDoc(collection(db, 'projects'), {
    ...data,
    savedBy: [],
    status: 'open',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  })
  await updateDoc(ref, { projectId: ref.id })
  return ref.id
}

export async function getProject(projectId) {
  const ref = doc(db, 'projects', projectId)
  const snap = await getDoc(ref)
  return snap.exists() ? { projectId: snap.id, ...snap.data() } : null
}

export async function updateProject(projectId, data) {
  const ref = doc(db, 'projects', projectId)
  await updateDoc(ref, { ...data, updatedAt: serverTimestamp() })
}

export async function deleteProject(projectId) {
  const batch = writeBatch(db)

  // delete all joinRequests for this project
  const jrQuery = query(
    collection(db, 'joinRequests'),
    where('projectId', '==', projectId)
  )
  const jrSnap = await getDocs(jrQuery)
  jrSnap.forEach((d) => batch.delete(d.ref))

  batch.delete(doc(db, 'projects', projectId))
  await batch.commit()
}

export async function getFeedProjects(typeFilter, statusFilter = 'open') {
  const status = statusFilter || 'open'
  let q
  if (typeFilter && typeFilter !== 'all') {
    q = query(
      collection(db, 'projects'),
      where('status', '==', status),
      where('type', '==', typeFilter),
      orderBy('createdAt', 'desc'),
      limit(60)
    )
  } else {
    q = query(
      collection(db, 'projects'),
      where('status', '==', status),
      orderBy('createdAt', 'desc'),
      limit(60)
    )
  }
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ projectId: d.id, ...d.data() }))
}

export async function getMyProjects(uid) {
  const q = query(
    collection(db, 'projects'),
    where('ownerId', '==', uid),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ projectId: d.id, ...d.data() }))
}

export async function getSavedProjects(uid) {
  const q = query(
    collection(db, 'projects'),
    where('savedBy', 'array-contains', uid)
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ projectId: d.id, ...d.data() }))
}

export async function toggleSaveProject(projectId, uid, isSaved) {
  const ref = doc(db, 'projects', projectId)
  await updateDoc(ref, {
    savedBy: isSaved ? arrayRemove(uid) : arrayUnion(uid),
  })
}

// ── Join Requests ──────────────────────────────────────────────────────────

export async function sendJoinRequest(data) {
  // enforce one request per user per project
  const existing = await getExistingRequest(data.projectId, data.requesterId)
  if (existing) throw new Error('already_requested')

  const ref = await addDoc(collection(db, 'joinRequests'), {
    ...data,
    status: 'pending',
    createdAt: serverTimestamp(),
    reviewedAt: null,
  })
  return ref.id
}

export async function getExistingRequest(projectId, requesterId) {
  const q = query(
    collection(db, 'joinRequests'),
    where('projectId', '==', projectId),
    where('requesterId', '==', requesterId)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { requestId: snap.docs[0].id, ...snap.docs[0].data() }
}

export async function getRequestsForProject(projectId) {
  const q = query(
    collection(db, 'joinRequests'),
    where('projectId', '==', projectId),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ requestId: d.id, ...d.data() }))
}

export async function getMyRequests(uid) {
  const q = query(
    collection(db, 'joinRequests'),
    where('requesterId', '==', uid),
    orderBy('createdAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ requestId: d.id, ...d.data() }))
}

export async function updateRequestStatus(requestId, status) {
  const ref = doc(db, 'joinRequests', requestId)
  await updateDoc(ref, { status, reviewedAt: serverTimestamp() })
}

export function subscribeToProjectRequests(projectId, callback) {
  const q = query(
    collection(db, 'joinRequests'),
    where('projectId', '==', projectId),
    where('status', '==', 'pending')
  )
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => ({ requestId: d.id, ...d.data() })))
  })
}

export function subscribeToMyRequestsBadge(projectIds, callback) {
  if (!projectIds.length) {
    callback(0)
    return () => {}
  }
  // Firestore 'in' supports max 10 items
  const ids = projectIds.slice(0, 10)
  const q = query(
    collection(db, 'joinRequests'),
    where('projectId', 'in', ids),
    where('status', '==', 'pending')
  )
  return onSnapshot(q, (snap) => callback(snap.size))
}

// ── Interaction History ────────────────────────────────────────────────────

/**
 * Record that a user interacted with a project (save or join request).
 * Keeps only the last 30 entries so the array stays compact.
 * Deduplicates by (projectId, action) so re-saves don't spam the list.
 */
export async function recordInteraction(uid, { projectId, type, skills, action }) {
  const ref = doc(db, 'users', uid)
  const snap = await getDoc(ref)
  const history = snap.data()?.interactionHistory || []

  // Remove any previous entry for the same project+action to avoid duplicates
  const deduped = history.filter(
    (h) => !(h.projectId === projectId && h.action === action)
  )
  const updated = [
    { projectId, type, skills: (skills || []).slice(0, 8), action, timestamp: Date.now() },
    ...deduped,
  ].slice(0, 30)

  await updateDoc(ref, { interactionHistory: updated })
}

// ── Ratings ────────────────────────────────────────────────────────────────

/** Returns the current user's existing rating for a profile, or null. */
export async function getMyRatingForUser(raterId, ratedUserId) {
  const q = query(
    collection(db, 'ratings'),
    where('raterId', '==', raterId),
    where('ratedUserId', '==', ratedUserId)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  return { ratingId: snap.docs[0].id, ...snap.docs[0].data() }
}

/**
 * Submit or update a star rating (1–5) for another user.
 * Prevents self-rating — throws if raterId === ratedUserId.
 * Keeps averageRating + totalRatings on the user doc in sync.
 */
export async function rateUser(raterId, ratedUserId, rating, review = '') {
  if (raterId === ratedUserId) throw new Error('self_rating')

  const [raterSnap, userSnap, existing] = await Promise.all([
    getDoc(doc(db, 'users', raterId)),
    getDoc(doc(db, 'users', ratedUserId)),
    getMyRatingForUser(raterId, ratedUserId),
  ])

  const raterData = raterSnap.data() || {}
  const userData = userSnap.data() || {}
  const oldTotal = userData.totalRatings || 0
  const oldAvg = userData.averageRating || 0
  const userRef = doc(db, 'users', ratedUserId)

  if (existing) {
    await updateDoc(doc(db, 'ratings', existing.ratingId), {
      rating,
      review,
      updatedAt: serverTimestamp(),
    })
    const newAvg = oldTotal > 0
      ? (oldAvg * oldTotal - existing.rating + rating) / oldTotal
      : rating
    await updateDoc(userRef, { averageRating: Math.round(newAvg * 10) / 10 })
  } else {
    await addDoc(collection(db, 'ratings'), {
      raterId,
      ratedUserId,
      rating,
      review,
      raterName: raterData.name || 'Anonymous',
      raterAvatar: raterData.avatarUrl || null,
      createdAt: serverTimestamp(),
    })
    const newTotal = oldTotal + 1
    const newAvg = (oldAvg * oldTotal + rating) / newTotal
    await updateDoc(userRef, {
      averageRating: Math.round(newAvg * 10) / 10,
      totalRatings: newTotal,
    })
  }
}

/** Fetch all ratings for a given user, newest first. */
export async function getRatingsForUser(ratedUserId) {
  const q = query(collection(db, 'ratings'), where('ratedUserId', '==', ratedUserId))
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ ratingId: d.id, ...d.data() }))
    .sort((a, b) => (b.createdAt?.seconds ?? 0) - (a.createdAt?.seconds ?? 0))
}
