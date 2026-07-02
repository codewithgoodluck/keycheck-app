import { db, storage } from './firebase.js'
import { collection, addDoc, updateDoc, doc, getDocs, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

const LISTINGS = 'listings'
const REPORTS = 'reports'
const LIFECYCLE_STATUSES = ['under_offer', 'let', 'sold', 'expired', 'active']
const DEFAULT_LISTING_DURATION_DAYS = 30

function daysFromNow(days) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString()
}

// Same exact-match convention AgentProfile.jsx already uses for reports —
// names are free text, so this is a literal match, not fuzzy dedup.
export async function checkAgentFlagged(name) {
  const target = (name || '').trim()
  if (!target) return false
  const q = query(collection(db, REPORTS), where('agentName', '==', target))
  const snap = await getDocs(q)
  return snap.docs.some((d) => ['disputed', 'verified'].includes(d.data().status))
}

// Admin-only direct creation (Milestone 1 path — still supported).
// Unlike self-serve creation, this runs the agent-flag check at creation
// time since the admin client is already the trust boundary.
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

// Self-serve creation (Milestone 2) — always lands 'pending' regardless
// of the agent-flag check. The check is deferred to activation time (see
// activateListing()) since a malicious lister could otherwise bypass a
// client-side-only check by calling the Firestore API directly; the real
// enforcement point is the step that actually makes a listing public.
export async function createListingAsLister(listerId, listerPhone, listing) {
  const payload = {
    ...listing,
    listerId,
    listerPhone,
    status: 'pending',
    blockedReason: null,
    createdAt: new Date().toISOString()
  }
  const ref = await addDoc(collection(db, LISTINGS), payload)
  return { id: ref.id, ...payload }
}

// Public listing-photo upload — distinct from evidence uploads (private,
// evidence/ prefix). Listing photos are meant to be publicly visible, so
// they live under listings/ with a public-read Storage rule, and this
// returns a real download URL (not just a Storage path) since it needs
// to work directly in an <img src>.
export async function uploadListingPhoto(file) {
  if (file.size >= 10 * 1024 * 1024) {
    throw new Error('File is too large (max 10MB).')
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are accepted for listing photos.')
  }
  const path = `listings/${Date.now()}-${file.name}`
  const fileRef = ref(storage, path)
  await uploadBytes(fileRef, file, { contentType: file.type })
  return getDownloadURL(fileRef)
}

// Moderator activation — the real enforcement point for the
// auto-block-flagged-agents rule (see createListingAsLister's comment).
// Refuses to activate (and instead rejects) if the lister name now
// matches a disputed/verified fraud report. Also starts the lazy-expiry
// clock (see isPastExpiry/getEffectiveStatus below) — there's no
// scheduled job to flip status automatically, so expiry is computed at
// read time against this timestamp instead.
export async function activateListing(listingId, listerName) {
  const flagged = await checkAgentFlagged(listerName)
  if (flagged) {
    await updateDoc(doc(db, LISTINGS, listingId), {
      status: 'rejected',
      blockedReason: `"${listerName}" has an active disputed or verified fraud report on KeyCheck — cannot be activated.`
    })
    return { activated: false }
  }
  await updateDoc(doc(db, LISTINGS, listingId), {
    status: 'active',
    blockedReason: null,
    expiresAt: daysFromNow(DEFAULT_LISTING_DURATION_DAYS)
  })
  return { activated: true }
}

export async function rejectListing(listingId, reason) {
  await updateDoc(doc(db, LISTINGS, listingId), { status: 'rejected', blockedReason: reason || 'Rejected by a moderator.' })
}

export async function updateListingStatus(listingId, status) {
  await updateDoc(doc(db, LISTINGS, listingId), { status })
}

// Lister-callable subset — their own listing's availability, not the
// pending->active transition (that's moderator-only, enforced in
// firestore.rules' isOwnerAllowedListingUpdate()). Moving (back) into
// 'active' always refreshes expiresAt to a fresh 30-day window —
// otherwise a listing activated 25 days ago, marked under_offer, then
// switched back to active a week later would immediately read as
// "expired" again despite the lister just having reactivated it.
export async function updateListingLifecycle(listingId, status) {
  if (!LIFECYCLE_STATUSES.includes(status)) {
    throw new Error(`Invalid lifecycle status: ${status}`)
  }
  const payload = { status }
  if (status === 'active') {
    payload.expiresAt = daysFromNow(DEFAULT_LISTING_DURATION_DAYS)
  }
  await updateDoc(doc(db, LISTINGS, listingId), payload)
}

// Semantic alias for the "Renew" action in the UI — reviving an
// auto-expired listing and reactivating a manually under_offer/sold one
// are the same underlying operation (see updateListingLifecycle above),
// but a lister thinks of them differently, so the UI gets a distinct
// button/label even though the code path is shared.
export async function renewListing(listingId) {
  await updateListingLifecycle(listingId, 'active')
}

// Pure, no Firestore dependency — used everywhere a listing's status is
// displayed or filtered, instead of the raw stored `status` field, since
// there's no scheduled job to flip status to 'expired' automatically
// (see activateListing's comment). The stored status stays 'active'
// forever past expiresAt; these compute what that actually means right now.
export function isPastExpiry(listing) {
  return Boolean(listing.expiresAt) && new Date(listing.expiresAt) < new Date()
}

export function getEffectiveStatus(listing) {
  if (listing.status === 'active' && isPastExpiry(listing)) return 'expired'
  return listing.status
}

// One-off fetch (not realtime), same pattern as adminApi.js's
// getRecentSearchMisses — admin screen doesn't need a live subscription.
export async function listListings() {
  const q = query(collection(db, LISTINGS), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// One-off fetch of a lister's own listings, any status — their "My
// listings" dashboard. firestore.rules' read rule already permits a
// lister to read their own docs regardless of status via the
// listerId == request.auth.uid clause.
export async function getMyListings(listerId) {
  const q = query(collection(db, LISTINGS), where('listerId', '==', listerId), orderBy('createdAt', 'desc'))
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

// Live subscription for the public browse page — mirrors
// reportsApi.js's subscribeToReports exactly (same cap/load-more shape),
// filtered to status == 'active' so it satisfies the same query-level
// requirement getListingsByListerName's comment explains above.
export function subscribeToListings(onData, onError, limitCount = 100) {
  try {
    const q = query(
      collection(db, LISTINGS),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    )
    return onSnapshot(
      q,
      (snapshot) => {
        const listings = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
        onData(listings, { hasMore: listings.length >= limitCount })
      },
      (err) => {
        console.warn('Listings subscription failed:', err.message)
        onError?.(err)
      }
    )
  } catch (err) {
    console.warn('Listings not available:', err.message)
    onError?.(err)
    return () => {}
  }
}
