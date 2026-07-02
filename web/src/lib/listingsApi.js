import { db } from './firebase.js'
import { collection, addDoc, updateDoc, doc, getDocs, query, where, orderBy } from 'firebase/firestore'

const LISTINGS = 'listings'
const REPORTS = 'reports'

// Same exact-match convention AgentProfile.jsx already uses for reports —
// names are free text, so this is a literal match, not fuzzy dedup.
export async function checkAgentFlagged(name) {
  const target = (name || '').trim()
  if (!target) return false
  const q = query(collection(db, REPORTS), where('agentName', '==', target))
  const snap = await getDocs(q)
  return snap.docs.some((d) => ['disputed', 'verified'].includes(d.data().status))
}

// Admin-only for Milestone 1 (no lister-account system yet) — enforced by
// firestore.rules, this is just the client call. Automatically blocks the
// listing if the lister name matches a disputed/verified fraud report,
// rather than leaving that check to a moderator's memory.
export async function createListing(listing) {
  const flagged = await checkAgentFlagged(listing.listerName)
  const payload = {
    ...listing,
    status: flagged ? 'blocked' : 'pending',
    blockedReason: flagged
      ? `"${listing.listerName}" has an active disputed or verified fraud report on KeyCheck.`
      : null,
    createdAt: new Date().toISOString()
  }
  const ref = await addDoc(collection(db, LISTINGS), payload)
  return { id: ref.id, ...payload }
}

export async function updateListingStatus(listingId, status) {
  await updateDoc(doc(db, LISTINGS, listingId), { status })
}

// One-off fetch (not realtime), same pattern as adminApi.js's
// getRecentSearchMisses — admin screen doesn't need a live subscription.
export async function listListings() {
  const q = query(collection(db, LISTINGS), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// Public: used by AgentProfile.jsx to show a lister's active listings.
// The status == 'active' filter has to be part of the query itself, not
// just applied client-side after fetching — Firestore rejects an entire
// multi-document query if *any* possible result could fail the security
// rule for the reader, it doesn't silently drop denied documents. Two
// plain equality filters (no orderBy, no range) don't need a manual
// composite index — Firestore's automatic indexes cover this.
export async function getListingsByListerName(name) {
  const target = (name || '').trim()
  if (!target) return []
  const q = query(collection(db, LISTINGS), where('listerName', '==', target), where('status', '==', 'active'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
