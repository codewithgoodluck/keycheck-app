import { db } from './firebase.js'
import { collection, addDoc, updateDoc, doc, getDocs, query, where, orderBy } from 'firebase/firestore'
import { checkAgentFlagged } from './listingsApi.js'

const BUYERS_AGENTS = 'buyers_agents'

// Self-serve — always lands 'pending'. The auto-block-flagged-agents
// check runs at activation time, not here, same reasoning as
// listingsApi.js's createListingAsLister: the real enforcement point is
// the step that actually makes an entry public, not the step that
// merely queues it.
export async function createBuyersAgentEntry(listerId, entry) {
  const payload = { ...entry, listerId, status: 'pending', blockedReason: null, createdAt: new Date().toISOString() }
  const ref = await addDoc(collection(db, BUYERS_AGENTS), payload)
  return { id: ref.id, ...payload }
}

// Moderator activation — reuses checkAgentFlagged directly (same
// auto-block-flagged-agents check listings use) rather than a separate
// copy, so the two trust surfaces can't silently drift apart.
export async function activateBuyersAgentEntry(entryId, listerName) {
  const flagged = await checkAgentFlagged(listerName)
  if (flagged) {
    await updateDoc(doc(db, BUYERS_AGENTS, entryId), {
      status: 'rejected',
      blockedReason: `"${listerName}" has an active disputed or verified fraud report on KeyCheck — cannot be activated.`
    })
    return { activated: false }
  }
  await updateDoc(doc(db, BUYERS_AGENTS, entryId), { status: 'active', blockedReason: null })
  return { activated: true }
}

export async function rejectBuyersAgentEntry(entryId, reason) {
  await updateDoc(doc(db, BUYERS_AGENTS, entryId), { status: 'rejected', blockedReason: reason || 'Rejected by a moderator.' })
}

// Admin one-off fetch (not realtime), same pattern as adminApi.js's
// getRecentSearchMisses / listingsApi.js's listListings.
export async function listBuyersAgentEntries() {
  const q = query(collection(db, BUYERS_AGENTS), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// A lister's own entry, any status — so they can see it's still pending
// or was rejected, not just silently missing.
export async function getMyBuyersAgentEntry(listerId) {
  const q = query(collection(db, BUYERS_AGENTS), where('listerId', '==', listerId))
  const snap = await getDocs(q)
  return snap.docs[0] ? { id: snap.docs[0].id, ...snap.docs[0].data() } : null
}

// Public browse — one-off fetch (not a live subscription, hence no
// "subscribe" in the name) since this is a much lower-traffic collection
// than listings, doesn't justify an always-on listener. status ==
// 'active' has to be part of the query itself (not just filtered
// client-side after fetching) so it structurally satisfies the read
// rule — same lesson as listingsApi.js's getListingsByListerName.
export async function getActiveBuyersAgentEntries() {
  const q = query(collection(db, BUYERS_AGENTS), where('status', '==', 'active'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
