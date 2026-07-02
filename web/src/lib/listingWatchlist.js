const KEY = 'keycheck_saved_listings'

// Same shape as watchlist.js (reports' save list) — kept as a separate
// key/collection rather than merged, since a saved report and a saved
// listing are different object types read by different views.
export function getSavedListingIds() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function isListingSaved(id) {
  return getSavedListingIds().includes(id)
}

export function toggleSavedListing(id) {
  const current = getSavedListingIds()
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}
