const KEY = 'keycheck_my_submitted_report_ids'

// Device-local tally of reports/vouches this person has personally
// submitted, used to show "you've helped submit N reports" after a
// successful submission. No accounts exist, so this — like watchlist.js
// and confirms.js — lives entirely in localStorage.
export function getMySubmittedReportIds() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function addMySubmittedReportId(id) {
  const current = getMySubmittedReportIds()
  if (current.includes(id)) return current
  const next = [...current, id]
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}
