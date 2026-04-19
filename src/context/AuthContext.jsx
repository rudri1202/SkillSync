import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthChanged } from '../firebase/auth'
import { createOrGetUser } from '../firebase/firestore'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthChanged(async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser)
        try {
          const data = await createOrGetUser(firebaseUser)
          setProfile(data)
        } catch {
          setProfile(null)
        }
      } else {
        setUser(null)
        setProfile(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  function refreshProfile(newProfile) {
    setProfile((prev) => ({ ...prev, ...newProfile }))
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
