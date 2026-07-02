import { db } from './firebase.js'
import { collection, addDoc, updateDoc, doc, deleteDoc, getDocs, query, where, orderBy, arrayUnion } from 'firebase/firestore'

const REVIEWS = 'reviews'

// Separate collection from reports on purpose — see firestore.rules'
// reviews match block. Same exact-match-by-name convention AgentProfile.jsx
// already uses for reports (lib/listingsApi.js's getListingsByListerName),
// not fuzzy dedup.
export async function submitReview(listerName, { rating, text, transactionType, verifiedProofNote }) {
  const payload = {
    listerName: listerName.trim(),
    rating,
    text: text.trim(),
    transactionType,
    verifiedProofNote: (verifiedProofNote || '').trim() || null,
    status: 'unverified',
    replies: [],
    createdAt: new Date().toISOString()
  }
  const ref = await addDoc(collection(db, REVIEWS), payload)
  return { id: ref.id, ...payload }
}

// One-off fetch, same pattern as getListingsByListerName — a profile
// page's reviews, not a live subscription.
export async function getReviewsForLister(listerName) {
  const target = (listerName || '').trim()
  if (!target) return []
  const q = query(collection(db, REVIEWS), where('listerName', '==', target), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

// Pure — no separate aggregate document to keep in sync, computed
// client-side from whatever getReviewsForLister already fetched. Kept
// deliberately separate from any fraud-report count at every call site
// (see AgentProfile.jsx), never blended into one number.
export function getReviewAggregate(reviews) {
  if (!reviews || reviews.length === 0) return { average: null, count: 0 }
  const sum = reviews.reduce((acc, r) => acc + r.rating, 0)
  return { average: sum / reviews.length, count: reviews.length }
}

// Right-of-reply, same shape as reportsApi.js's addReplyToFirestore
// (arrayUnion, public — see firestore.rules' isOnlyAddingReply()).
export async function addReviewReply(reviewId, { text }) {
  const reply = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    text,
    createdAt: new Date().toISOString()
  }
  await updateDoc(doc(db, REVIEWS, reviewId), { replies: arrayUnion(reply) })
  return reply
}

// Admin-only, same one-off list pattern as listListings/getRecentSearchMisses.
export async function listAllReviews() {
  const q = query(collection(db, REVIEWS), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function deleteReview(reviewId) {
  await deleteDoc(doc(db, REVIEWS, reviewId))
}

export async function setReviewStatus(reviewId, status) {
  await updateDoc(doc(db, REVIEWS, reviewId), { status })
}
