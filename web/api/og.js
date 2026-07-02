// Vercel Node.js serverless function — makes a specific shared report or
// listing show its own title/description/image when the link is pasted
// into WhatsApp/Twitter/Facebook/etc., instead of the generic site-wide
// card. Social crawlers don't execute JavaScript, so a client-rendered
// SPA can't do this on its own; the meta tags have to already be in the
// raw HTML response.
//
// No Firebase Admin credentials needed: reports are fully publicly
// readable (firestore.rules: `allow read: if true`) and active listings
// are publicly readable too — both under rules that already treat an
// unauthenticated request as valid, and Firestore's REST API enforces
// the exact same rules an unauthenticated client SDK call would. A
// pending/private listing correctly 403s below and falls back to
// generic tags, nothing not already public is ever exposed here.

const SITE_URL = 'https://f-kappa-one.vercel.app'
const SITE_TITLE = 'KeyCheck — Check before you buy'
const SITE_DESCRIPTION =
  'Community housing and land registry. Search before you buy or rent — check land, agents, landlords, and estates for reported fraud.'
const SITE_IMAGE = `${SITE_URL}/icon-512.png`

const TYPE_LABELS = {
  land: 'Land',
  agent: 'Land agent',
  house_agent: 'Rental agent',
  landlord: 'Landlord',
  estate: 'Estate/developer'
}

// Known social/search crawlers — covers the platforms named in the
// original ask (WhatsApp, Twitter, Facebook) plus the other common ones.
// Not exhaustive; a crawler not on this list just gets the 302 like a
// regular browser would, which is a safe fallback, not a broken one.
const BOT_PATTERN =
  /facebookexternalhit|Facebot|Twitterbot|WhatsApp|LinkedInBot|Slackbot|TelegramBot|Discordbot|Googlebot|bingbot|Applebot|SkypeUriPreview|redditbot|vkShare|Pinterest/i

// Firestore REST returns typed field wrappers, e.g. { stringValue: 'x' }
// or { integerValue: '5' } — unwrap into a plain object.
function parseFields(fields = {}) {
  const out = {}
  for (const [key, value] of Object.entries(fields)) {
    const type = Object.keys(value)[0]
    out[key] = value[type]
  }
  return out
}

async function fetchDoc(collection, id) {
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID
  const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${collection}/${id}`
  const res = await fetch(url)
  if (!res.ok) return null
  const json = await res.json()
  return parseFields(json.fields)
}

function buildOgHtml({ title, description, image, url }) {
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${esc(title)}</title>
<meta property="og:type" content="website" />
<meta property="og:site_name" content="KeyCheck" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:image" content="${esc(image)}" />
<meta property="og:url" content="${esc(url)}" />
<meta name="twitter:card" content="${image === SITE_IMAGE ? 'summary' : 'summary_large_image'}" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${esc(image)}" />
</head>
<body></body>
</html>`
}

export default async function handler(req, res) {
  const { type, id } = req.query
  const userAgent = req.headers['user-agent'] || ''
  const isBot = BOT_PATTERN.test(userAgent)

  let og = { title: SITE_TITLE, description: SITE_DESCRIPTION, image: SITE_IMAGE, url: SITE_URL }

  if (type === 'report' && id) {
    const doc = await fetchDoc('reports', id)
    if (doc) {
      og = {
        title: `${TYPE_LABELS[doc.type] || 'Report'}: ${doc.locationText || 'KeyCheck report'}`,
        description: (doc.description || SITE_DESCRIPTION).slice(0, 200),
        image: SITE_IMAGE,
        url: `${SITE_URL}/report/${id}`
      }
    }
  } else if (type === 'listing' && id) {
    const doc = await fetchDoc('listings', id)
    if (doc && doc.status === 'active') {
      og = {
        title: `${TYPE_LABELS[doc.type] || 'Listing'} — ₦${Number(doc.price || 0).toLocaleString()}`,
        description: (doc.description || SITE_DESCRIPTION).slice(0, 200),
        image: doc.photoUrl || SITE_IMAGE,
        url: `${SITE_URL}/listing/${id}`
      }
    }
  }

  if (isBot) {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.status(200).send(buildOgHtml(og))
    return
  }

  const redirectTarget = type === 'listing' ? `/?listing=${encodeURIComponent(id)}` : `/?report=${encodeURIComponent(id)}`
  res.writeHead(302, { Location: redirectTarget })
  res.end()
}
