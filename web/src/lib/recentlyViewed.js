const KEY = 'keycheck_recently_viewed_listings'
const MAX_ENTRIES = 10

// Session memory without requiring an account — same localStorage-list
// shape as watchlist.js/compareList.js, but ordered (most recent first)
// and capped, since this is a feed not a saved set.
export function getRecentlyViewedIds() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addRecentlyViewed(id) {
  const current = getRecentlyViewedIds().filter((x) => x !== id)
  const next = [id, ...current].slice(0, MAX_ENTRIES)
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function clearRecentlyViewed() {
  localStorage.removeItem(KEY)
  return []
}
