import { auth } from './firebase.js'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth'

// Mirrors lib/adminApi.js's auth functions exactly, same `auth` instance
// — a lister is just any authenticated user without the moderator custom
// claim, not a separate Auth system. See firestore.rules' isAdmin() vs.
// the plain request.auth != null checks in the listings match block.
export function watchListerAuth(callback) {
  if (!auth) {
    callback(null)
    return () => {}
  }
  return onAuthStateChanged(auth, (user) => callback(user))
}

export async function listerSignUp(email, password) {
  if (!auth) throw new Error('Firebase is not configured — add your config to web/.env first.')
  await createUserWithEmailAndPassword(auth, email, password)
}

export async function listerSignIn(email, password) {
  if (!auth) throw new Error('Firebase is not configured — add your config to web/.env first.')
  await signInWithEmailAndPassword(auth, email, password)
}

export async function listerSignOut() {
  await signOut(auth)
}

// Simpler than an in-app change-password flow (which needs a recent-
// login re-auth prompt to satisfy Firebase Auth's security requirement)
// — sends a reset link to the account's own email instead, same pattern
// most small apps use for this.
export async function sendAccountPasswordReset(email) {
  if (!auth) throw new Error('Firebase is not configured — add your config to web/.env first.')
  await sendPasswordResetEmail(auth, email)
}
