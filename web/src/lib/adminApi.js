import { auth, db } from './firebase.js'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth'
import { doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore'

export function watchAdminAuth(callback) {
  if (!auth) {
    callback(null)
    return () => {}
  }
  return onAuthStateChanged(auth, (user) => callback(user))
}

export async function adminLogin(email, password) {
  if (!auth) throw new Error('Firebase is not configured — add your config to web/.env first.')
  await signInWithEmailAndPassword(auth, email, password)
}

export async function adminLogout() {
  await signOut(auth)
}

export async function setReportStatus(reportId, status) {
  await updateDoc(doc(db, 'reports', reportId), { status })
}

export async function deleteReport(reportId) {
  await deleteDoc(doc(db, 'reports', reportId))
}

// Replies live as an embedded array on the report doc rather than their own
// collection (see addReplyToFirestore), so updating a single reply means
// reading the array, patching the matching item, and writing the whole
// array back — Firestore has no "update one array element" operation.
export async function setReplyFields(reportId, replyId, fields) {
  const ref = doc(db, 'reports', reportId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const replies = (snap.data().replies || []).map((r) => (r.id === replyId ? { ...r, ...fields } : r))
  await updateDoc(ref, { replies })
}

export async function deleteReply(reportId, replyId) {
  const ref = doc(db, 'reports', reportId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const replies = (snap.data().replies || []).filter((r) => r.id !== replyId)
  await updateDoc(ref, { replies })
}

// Additional sources: a moderator-only way to attach more verified links to
// a report (a second news article, an official statement, a court filing).
// Deliberately NOT exposed to public submission — every link here has been
// personally checked by whoever added it, which is the whole point of
// keeping this admin-only rather than open to anyone.
export async function addSourceLink(reportId, source) {
  const ref = doc(db, 'reports', reportId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const additionalSources = [...(snap.data().additionalSources || []), { ...source, addedAt: new Date().toISOString() }]
  await updateDoc(ref, { additionalSources })
}

export async function removeSourceLink(reportId, index) {
  const ref = doc(db, 'reports', reportId)
  const snap = await getDoc(ref)
  if (!snap.exists()) return
  const additionalSources = (snap.data().additionalSources || []).filter((_, i) => i !== index)
  await updateDoc(ref, { additionalSources })
}
