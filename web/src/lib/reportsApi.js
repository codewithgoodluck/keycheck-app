import { db } from './firebase.js'
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  updateDoc,
  increment,
  query,
  orderBy,
  arrayUnion
} from 'firebase/firestore'

const COLLECTION = 'reports'

// Subscribes to live updates from Firestore. If Firebase isn't configured
// (no .env values), this throws/fails fast and the caller falls back to the
// local seed data — so the app stays demoable with zero setup, and upgrades
// to live data automatically once real Firebase credentials are added.
export function subscribeToReports(onData, onError) {
  try {
    const q = query(collection(db, COLLECTION), orderBy('createdAt', 'desc'))
    return onSnapshot(
      q,
      (snapshot) => {
        const reports = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }))
        onData(reports)
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

export async function addReportToFirestore(report) {
  const payload = { ...report, upvotes: 0, createdAt: new Date().toISOString() }
  const ref = await addDoc(collection(db, COLLECTION), payload)
  return { id: ref.id, ...payload }
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
