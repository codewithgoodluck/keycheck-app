const KEY = 'keycheck_watched_terms'

// Freeform "watch an area" list — unlike watchlist.js (which saves specific
// existing reports), a watch is just a lowercased search term (an area or a
// name) with nothing to anchor it to yet. App.jsx checks newly-arrived
// reports against this list the same way it already does for areas derived
// from saved reports (see lib/notifications.js).
export function getWatchedTerms() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function isWatching(term) {
  const normalized = term.trim().toLowerCase()
  if (!normalized) return false
  return getWatchedTerms().includes(normalized)
}

export function addWatch(term) {
  const normalized = term.trim().toLowerCase()
  if (!normalized) return getWatchedTerms()
  const current = getWatchedTerms()
  if (current.includes(normalized)) return current
  const next = [...current, normalized]
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function removeWatch(term) {
  const normalized = term.trim().toLowerCase()
  const next = getWatchedTerms().filter((t) => t !== normalized)
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}
