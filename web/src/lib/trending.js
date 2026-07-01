// Reddit/HN-style decay: raw engagement (confirmations + replies, replies
// weighted higher since writing a reply is more effort/signal than a
// tap) divided by a square-root of age so an old, once-popular report
// doesn't permanently dominate a "trending now" surface. Square root
// (not linear) so a report that's a few weeks old but still active isn't
// wiped out entirely.
const REPLY_WEIGHT = 1.5

export function trendingScore(report) {
  const engagement = (report.upvotes || 0) + (report.replies?.length || 0) * REPLY_WEIGHT
  const ageDays = Math.max(0, (Date.now() - new Date(report.dateReported).getTime()) / 86400000)
  return engagement / Math.sqrt(ageDays + 2)
}

export function sortByTrending(reports) {
  return [...reports].sort((a, b) => trendingScore(b) - trendingScore(a))
}
