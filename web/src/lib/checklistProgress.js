const KEY = 'keycheck_checklist_progress'

// { [category]: string[] of checked item ids } — same localStorage
// get/set pattern as watchlist.js/confirms.js, no accounts needed.
function getAll() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function getChecked(category) {
  return getAll()[category] || []
}

export function toggleChecked(category, itemId) {
  const all = getAll()
  const current = all[category] || []
  const next = current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId]
  all[category] = next
  localStorage.setItem(KEY, JSON.stringify(all))
  return next
}
