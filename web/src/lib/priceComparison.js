// Pure functions, no Firestore dependency — the comparison baseline is
// KeyCheck's own live listings only (reuses the already-subscribed
// `listings` array), never an external "market rate" figure, since
// there's no current, verified Nigerian real-estate price data to
// responsibly assert. When there aren't enough comparables, callers show
// that honestly rather than inventing a number.
export const MIN_COMPARABLES = 3
export const LOW_PRICE_RATIO = 0.6 // flag if price/sqm is below 60% of the local median

function medianOf(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

// Same state, type, and transactionType — a plot of land in Lagos isn't
// comparable to a rental in Kano, and price/sqm norms for land vs.
// developed estate units differ too much to mix.
export function getComparableListings(listing, listings) {
  return listings.filter(
    (l) =>
      l.id !== listing.id &&
      l.status === 'active' &&
      l.state === listing.state &&
      l.type === listing.type &&
      l.transactionType === listing.transactionType &&
      l.sizeSqm > 0
  )
}

export function getPriceComparison(listing, listings) {
  if (!listing.sizeSqm) return { available: false, comparableCount: 0 }
  const comparables = getComparableListings(listing, listings)
  if (comparables.length < MIN_COMPARABLES) {
    return { available: false, comparableCount: comparables.length }
  }
  const pricePerSqm = listing.price / listing.sizeSqm
  const median = medianOf(comparables.map((l) => l.price / l.sizeSqm))
  return {
    available: true,
    pricePerSqm,
    median,
    comparableCount: comparables.length,
    isLow: pricePerSqm < median * LOW_PRICE_RATIO
  }
}
