// Link health checker for seedReports.js.
//
// News sites restructure URLs, go behind paywalls, or take pages down.
// A dead sourceUrl quietly undermines the app's whole "verified sources
// only" promise — a report can look sourced while the actual link 404s.
// This script re-checks every sourceUrl (and any moderator-added
// additionalSources, if Firestore is configured) and flags anything that
// no longer resolves cleanly, so a human can find a replacement source or
// mark the report for review rather than leaving a silently dead link live.
//
// USAGE:
//   npm install
//   npm run check-links
//
// Run on a schedule (weekly is plenty — these links don't rot fast):
//   0 9 * * 1 cd /path/to/keycheck-app/scripts && npm run check-links >> link-check.log 2>&1

import 'dotenv/config'
import fs from 'fs'
import { seedReports } from '../web/src/data/seedReports.js'

const RESULTS_FILE = './link-check-results.json'
const TIMEOUT_MS = 15000

async function checkUrl(url) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    // HEAD first (cheap); some sites reject HEAD, so fall back to GET.
    let res = await fetch(url, { method: 'HEAD', signal: controller.signal, redirect: 'follow' })
    if (res.status === 405 || res.status === 403) {
      res = await fetch(url, { method: 'GET', signal: controller.signal, redirect: 'follow' })
    }
    clearTimeout(timeout)
    return { ok: res.ok, status: res.status }
  } catch (err) {
    clearTimeout(timeout)
    return { ok: false, status: null, error: err.name === 'AbortError' ? 'timeout' : err.message }
  }
}

// Optionally also check additionalSources added via the admin panel, if
// Firestore is configured — same credential pattern as the other scripts.
async function fetchLiveAdditionalSources() {
  const jsonEnv = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  const pathEnv = process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  if (!jsonEnv && !(pathEnv && fs.existsSync(pathEnv))) return []

  try {
    const admin = (await import('firebase-admin')).default
    const serviceAccount = jsonEnv ? JSON.parse(jsonEnv) : JSON.parse(fs.readFileSync(pathEnv, 'utf8'))
    if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.cert(serviceAccount) })
    const db = admin.firestore()
    const snapshot = await db.collection('reports').get()
    const links = []
    snapshot.docs.forEach((doc) => {
      const data = doc.data()
      ;(data.additionalSources || []).forEach((src) => {
        links.push({ id: doc.id, label: src.label, url: src.url })
      })
    })
    return links
  } catch (err) {
    console.warn('Could not fetch live additionalSources (non-fatal):', err.message)
    return []
  }
}

async function run() {
  const seedLinks = seedReports.map((r) => ({ id: r.id ?? r.locationText, label: r.agentName || r.locationText, url: r.sourceUrl }))
  const liveLinks = await fetchLiveAdditionalSources()
  const allLinks = [...seedLinks, ...liveLinks].filter((l) => l.url)

  console.log(`Checking ${allLinks.length} source link(s)...`)

  const results = []
  for (const link of allLinks) {
    const result = await checkUrl(link.url)
    results.push({ ...link, ...result, checkedAt: new Date().toISOString() })
    const symbol = result.ok ? '✅' : '❌'
    console.log(`${symbol} [${result.status ?? result.error}] ${link.label} — ${link.url}`)
  }

  const broken = results.filter((r) => !r.ok)

  fs.writeFileSync(RESULTS_FILE, JSON.stringify(results, null, 2))

  console.log(`\n${broken.length} of ${allLinks.length} link(s) need review.`)
  if (broken.length > 0) {
    console.log('\nFlagged for review:')
    broken.forEach((b) => console.log(`  - ${b.label}: ${b.url} (${b.status ?? b.error})`))
    await notifySlack(broken)
  }

  console.log(`\nFull results written to ${RESULTS_FILE}`)
}

async function notifySlack(broken) {
  const webhook = process.env.SLACK_WEBHOOK_URL
  if (!webhook) return
  const lines = broken.map((b) => `• ${b.label} — ${b.url} (${b.status ?? b.error})`).join('\n')
  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `KeyCheck link check: ${broken.length} source link(s) need review:\n${lines}` })
    })
  } catch (err) {
    console.warn('Slack notification failed (non-fatal):', err.message)
  }
}

run().catch((err) => {
  console.error('Link check failed:', err)
  process.exit(1)
})
