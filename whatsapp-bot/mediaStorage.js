import 'dotenv/config'
import admin from 'firebase-admin'

// Storage access piggybacks on the same Firebase Admin app initialized in
// firestore.js. We only need the bucket() call here, which is safe even if
// firestore.js already called initializeApp — Admin SDK allows one app per
// process and getApp() reuse is handled internally by checking apps.length.
function getBucket() {
  if (!admin.apps.length) {
    throw new Error('Firebase Admin not initialized — evidence storage requires the same service account as Firestore.')
  }
  const bucketName = process.env.FIREBASE_STORAGE_BUCKET
  if (!bucketName) {
    throw new Error('FIREBASE_STORAGE_BUCKET is not set in .env — required to store evidence files.')
  }
  return admin.storage().bucket(bucketName)
}

const EXT_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'application/pdf': 'pdf'
}

// Fetches a WhatsApp media file by its ID (from an incoming message's
// message.image.id or message.document.id) and uploads it to Firebase
// Storage. WhatsApp's own media URLs expire after a short window, so this
// download-and-re-host step is required for evidence to remain accessible
// once a moderator reviews the report later.
//
// Returns a Storage path (not a public URL) — evidence is meant to be
// viewed by moderators only, via the admin panel's authenticated download,
// not exposed publicly, since it may contain personal ID documents.
export async function fetchAndStoreMedia(mediaId) {
  const token = process.env.WHATSAPP_TOKEN

  // Step 1: resolve the media ID to a temporary download URL + mime type.
  const metaRes = await fetch(`https://graph.facebook.com/v19.0/${mediaId}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!metaRes.ok) {
    throw new Error(`Failed to resolve media metadata: ${metaRes.status} ${await metaRes.text()}`)
  }
  const meta = await metaRes.json()

  // Step 2: download the actual bytes from that temporary URL.
  const fileRes = await fetch(meta.url, {
    headers: { Authorization: `Bearer ${token}` }
  })
  if (!fileRes.ok) {
    throw new Error(`Failed to download media: ${fileRes.status}`)
  }
  const buffer = Buffer.from(await fileRes.arrayBuffer())

  // Step 3: upload to Firebase Storage under a predictable evidence/ prefix.
  const ext = EXT_BY_MIME[meta.mime_type] || 'bin'
  const path = `evidence/${Date.now()}-${mediaId}.${ext}`
  const bucket = getBucket()
  const file = bucket.file(path)
  await file.save(buffer, { metadata: { contentType: meta.mime_type } })

  return path
}
