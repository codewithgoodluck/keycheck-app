import { db, storage } from './firebase.js'
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  increment,
  query,
  where,
  orderBy,
  limit,
  arrayUnion,
  getDocs
} from 'firebase/firestore'
import { ref, uploadBytes } from 'firebase/storage'

const COLLECTION = 'reports'

// Subscribes to live updates from Firestore. If Firebase isn't configured
// (no .env values), this throws/fails fast and the caller falls back to the
// local seed data — so the app stays demoable with zero setup, and upgrades
// to live data automatically once real Firebase credentials are added.
//
// `limitCount` caps how many of the most recent reports get pulled down —
// without it, the whole collection would be re-fetched (and re-sent over
// onSnapshot) on every change as the registry grows into the thousands.
// `onData`'s second argument tells the caller whether more reports exist
// beyond the current limit, so the UI can offer a "load more" action that
// re-subscribes with a bigger limitCount.
export function subscribeToReports(onData, onError, limitCount = 200) {
  try {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'), limit(limitCount))
    return onSnapshot(
      q,
      (snapshot) => {
        const reports = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
        onData(reports, { hasMore: reports.length >= limitCount })
      },
      (err) => {
        console.warn('Firestore subscription failed, using local data instead:', err.message)
        onError?.(err)
      }
    )
  } catch (err) {
    console.warn('Firestore not configured, using local seed data:', err.message)
    onError?.(err)
    return () => {}
  }
}

// Best-effort analytics signal: which searches turn up nothing, so a
// moderator knows where to focus seeding effort next (see
// firestore.rules for the write-only shape restriction on this collection).
// Never throws — a broken logging call should never break the search UI.
export async function logSearchMiss(queryText) {
  const trimmed = queryText?.trim().slice(0, 200)
  if (!trimmed) return
  try {
    await addDoc(collection(db, 'search_misses'), { query: trimmed, at: new Date().toISOString() })
  } catch (err) {
    console.warn('Failed to log search miss (non-fatal):', err.message)
  }
}

// Uploads an evidence file to the same evidence/ prefix the WhatsApp bot
// uses (whatsapp-bot/mediaStorage.js), returning a Storage path — not a
// public URL. Nothing under evidence/ is publicly readable (see
// storage.rules); it's kept private since evidence may contain personal
// ID documents. Throws on files over 10MB or non-image/PDF types, mirrored
// client-side here so the error surfaces before an upload attempt rather
// than as an opaque permission-denied from storage.rules.
export async function uploadEvidence(file) {
  if (file.size >= 10 * 1024 * 1024) {
    throw new Error('File is too large (max 10MB).')
  }
  if (!/^image\/|^application\/pdf$/.test(file.type)) {
    throw new Error('Only images or PDF files are accepted as evidence.')
  }
  const path = `evidence/${Date.now()}-${file.name}`
  const fileRef = ref(storage, path)
  await uploadBytes(fileRef, file, { contentType: file.type })
  return path
}

export async function addReportToFirestore(report) {
  const payload = { ...report, upvotes: 0, createdAt: new Date().toISOString() }
  const ref = await addDoc(collection(db, COLLECTION), payload)
  return { id: ref.id, ...payload }
}

// One-off fetch for the Profile page's "My reports" — reports now
// require being signed in to submit (see firestore.rules), so every
// report going forward carries the submitter's own uid. Sorted
// client-side rather than orderBy('createdAt') to avoid needing a new
// composite index, same reasoning as inquiriesApi.js's
// getInquiriesForListing.
export async function getReportsBySubmitter(uid) {
  const q = query(collection(db, COLLECTION), where('submitterId', '==', uid))
  const snap = await getDocs(q)
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .sort((a, b) => new Date(b.createdAt || b.dateReported) - new Date(a.createdAt || a.dateReported))
}

export async function confirmReportInFirestore(id) {
  const ref = doc(db, COLLECTION, id)
  await updateDoc(ref, { upvotes: increment(1) })
}

// Right-of-reply: lets a named party respond to a report about them. Replies
// start "unverified" just like reports do — visible immediately but clearly
// labeled, with manual verification possible later via the admin panel.
// `channel` and `identityVerified` together form a soft trust signal: a
// reply submitted through the WhatsApp bot is tied to a real phone number
// (much harder to fake than typing a name into a web form), so it carries
// more weight than a web submission until an admin manually confirms
// identity either way. See AdminPanel.jsx for the manual confirmation step.
export async function addReplyToFirestore(reportId, reply) {
  const ref = doc(db, COLLECTION, reportId)
  const payload = {
    id: `reply-${Date.now()}`,
    status: 'unverified',
    channel: 'web',
    identityVerified: false,
    submittedAt: new Date().toISOString(),
    ...reply
  }
  await updateDoc(ref, { replies: arrayUnion(payload) })
  return payload
}
