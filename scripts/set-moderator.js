// One-off script to grant or revoke the 'moderator' custom claim that
// firestore.rules' isAdmin() checks. Custom claims can only be set with the
// Admin SDK (never from the client), which is why this exists as a script
// rather than a button in the admin panel.
//
// Setup:
//   cd scripts
//   npm install
//   cp .env.example .env   # point FIREBASE_SERVICE_ACCOUNT_PATH at your key
//
// Usage:
//   node set-moderator.js someone@example.com            # grant
//   node set-moderator.js someone@example.com --revoke   # revoke
//
// The user must already exist in Firebase Authentication (Console >
// Authentication > add them first). After running this, they need to sign
// out and back in — custom claims are baked into the ID token at sign-in,
// so an already-open session won't see the change until it refreshes.

import 'dotenv/config'
import fs from 'fs'
import admin from 'firebase-admin'

const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
if (!path || !fs.existsSync(path)) {
  console.error(
    'FIREBASE_SERVICE_ACCOUNT_PATH is not set or the file does not exist. ' +
      'Generate a key from Firebase Console > Project Settings > Service Accounts, ' +
      'save it locally, and point .env at it.'
  )
  process.exit(1)
}

const email = process.argv[2]
const revoke = process.argv.includes('--revoke')

if (!email) {
  console.error('Usage: node set-moderator.js <email> [--revoke]')
  process.exit(1)
}

const serviceAccount = JSON.parse(fs.readFileSync(path, 'utf8'))
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })

async function run() {
  const user = await admin.auth().getUserByEmail(email)
  await admin.auth().setCustomUserClaims(user.uid, revoke ? {} : { moderator: true })
  console.log(`${revoke ? 'Revoked' : 'Granted'} moderator claim for ${email} (uid: ${user.uid}).`)
  console.log('They need to sign out and back in for this to take effect.')
}

run().catch((err) => {
  console.error('Failed:', err.message)
  process.exit(1)
})
