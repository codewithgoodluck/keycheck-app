const KEY = 'keycheck_watched_listing_intents'

// Deliberately separate from watches.js's plain string list, which
// report-watching (Map/Search) already relies on — mixing shapes into
// that one array would risk breaking existing watches for a use case
// this file doesn't need to touch. A listing intent needs more than a
// substring match: Market.jsx's wizard collects category, transaction
// type, and a budget ceiling, and a saved alert that only remembers the
// location step throws away most of what the wizard actually asked for.
export function getListingWatches() {
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function keyOf(intent) {
  return [
    (intent.locationText || '').trim().toLowerCase(),
    intent.category || 'any',
    intent.transactionType || 'any',
    intent.budgetMax || 'any'
  ].join('|')
}

export function isWatchingListingIntent(intent) {
  const target = keyOf(intent)
  return getListingWatches().some((w) => keyOf(w) === target)
}

export function addListingWatch(intent) {
  const current = getListingWatches()
  if (isWatchingListingIntent(intent)) return current
  const next = [
    ...current,
    {
      locationText: (intent.locationText || '').trim(),
      category: intent.category || null,
      transactionType: intent.transactionType || null,
      budgetMax: intent.budgetMax || null
    }
  ]
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function removeListingWatch(intent) {
  const target = keyOf(intent)
  const next = getListingWatches().filter((w) => keyOf(w) !== target)
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

// A listing matches a saved intent if every criterion the intent
// actually specified agrees — locationText is a substring match (same
// looseness the rest of the app uses for area matching), the rest are
// exact. A criterion left at "any" (category/transactionType/budgetMax
// unset) is skipped rather than treated as a mismatch.
export function listingMatchesIntent(listing, intent) {
  const loc = listing.locationText?.toLowerCase() || ''
  if (intent.locationText && !loc.includes(intent.locationText.trim().toLowerCase())) return false
  if (intent.category && listing.type !== intent.category) return false
  if (intent.transactionType && listing.transactionType !== intent.transactionType) return false
  if (intent.budgetMax && Number(listing.price) > Number(intent.budgetMax)) return false
  return true
}
