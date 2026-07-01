// EFCC land-fraud release monitor.
//
// WHY A HEADLESS BROWSER: efcc.gov.ng renders its news list client-side —
// a plain fetch() returns an empty page shell with no article links. This
// script uses Playwright to load the page like a real browser, wait for
// the content to render, then read the links straight out of the DOM.
//
// WHAT IT DOES: scans the EFCC news-release listing for links whose title
// mentions land/property fraud, skips anything already seen on a previous
// run, and writes new candidates to pending-review.json. It does NOT add
// anything to your live database automatically — every candidate needs a
// human to read the actual release and write a properly paraphrased,
// sourced entry (the same standard the existing seedReports.js entries
// were held to). This script's job is to save you from manually checking
// the page every day, not to publish unreviewed allegations.
//
// USAGE:
//   npm install && npx playwright install chromium
//   npm run monitor
//
// Run this on a schedule (cron, GitHub Actions, etc.) — see README.

import 'dotenv/config'
import fs from 'fs'
import { chromium } from 'playwright'

const LISTING_URL = process.env.LISTING_URL || 'https://www.efcc.gov.ng/efcc/news-and-information/news-release/'
const SEEN_FILE = './seen-urls.json'
const PENDING_FILE = './pending-review.json'

const KEYWORDS = [
  'land',
  'plot',
  'property',
  'certificate of occupancy',
  'c of o',
  'omo-onile',
  'omo onile',
  'real estate',
  'landed property'
]

function isRelevant(title) {
  const lower = title.toLowerCase()
  return KEYWORDS.some((kw) => lower.includes(kw))
}

function loadJson(path, fallback) {
  try {
    return JSON.parse(fs.readFileSync(path, 'utf8'))
  } catch {
    return fallback
  }
}

function saveJson(path, data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2))
}

async function notifySlack(newItems) {
  const webhook = process.env.SLACK_WEBHOOK_URL
  if (!webhook || newItems.length === 0) return
  const lines = newItems.map((i) => `• <${i.url}|${i.title}>`).join('\n')
  try {
    await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: `KeyCheck monitor found ${newItems.length} new EFCC land-fraud release(s) to review:\n${lines}`
      })
    })
  } catch (err) {
    console.warn('Slack notification failed (non-fatal):', err.message)
  }
}

async function run() {
  console.log(`Checking ${LISTING_URL} ...`)
  const browser = await chromium.launch(
    process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}
  )
  const page = await browser.newPage()

  await page.goto(LISTING_URL, { waitUntil: 'networkidle', timeout: 30000 })
  // The listing renders via client-side JS; give it a moment after network
  // idle in case content streams in slightly after the last request.
  await page.waitForTimeout(1500)

  // Deliberately broad selector: every link whose href matches the
  // news-release URL pattern observed across EFCC's site, rather than a
  // brittle CSS class that may change with a site redesign.
  const links = await page.$$eval('a[href*="/news-release/"]', (anchors) =>
    anchors
      .map((a) => ({ url: a.href, title: a.textContent.trim() }))
      .filter((item) => item.title.length > 8) // drop empty/icon-only links
  )

  await browser.close()

  // Dedupe by URL (the same release can appear multiple times on a listing page)
  const uniqueLinks = Array.from(new Map(links.map((l) => [l.url, l])).values())
  console.log(`Found ${uniqueLinks.length} release links on the page.`)

  const seen = new Set(loadJson(SEEN_FILE, []))
  const pending = loadJson(PENDING_FILE, [])

  const newRelevant = uniqueLinks.filter((l) => isRelevant(l.title) && !seen.has(l.url))

  if (newRelevant.length > 0) {
    console.log(`${newRelevant.length} new land/property-fraud release(s) found:`)
    newRelevant.forEach((l) => console.log(`  - ${l.title}\n    ${l.url}`))
    const updatedPending = [
      ...pending,
      ...newRelevant.map((l) => ({ ...l, foundAt: new Date().toISOString(), status: 'needs_review' }))
    ]
    saveJson(PENDING_FILE, updatedPending)
    await notifySlack(newRelevant)
  } else {
    console.log('No new land/property-fraud releases since last run.')
  }

  // Mark every link seen this run (relevant or not) so we never re-evaluate it.
  uniqueLinks.forEach((l) => seen.add(l.url))
  saveJson(SEEN_FILE, Array.from(seen))

  console.log(`Done. ${pending.length + newRelevant.length} total item(s) awaiting review in ${PENDING_FILE}.`)
}

run().catch((err) => {
  console.error('Monitor run failed:', err);
  process.exit(1)
})
