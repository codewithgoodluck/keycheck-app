const SEEN_KEY = 'keycheck_seen_report_ids'
const SEEN_LISTING_KEY = 'keycheck_seen_listing_ids'
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

// Same idea, separate storage key — kept apart from report ids rather
// than sharing one set, since report and listing ids are both Firestore
// auto-ids and could otherwise collide (marking one "seen" via the other).
export function getSeenListingIds() {
  try {
    const raw = localStorage.getItem(SEEN_LISTING_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function markListingsSeen(ids) {
  const current = new Set(getSeenListingIds())
  ids.forEach((id) => current.add(id))
  localStorage.setItem(SEEN_LISTING_KEY, JSON.stringify(Array.from(current).slice(-MAX_STORED)))
}

export function areaOf(report) {
  return report.locationText?.split(',')[0].trim().toLowerCase() || ''
}
