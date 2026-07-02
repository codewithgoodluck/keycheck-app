const KEY = 'keycheck_compare_listings'
export const MAX_COMPARE = 3

// Same shape as watchlist.js — a plain localStorage id list — capped at
// 3, matching the spec's own "3 finalists" framing. toggleCompare
// refuses to add past the cap rather than silently dropping the oldest
// entry, so the caller can show a clear message instead of a confusing
// swap.
export function getCompareIds() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function isComparing(id) {
  return getCompareIds().includes(id)
}

export function toggleCompare(id) {
  const current = getCompareIds()
  if (current.includes(id)) {
    const next = current.filter((x) => x !== id)
    localStorage.setItem(KEY, JSON.stringify(next))
    return next
  }
  if (current.length >= MAX_COMPARE) return current
  const next = [...current, id]
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function removeFromCompare(id) {
  const next = getCompareIds().filter((x) => x !== id)
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}
