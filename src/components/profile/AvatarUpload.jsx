import { useState } from 'react'
import { updateUserProfile } from '../../firebase/firestore'
import { useAuth } from '../../context/AuthContext'
import { UserAvatar, AVATAR_COLORS } from '../ui/UserAvatar'
import toast from 'react-hot-toast'

export function AvatarUpload() {
  const { user, profile, refreshProfile } = useAuth()
  const [saving, setSaving] = useState(false)

  async function handleColorPick(hex) {
    if (hex === profile?.avatarColor) return
    setSaving(true)
    try {
      await updateUserProfile(user.uid, { avatarColor: hex, avatarUrl: '' })
      refreshProfile({ avatarColor: hex, avatarUrl: '' })
    } catch (err) {
      console.error('Avatar update failed:', err)
      toast.error('Failed to update avatar')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <UserAvatar
        name={profile?.name || user?.displayName}
        avatarUrl={profile?.avatarUrl}
        avatarColor={profile?.avatarColor}
        size="lg"
      />
      <div className="flex gap-2">
        {AVATAR_COLORS.map((c) => (
          <button
            key={c.hex}
            type="button"
            disabled={saving}
            onClick={() => handleColorPick(c.hex)}
            className={`h-6 w-6 rounded-full ${c.bg} transition-transform hover:scale-110 ${
              profile?.avatarColor === c.hex ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-gray-400">Pick an avatar color</p>
    </div>
  )
}
