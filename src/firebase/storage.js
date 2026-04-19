import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from './config'

export async function uploadAvatar(uid, file) {
  const storageRef = ref(storage, `avatars/${uid}`)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}

export async function uploadResume(uid, file) {
  const storageRef = ref(storage, `resumes/${uid}.pdf`)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}

export async function uploadProjectImage(projectId, file) {
  const storageRef = ref(storage, `project-images/${projectId}`)
  await uploadBytes(storageRef, file)
  return getDownloadURL(storageRef)
}
