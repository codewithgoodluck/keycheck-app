// Simple in-memory session store. Good enough for an MVP with modest traffic.
// If you outgrow a single process, swap this for a Firestore "sessions"
// collection or Redis — the interface below stays the same.

const sessions = new Map()
const SESSION_TTL_MS = 30 * 60 * 1000 // 30 minutes of inactivity clears a session

export function getSession(phone) {
  const existing = sessions.get(phone)
  if (existing && Date.now() - existing.updatedAt < SESSION_TTL_MS) {
    return existing.data
  }
  const fresh = { step: 'menu', draft: {} }
  sessions.set(phone, { data: fresh, updatedAt: Date.now() })
  return fresh
}

export function setSession(phone, data) {
  sessions.set(phone, { data, updatedAt: Date.now() })
}

export function clearSession(phone) {
  sessions.delete(phone)
}

// Language preference persists independently of the conversation session
// (no 30-min TTL) since it's a longer-lived choice, not conversation state.
// Same limitation as sessions: lives in-memory, resets on server restart.
const userLanguages = new Map()

export function getLanguage(phone) {
  return userLanguages.get(phone) || null
}

export function setLanguage(phone, lang) {
  userLanguages.set(phone, lang)
}
