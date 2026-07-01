// One-time seeding script — pushes web/src/data/seedReports.js into your
// real Firestore project. Run this once before launch (and again any time
// you add new sourced cases to seedReports.js that should go live).
//
// Setup:
//   cd scripts
//   npm install
//   cp .env.example .env   # point FIREBASE_SERVICE_ACCOUNT_PATH at your key
//   npm run seed
//
// Safe to re-run: it checks for an existing report with the same sourceUrl
// before adding, so it won't create duplicates.

import 'dotenv/config'
import fs from 'fs'
import admin from 'firebase-admin'
import { seedReports } from '../web/src/data/seedReports.js'

const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
if (!path || !fs.existsSync(path)) {
  console.error(
    'FIREBASE_SERVICE_ACCOUNT_PATH is not set or the file does not exist. ' +
      'Generate a key from Firebase Console > Project Settings > Service Accounts, ' +
      'save it locally, and point .env at it.'
  )
  process.exit(1)
}

const serviceAccount = JSON.parse(fs.readFileSync(path, 'utf8'))
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
const db = admin.firestore()

async function seed() {
  const collectionRef = db.collection('reports')
  let added = 0
  let skipped = 0

  for (const report of seedReports) {
    if (report.sourceUrl) {
      const existing = await collectionRef.where('sourceUrl', '==', report.sourceUrl).limit(1).get()
      if (!existing.empty) {
        skipped++
        continue
      }
    }
    await collectionRef.add({
      ...report,
      upvotes: report.upvotes || 0,
      createdAt: new Date().toISOString()
    })
    added++
  }

  console.log(`Seeding complete: ${added} added, ${skipped} skipped (already present).`)
}

seed().catch((err) => {
  console.error('Seeding failed:', err)
  process.exit(1)
})
