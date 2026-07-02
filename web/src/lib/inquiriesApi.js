import { db } from './firebase.js'
import { collection, addDoc, updateDoc, doc, getDocs, query, where } from 'firebase/firestore'

const INQUIRIES = 'inquiries'

// Public write — the lightweight "in-app messaging" alternative (see the
// plan this was built from): a one-off lead, not a conversation, so no
// buyer account is required. Always lands unread.
export async function createInquiry(listingId, listerId, listingLocationText, { buyerName, buyerContact, message }) {
  const payload = {
    listingId,
    listerId,
    listingLocationText,
    buyerName,
    buyerContact,
    message,
    read: false,
    createdAt: new Date().toISOString()
  }
  const ref = await addDoc(collection(db, INQUIRIES), payload)
  return { id: ref.id, ...payload }
}

// One-off fetch, same pattern as listingsApi.js's getMyListings — a
// lister's inquiries for one listing, fetched on demand when they expand
// that listing's card, not eagerly for every listing on page load.
//
// Filters on both listingId AND listerId (not just listingId) because
// Firestore rejects an entire list query upfront unless its filters
// structurally guarantee the read rule (resource.data.listerId ==
// request.auth.uid) — same lesson as listingsApi.js's
// getListingsByListerName. No orderBy here to avoid needing a composite
// index for two equality filters + a sort on a third field; sorted
// client-side instead since a single listing's inquiry count is small.
export async function getInquiriesForListing(listingId, listerId) {
  const q = query(collection(db, INQUIRIES), where('listingId', '==', listingId), where('listerId', '==', listerId))
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function markInquiryRead(inquiryId) {
  await updateDoc(doc(db, INQUIRIES, inquiryId), { read: true })
}
