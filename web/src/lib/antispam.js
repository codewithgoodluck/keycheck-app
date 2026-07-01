const COOLDOWN_KEY = 'keycheck_last_submit_at'
const COOLDOWN_MS = 60 * 1000

// Simple device-local rate limit — one submission per minute. Not a real
// security boundary (anyone can clear localStorage), just a cheap deterrent
// against accidental double-submits and casual spam scripts. Firestore
// rules are the actual boundary for what a submission is allowed to contain.
export function msUntilNextSubmit() {
  const last = Number(localStorage.getItem(COOLDOWN_KEY) || 0)
  const elapsed = Date.now() - last
  return Math.max(0, COOLDOWN_MS - elapsed)
}

export function markSubmitted() {
  localStorage.setItem(COOLDOWN_KEY, String(Date.now()))
}
