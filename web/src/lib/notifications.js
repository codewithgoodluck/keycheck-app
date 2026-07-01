const SEEN_KEY = 'keycheck_seen_report_ids'
const MAX_STORED = 2000

// Tracks which report ids this device has already rendered, so App.jsx can
// tell a genuinely new arrival apart from a report it's simply seeing for
// the first time because Firestore just finished loading.
export function getSeenIds() {
  try {
    const raw = localStorage.getItem(SEEN_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function markSeen(ids) {
  const current = new Set(getSeenIds())
  ids.forEach((id) => current.add(id))
  localStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(current).slice(-MAX_STORED)))
}

export function areaOf(report) {
  return report.locationText?.split(',')[0].trim().toLowerCase() || ''
}
