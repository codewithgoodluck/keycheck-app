# KeyCheck — Community Land Fraud Verification

A crowdsourced "red flag" registry for land and agent fraud reports in Nigeria.
Search a location or agent name before you buy. Report a problem after it happens.

This repo has two parts that share one Firestore database:

```
keycheck-app/
  web/            React + Vite search/map/report web app
  whatsapp-bot/   Node/Express webhook for WhatsApp report submission + search
  scripts/        One-off Node utilities: Firestore seeding, EFCC monitor
```

## Why this structure

- The web app is what people search and browse. No login required to search —
  only to submit, to keep spam down.
- The WhatsApp bot is the easiest way for someone to report a problem from
  their phone, no app install required. Both read/write the same database.
- `scripts/` holds maintenance tools that aren't part of the running app:
  pushing seed data live, and watching for new EFCC releases worth reviewing.

## Quick start

### 1. Set up Firebase (free tier is enough to start)

1. Create a project at https://console.firebase.google.com
2. Enable **Firestore Database** (start in test mode for development)
3. Get your web config from Project Settings → General → Your apps → Web app
4. Get a service account key from Project Settings → Service Accounts → Generate new private key (needed for the bot and scripts)

### 2. Run the web app

```bash
cd web
npm install
cp .env.example .env
# paste your Firebase web config values into .env
npm run dev
```

The app works with zero Firebase setup too — it falls back to the bundled
seed data automatically (see "How live data works" below).

### 3. Push the seed data to Firestore

```bash
cd scripts
npm install
cp .env.example .env
# point FIREBASE_SERVICE_ACCOUNT_PATH at your downloaded service account key
npm run seed
```

Safe to re-run — it skips any report whose `sourceUrl` already exists, so it
won't create duplicates as you add more sourced cases over time.

### 4. Run the WhatsApp bot

```bash
cd whatsapp-bot
npm install
cp .env.example .env
# paste your Firebase service account path + WhatsApp Cloud API token into .env
npm start
```

Use Meta's WhatsApp Cloud API free tier (developers.facebook.com/docs/whatsapp)
or Twilio's WhatsApp Sandbox for testing before going live. Point the webhook
URL (after deploying, e.g. on Render or Railway free tier) at `/webhook`.

## WhatsApp bot capabilities

**Language**: On first contact, the bot asks the person to pick English,
Nigerian Pidgin, Yorùbá, Hausa, or Igbo (`whatsapp-bot/i18n.js`). The choice
is remembered per phone number and can be changed anytime by typing
"language". Only the bot's own menu text is translated — a person's report
description stays exactly as they typed it, since translating someone's
fraud report risks distorting their meaning. **The Yorùbá, Hausa, and Igbo
translations are a best effort, not reviewed by a native speaker** — given
this bot handles legal/financial matters, get them reviewed before relying
on them in production.

**Evidence uploads**: When reporting a problem, a person can send photos or
documents as evidence, one at a time, then type "done". Each file is
downloaded from WhatsApp (whose media links expire quickly) and re-hosted in
Firebase Storage via `whatsapp-bot/mediaStorage.js`. If storage isn't
configured or a specific upload fails, the bot says so clearly and lets the
person continue without it rather than getting stuck.

**Deployment**: `whatsapp-bot/Dockerfile` + `render.yaml` at the repo root
give you a one-click path to Render (or adapt for Railway/Fly.io — the
Dockerfile is standard). A `/health` endpoint is included for uptime
monitoring. Firebase credentials can be provided as a file path (local dev)
or as a single `FIREBASE_SERVICE_ACCOUNT_JSON` env var (most hosts) — see
`whatsapp-bot/.env.example`.

**Testing**: every flow (language selection, full report submission
including the evidence loop, search, right-of-reply, invalid input handling)
was tested end-to-end against a live local instance of the bot before
shipping, including the evidence-upload failure path.

### 5. Run the EFCC monitor (optional, but recommended)

```bash
cd scripts
npx playwright install chromium   # one-time browser download
npm run monitor
```

This checks EFCC's news release page for new land/property fraud releases and
writes candidates to `scripts/pending-review.json` for you to read and turn
into properly sourced, paraphrased entries — the same standard the existing
`seedReports.js` entries follow. It never auto-publishes anything; a human
always reviews before a new entry goes live. Set `SLACK_WEBHOOK_URL` in
`scripts/.env` to also get a Slack ping when something new turns up.

Run it on a schedule with cron, e.g. daily at 8am:

```cron
0 8 * * * cd /path/to/keycheck-app/scripts && npm run monitor >> monitor.log 2>&1
```

The site renders its news list client-side, so this script uses a headless
browser (Playwright) rather than a plain HTTP request — a regular `fetch()`
returns an empty page.

### Link health check (keeps sources honest over time)

```bash
cd scripts
npm run check-links
```

Re-checks every `sourceUrl` in `seedReports.js` (plus any moderator-added
`additionalSources` if Firestore is configured) and flags anything that no
longer resolves cleanly — a 404, a redirect to a paywall, a dead domain.
Results go to `scripts/link-check-results.json`; broken links print to the
console and optionally trigger a Slack ping via `SLACK_WEBHOOK_URL`.

This matters because a dead `sourceUrl` quietly breaks the app's core
promise — a report can look sourced while the link behind it no longer
works. Run it weekly:

```cron
0 9 * * 1 cd /path/to/keycheck-app/scripts && npm run check-links >> link-check.log 2>&1
```

When a link comes back broken, don't just delete the report — find a
replacement source for the same claim (an archived version, a follow-up
article, the original outlet's updated URL) and add it via the admin
panel's "Additional verified sources" field, or update `sourceUrl` directly
in `seedReports.js` if it was a seed entry.

## How live data works

`web/src/lib/reportsApi.js` subscribes to Firestore in real time. If Firebase
isn't configured (no `.env` values, or the `reports` collection is empty),
the app transparently falls back to the bundled `seedReports.js` data so it
stays demoable with zero setup. The moment real data exists in Firestore,
the app switches to it automatically — no code change needed. Submitting a
report or confirming one ("I had this too") writes to Firestore when it's
configured, and falls back to local state otherwise.

Saved/bookmarked reports intentionally stay in the browser's `localStorage`
rather than Firestore, since there's no account system in this MVP — there's
no "who" to attach a save to yet.

## The map

The Map tab plots every report with coordinates using Leaflet and free
OpenStreetMap tiles (no API key needed). Coordinates are area-level
centroids, not exact plot locations, since the underlying source material
is witness/news descriptions rather than surveyed coordinates — the map
view says this explicitly so it's never mistaken for more precision than
the data actually has.

The map is interactive: search by location or agent name to fly to a
matching report, use "My location" to center on where you actually are,
and click any pin for a popup with a "Directions" link that opens Google
Maps navigation straight to that spot.

When submitting a report, `LocationPicker` lets a person drop a pin on an
actual map (tap to place it, tap again to move it, or use "Use my
location") in addition to typing a text description — optional, but it
turns a vague area description into an exact point other people can find.

## Moderation panel (admin)

Visit `/?admin=1` to reach a login-gated moderation panel — it's not linked
from the public nav on purpose. From there a signed-in moderator can:

- Change a report's status (unverified / disputed / verified)
- Delete spam or duplicate reports
- Attach additional verified source links to a report (a second news
  article, a court filing, an official statement) — deliberately
  moderator-only, not open to public submission, so every link on the app
  stays something a human actually checked before adding
- Review right-of-reply submissions, change their status, permanently
  delete abusive ones, and mark a reply's **identity confirmed** once
  you've actually verified who submitted it

**Setup:**
1. Firebase Console → Authentication → enable Email/Password sign-in, then
   add yourself as a user.
2. Edit `firestore.rules` at the repo root — replace the placeholder email
   with your real moderator email(s).
3. Deploy the rules: `firebase deploy --only firestore:rules` (requires
   `npm install -g firebase-tools` and `firebase login` first).

**Read `firestore.rules` before you launch.** The admin panel's login
screen is just a UI convenience — the rules file is what actually stops
someone from calling the Firestore API directly and marking their own
report "verified." These rules haven't been tested against a live project
from this environment (no network access here to firebase.google.com);
test them with the Firebase Emulator Suite or a dev project first.

## Reply identity signal

A right-of-reply submitted through the WhatsApp bot carries more trust than
one submitted through the web form, because it's tied to a real phone
number — much harder to fake than typing a name into a text box. The web
app shows this distinction on every reply ("Sent via WhatsApp number ending
•••1234" vs "Identity not verified — submitted via web form"), and nudges
web users toward WhatsApp for a stronger signal.

This is **not** identity verification — it's a soft signal, not proof. The
admin panel lets a moderator mark a reply "Identity confirmed" after
actually checking (e.g., a phone call, matching an uploaded ID document via
the evidence field). Until that happens, every reply — WhatsApp or web —
displays as unverified. Be honest with users about what this badge does and
doesn't mean if you ever change this logic.

## Before launch: seed the database

Don't launch with an empty database. Before inviting anyone to submit reports,
manually add 30–50 entries sourced from public reporting: news articles about
land disputes, court judgments, state Lands Bureau notices of revoked
Certificates of Occupancy, EFCC press releases naming fraudulent agents — the
EFCC monitor script above is built to help you find these on an ongoing basis.

## Launch scope

Start in one neighborhood, not nationally (e.g. Lekki/Ajah, Lagos — a known
hotspot). Get genuine local density before expanding.

## Legal note

Publicly naming agents or land as fraudulent carries defamation risk if a claim
is false. The data model below distinguishes `unverified` from `verified`
status, requires evidence for verification, and should include a right-of-reply
flow for named parties before this goes to real users.
"# keycheck-app" 
