import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getAuth } from 'firebase/auth'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const storage = getStorage(app)

// Unlike getFirestore (which fails lazily, only when actually queried),
// getAuth validates the API key immediately and throws if it's missing or
// malformed. Without this try/catch, an unconfigured Firebase setup would
// crash the entire app — not just the admin panel that actually needs auth.
export let auth = null
try {
  auth = getAuth(app)
} catch (err) {
  console.warn('Firebase Auth not available (check your .env config):', err.message)
}
