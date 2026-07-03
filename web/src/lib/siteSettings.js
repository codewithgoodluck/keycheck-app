import { db, storage } from './firebase.js'
import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

const SETTINGS_DOC = 'settings/site'

// Per-page banner images, admin-controlled — replaces the earlier
// single site-wide image (and, before that, auto-pulling a photo from a
// moderator-verified listing, which had no curation step for "suitable
// as a banner" specifically — see the incident this was built from: a
// verified listing's photo turned out to be a scanned ID document).
// Stored as one map field (bannerImages: { [pageKey]: url }) on a
// single doc rather than one doc per page, since there's only ever one
// admin-facing settings screen reading/writing all of them together.
// `default` is the fallback for any page without its own image —
// App.jsx resolves the right one per the current view and applies it
// via a single CSS custom property (see resolveBannerImage below).
export const BANNER_PAGES = [
  { key: 'default', label: 'Default (fallback for every other page)' },
  { key: 'home', label: 'Home / Search' },
  { key: 'map', label: 'Map' },
  { key: 'diligence', label: 'Check (due diligence)' },
  { key: 'submit', label: 'Report a problem / vouch' },
  { key: 'saved', label: 'Saved' },
  { key: 'listings', label: 'Listings (Market browse)' },
  { key: 'market', label: 'Market (intent wizard)' },
  { key: 'listing-detail', label: 'Listing detail' },
  { key: 'detail', label: 'Report detail' },
  { key: 'profile', label: 'Agent/company profile' },
  { key: 'area-guide', label: 'Area guide' },
  { key: 'compare-listings', label: 'Compare listings' },
  { key: 'submit-listing', label: 'List a property' },
  { key: 'my-listings', label: 'My listings' },
  { key: 'buyers-agent-directory', label: "Buyer's-agent directory" },
  { key: 'become-buyers-agent', label: "Become a buyer's agent" },
  { key: 'my-profile', label: 'My profile' },
  { key: 'settings', label: 'Settings' },
  { key: 'terms', label: 'Terms of Service' },
  { key: 'lister-auth', label: 'Sign in / Sign up' }
]

// Pages whose banner rotates through all of its uploaded images as a
// carousel instead of just showing one — currently just Listings/Market
// browse, since that's the only banner spot that asked for it. Every
// other page keeps the simpler "one image, uploading replaces it"
// behavior. A page's stored value is a plain string until it's given a
// second image, at which point it becomes an array — normalizeBannerList
// below is what lets every reader treat both shapes the same way.
export const CAROUSEL_BANNER_PAGES = new Set(['listings'])

function normalizeBannerList(value) {
  if (Array.isArray(value)) return value.filter(Boolean)
  if (value) return [value]
  return []
}

export function subscribeSiteBannerImages(callback) {
  if (!db) {
    callback({})
    return () => {}
  }
  return onSnapshot(
    doc(db, SETTINGS_DOC),
    (snap) => {
      if (!snap.exists()) {
        callback({})
        return
      }
      const data = snap.data()
      const images = { ...(data.bannerImages || {}) }
      // Back-compat with the single-image version of this feature — a
      // banner set before per-page support existed becomes the default.
      if (data.bannerImageUrl && images.default === undefined) {
        images.default = data.bannerImageUrl
      }
      callback(images)
    },
    () => callback({})
  )
}

export async function getSiteBannerImages() {
  if (!db) return {}
  const snap = await getDoc(doc(db, SETTINGS_DOC))
  if (!snap.exists()) return {}
  const data = snap.data()
  const images = { ...(data.bannerImages || {}) }
  if (data.bannerImageUrl && images.default === undefined) images.default = data.bannerImageUrl
  return images
}

// Falls back to the page's own image, then the site-wide default, then
// null (the plain gradient) — never a photo that wasn't deliberately
// chosen for that specific spot. Always a single URL, even for carousel
// pages (their first image), for the CSS-var-driven pages that only
// ever show one photo.
export function resolveBannerImage(bannerImages, view) {
  const resolved = bannerImages?.[view] || bannerImages?.default
  return normalizeBannerList(resolved)[0] || null
}

// Same fallback order as resolveBannerImage, but returns every image for
// that page — only meaningful for CAROUSEL_BANNER_PAGES entries, but
// safe to call for any page (just comes back as a 0-or-1-length array).
export function resolveBannerImages(bannerImages, view) {
  const resolved = bannerImages?.[view] || bannerImages?.default
  return normalizeBannerList(resolved)
}

export async function uploadSiteBannerImage(pageKey, file) {
  if (file.size >= 10 * 1024 * 1024) {
    throw new Error('File is too large (max 10MB).')
  }
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files are accepted.')
  }
  const path = `site/banner-${pageKey}-${Date.now()}-${file.name}`
  const fileRef = ref(storage, path)
  await uploadBytes(fileRef, file, { contentType: file.type })
  const url = await getDownloadURL(fileRef)
  if (CAROUSEL_BANNER_PAGES.has(pageKey)) {
    // Appends rather than replaces, so a second upload grows the
    // carousel instead of clobbering the first image. Read-modify-write
    // instead of arrayUnion since the field itself may not exist yet.
    const existing = await getSiteBannerImages()
    const current = normalizeBannerList(existing[pageKey])
    await setDoc(doc(db, SETTINGS_DOC), { bannerImages: { [pageKey]: [...current, url] } }, { merge: true })
  } else {
    // merge:true deep-merges nested map fields in Firestore, so this only
    // touches bannerImages.<pageKey> — every other page's image is untouched.
    await setDoc(doc(db, SETTINGS_DOC), { bannerImages: { [pageKey]: url } }, { merge: true })
  }
  return url
}

// Doesn't delete the previous Storage object automatically — left for
// manual cleanup in the Storage console if ever needed, same reasoning
// as the single-image version of this feature. For carousel pages, pass
// the specific `url` to remove just that image; omit it (or call on a
// non-carousel page) to clear the whole page back to nothing.
export async function clearSiteBannerImage(pageKey, url) {
  if (url && CAROUSEL_BANNER_PAGES.has(pageKey)) {
    const existing = await getSiteBannerImages()
    const current = normalizeBannerList(existing[pageKey]).filter((u) => u !== url)
    await setDoc(doc(db, SETTINGS_DOC), { bannerImages: { [pageKey]: current } }, { merge: true })
    return
  }
  await setDoc(doc(db, SETTINGS_DOC), { bannerImages: { [pageKey]: null } }, { merge: true })
}
