import 'dotenv/config'
import fs from 'fs'
import admin from 'firebase-admin'

let db = null

function initFirestore() {
  if (db) return db
  try {
    let serviceAccount = null

    // Two ways to provide credentials, depending on what your host supports:
    // 1. FIREBASE_SERVICE_ACCOUNT_JSON — the whole key as one env var value.
    //    Works everywhere, including hosts with no file-secret support.
    // 2. FIREBASE_SERVICE_ACCOUNT_PATH — a path to the downloaded JSON file.
    //    Simpler for local dev; needs a host that supports secret files
    //    (e.g. Render's "Secret Files") to use in production.
    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON)
    } else {
      const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
      if (path && fs.existsSync(path)) {
        serviceAccount = JSON.parse(fs.readFileSync(path, 'utf8'))
      }
    }

    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.FIREBASE_STORAGE_BUCKET
      })
      db = admin.firestore()
      console.log('Firestore connected.')
    } else {
      console.warn(
        'No Firebase credentials found (checked FIREBASE_SERVICE_ACCOUNT_JSON and FIREBASE_SERVICE_ACCOUNT_PATH) — ' +
          'falling back to in-memory storage. Reports will not persist or sync with the web app until this is configured.'
      )
    }
  } catch (err) {
    console.error('Failed to initialize Firestore, using in-memory fallback:', err.message)
  }
  return db
}

// In-memory fallback so the bot is runnable/testable before Firebase is wired up.
const memoryReports = []
let memoryIdCounter = 1

export async function saveReport(report) {
  const firestoreDb = initFirestore()
  const payload = {
    ...report,
    status: 'unverified',
    source: 'whatsapp',
    evidenceUrls: report.evidenceUrls || [],
    upvotes: 0,
    // The bot's conversational flow is itself a deliberate, multi-step
    // act (not a driveby anonymous web hit), so the attestation is
    // implicit — kept for shape-consistency with web-form reports, which
    // now require this field (see firestore.rules' hasMinimumEvidence()).
    // Not enforced here by rules — the Admin SDK bypasses security rules —
    // this is purely a data-consistency choice.
    attestedAccuracy: true,
    dateReported: new Date().toISOString().slice(0, 10),
    createdAt: new Date().toISOString()
  }

  if (firestoreDb) {
    const ref = await firestoreDb.collection('reports').add(payload)
    return { id: ref.id, ...payload }
  }

  const id = String(memoryIdCounter++).padStart(4, '0')
  const saved = { id, ...payload }
  memoryReports.unshift(saved)
  return saved
}

export async function searchReports(query) {
  const firestoreDb = initFirestore()
  const q = query.toLowerCase()

  if (firestoreDb) {
    // Firestore doesn't do free-text search well. For MVP scale this fetches
    // recent reports and filters in memory — fine up to a few thousand docs.
    // Swap for Algolia/Typesense if the dataset grows past that.
    const snapshot = await firestoreDb.collection('reports').orderBy('createdAt', 'desc').limit(500).get()
    return snapshot.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter(
        (r) =>
          r.locationText?.toLowerCase().includes(q) ||
          r.agentName?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q)
      )
      .slice(0, 5)
  }

  return memoryReports
    .filter(
      (r) =>
        r.locationText?.toLowerCase().includes(q) ||
        r.agentName?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
    )
    .slice(0, 5)
}

// Right-of-reply: lets a named party respond to a specific report by its ID,
// the same ID shown on the web app's detail page (e.g. "#0001" or a Firestore
// doc ID). Mirrors the web app's addReplyToFirestore — replies start
// "unverified" and are visible immediately rather than gated behind a
// moderation queue, consistent with how reports themselves are handled.
//
// phoneLast4 is a soft trust signal: WhatsApp requires a real, working SIM,
// which is harder to fake than typing a name into a web form. We store only
// the last 4 digits (never the full number) in the publicly-readable report
// document, to give readers a *little* more confidence without exposing the
// replier's actual phone number. It's not identity verification — an admin
// still has to manually confirm identityVerified via the admin panel.
export async function addReplyByReportId(reportId, role, text, fromPhone) {
  const reply = {
    id: `reply-${Date.now()}`,
    role,
    text,
    status: 'unverified',
    channel: 'whatsapp',
    phoneLast4: fromPhone ? fromPhone.slice(-4) : null,
    identityVerified: false,
    submittedAt: new Date().toISOString()
  }

  const firestoreDb = initFirestore()
  if (firestoreDb) {
    const ref = firestoreDb.collection('reports').doc(reportId)
    const snap = await ref.get()
    if (!snap.exists) return null
    await ref.update({ replies: admin.firestore.FieldValue.arrayUnion(reply) })
    return reply
  }

  const report = memoryReports.find((r) => r.id === reportId)
  if (!report) return null
  report.replies = [...(report.replies || []), reply]
  return reply
}

export async function getReportById(reportId) {
  const firestoreDb = initFirestore()
  if (firestoreDb) {
    const snap = await firestoreDb.collection('reports').doc(reportId).get()
    return snap.exists ? { id: snap.id, ...snap.data() } : null
  }
  return memoryReports.find((r) => r.id === reportId) || null
}
