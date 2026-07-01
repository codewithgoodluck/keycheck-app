const KEY = 'keycheck_saved_reports'

export function getSavedIds() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function isSaved(id) {
  return getSavedIds().includes(id)
}

export function toggleSaved(id) {
  const current = getSavedIds()
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id]
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}
