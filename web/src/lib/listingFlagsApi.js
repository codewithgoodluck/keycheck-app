import { db } from './firebase.js'
import { collection, addDoc, updateDoc, doc, getDocs, query, orderBy } from 'firebase/firestore'

const FLAGS = 'listing_flags'

export const FLAG_REASON_LABELS = {
  fake: 'This listing looks fake',
  duplicate: 'Duplicate of another listing',
  already_taken: 'Already let/sold — no longer available',
  other: 'Something else'
}

// Anonymous, same trust posture as reports — a buyer flagging a listing
// doesn't need an account. Always lands 'open'; only a moderator can move
// it (see firestore.rules' listing_flags match block).
export async function flagListing(listingId, reason, note) {
  await addDoc(collection(db, FLAGS), {
    listingId,
    reason,
    note: (note || '').trim(),
    status: 'open',
    createdAt: new Date().toISOString()
  })
}

// Admin-only queue, one-off fetch like adminApi.js's getRecentSearchMisses.
export async function getListingFlags() {
  const q = query(collection(db, FLAGS), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function resolveListingFlag(flagId) {
  await updateDoc(doc(db, FLAGS, flagId), { status: 'resolved' })
}
