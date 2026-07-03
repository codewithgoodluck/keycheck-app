import { db, storage } from './firebase.js'
import { collection, addDoc, updateDoc, doc, getDocs, getCountFromServer, onSnapshot, query, where, orderBy, limit } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

const LISTINGS = 'listings'
const REPORTS = 'reports'
const LISTING_VIEWS = 'listing_views'
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

// Live counterpart to checkAgentFlagged, for pages that already hold the
// whole reports feed in memory (App.jsx's onSnapshot subscription) —
// avoids a fresh Firestore query per listing. Exists so a listing's
// "verified" standing isn't just a one-time decision made at activation:
// checkAgentFlagged only runs once, when a moderator activates a listing,
// so a lister who gets a disputed/verified report *afterward* would
// otherwise keep showing as active/verified indefinitely, with nothing
// ever re-checking. getEffectiveStatus (below) uses this set to catch
// that case reactively, on every render, with no backend job required.
export function getFlaggedAgentNames(reports) {
  const names = new Set()
  for (const r of reports) {
    if (r.agentName && ['disputed', 'verified'].includes(r.status)) {
      names.add(r.agentName.trim())
    }
  }
  return names
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

export const MAX_LISTING_PHOTOS = 6

// Sequential, not Promise.all — Storage uploads from a slow mobile
// connection (the primary use case here) are more likely to hit a flaky
// single failure than benefit from parallelism, and sequential keeps the
// error message pointing at exactly which photo failed.
export async function uploadListingPhotos(files) {
  const urls = []
  for (const file of files) {
    urls.push(await uploadListingPhoto(file))
  }
  return urls
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
      blockedReason: `"${listerName}" has an active disputed or verified fraud report on KeyCheck. Cannot be activated.`
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

// Moderator-only manual check against the real LASRERA search (see
// firestore.rules — lasreraNumber itself is free text a lister can type
// in, so this flag is the only thing distinguishing "self-reported" from
// "a moderator actually looked it up," which VerificationBadge.jsx
// renders differently.
export async function setLasreraVerified(listingId, verified) {
  await updateDoc(doc(db, LISTINGS, listingId), { lasreraVerified: verified })
}

// Same manual-check pattern as setLasreraVerified, for the nationally
// checkable CAC number — see TrustSignals.jsx for how the distinction
// between self-reported and moderator-checked renders.
export async function setCacVerified(listingId, verified) {
  await updateDoc(doc(db, LISTINGS, listingId), { cacVerified: verified })
}

// Same pattern again, for the self-reported title-document claim (see
// data/listingFacts.js) — a lister saying "C of O" is a claim, not a
// fact, until a moderator has actually seen the document.
export async function setTitleDocumentVerified(listingId, verified) {
  await updateDoc(doc(db, LISTINGS, listingId), { titleDocumentVerified: verified })
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

// flaggedAgentNames is optional (a Set from getFlaggedAgentNames) — omit
// it for call sites that don't have the reports feed in memory (e.g. an
// admin one-off fetch); they just fall back to the stored status, same
// as before this existed.
export function getEffectiveStatus(listing, flaggedAgentNames) {
  if (listing.status === 'active' && isPastExpiry(listing)) return 'expired'
  if (listing.status === 'active' && flaggedAgentNames && listing.listerName && flaggedAgentNames.has(listing.listerName.trim())) {
    return 'blocked'
  }
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

// Fire-and-forget, mirrors reportsApi.js's logSearchMiss exactly. No
// dedup — every page view logs one document (see the plan's simplification
// note); failures never block rendering the listing itself.
export async function logListingView(listingId, listerId) {
  try {
    await addDoc(collection(db, LISTING_VIEWS), { listingId, listerId, at: new Date().toISOString() })
  } catch (err) {
    console.warn('Failed to log listing view (non-fatal):', err.message)
  }
}

// getCountFromServer() aggregates server-side without downloading every
// view document. The query still needs to filter on both fields (not
// just listingId) to structurally satisfy the read rule — same lesson as
// getListingsByListerName above.
export async function getListingViewCount(listingId, listerId) {
  const q = query(collection(db, LISTING_VIEWS), where('listingId', '==', listingId), where('listerId', '==', listerId))
  const snap = await getCountFromServer(q)
  return snap.data().count
}
