const KEY = 'keycheck_confirmed_reports'

export function getConfirmedIds() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function hasConfirmed(id) {
  return getConfirmedIds().includes(id)
}

export function markConfirmed(id) {
  const current = getConfirmedIds()
  if (current.includes(id)) return current
  const next = [...current, id]
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}
