import { db, storage } from './firebase.js'
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

const SETTINGS_DOC = 'settings/site'

// Single site-wide banner image, admin-controlled — replaces the earlier
// approach of pulling a photo from a moderator-verified listing, which
// still had no curation step for "suitable as the whole site's banner"
// specifically (see the incident this was built from: a verified
// listing's photo turned out to be a scanned ID document). Now it's an
// explicit, deliberate choice a moderator makes, stored once and reused
// across every page's banner via a CSS custom property (see App.jsx),
// not threaded as a prop through a dozen components.
export function subscribeSiteBannerUrl(callback) {
  if (!db) {
    callback(null)
    return () => {}
  }
  return onSnapshot(
    doc(db, SETTINGS_DOC),
    (snap) => callback(snap.exists() ? snap.data().bannerImageUrl || null : null),
    () => callback(null)
  )
}

export async function getSiteBannerUrl() {
  if (!db) return null
  const snap = await getDoc(doc(db, SETTINGS_DOC))
  return snap.exists() ? snap.data().bannerImageUrl || null : null
}

export async function uploadSiteBannerImage(file) {
  if (file.size >= 10 * 1024 * 1024) {
    throw new Error('File is too large (max 10MB).')
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are accepted.')
  }
  const path = `site/banner-${Date.now()}-${file.name}`
  const fileRef = ref(storage, path)
  await uploadBytes(fileRef, file, { contentType: file.type })
  const url = await getDownloadURL(fileRef)
  await setDoc(doc(db, SETTINGS_DOC), { bannerImageUrl: url, bannerImagePath: path }, { merge: true })
  return url
}

// Removes the banner (falls back to the plain gradient everywhere) —
// doesn't delete the previous Storage object automatically since
// bannerImagePath isn't tracked reliably across multiple admin sessions;
// left for manual cleanup in the Storage console if ever needed.
export async function clearSiteBannerImage() {
  await setDoc(doc(db, SETTINGS_DOC), { bannerImageUrl: null }, { merge: true })
}
