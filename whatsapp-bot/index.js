import 'dotenv/config'
import express from 'express'
import { getSession, setSession, clearSession, getLanguage, setLanguage } from './sessionStore.js'
import { saveReport, searchReports, addReplyByReportId, getReportById } from './firestore.js'
import { fetchAndStoreMedia } from './mediaStorage.js'
import { t, LANGUAGES } from './i18n.js'

const app = express()
app.use(express.json())

const APP_LINK = process.env.APP_LINK || 'https://your-keycheck-app.vercel.app'

const PROBLEM_TYPE_KEYS = {
  '1': 'Land sold to multiple people',
  '2': 'Fake or fraudulent land agent',
  '3': 'Fake Certificate of Occupancy',
  '4': 'Rental/letting agent fraud',
  '5': 'Landlord fraud',
  '6': 'Estate or developer fraud',
  '7': 'Other'
}
const PROBLEM_TYPE_CATEGORY = {
  '1': 'land',
  '2': 'agent',
  '3': 'land',
  '4': 'house_agent',
  '5': 'landlord',
  '6': 'estate',
  '7': 'land'
}

// ---------- Health check (for Render/Railway/uptime monitors) ----------

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() })
})

// ---------- WhatsApp Cloud API send helper ----------

async function sendMessage(to, text) {
  const url = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text }
    })
  })
  if (!res.ok) {
    console.error('WhatsApp send failed:', res.status, await res.text())
  }
}

// ---------- Webhook verification (GET) ----------

app.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']

  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    return res.status(200).send(challenge)
  }
  return res.sendStatus(403)
})

// ---------- Incoming messages (POST) ----------

app.post('/webhook', async (req, res) => {
  res.sendStatus(200) // ack immediately so Meta doesn't retry

  try {
    const entry = req.body.entry?.[0]
    const change = entry?.changes?.[0]
    const message = change?.value?.messages?.[0]
    if (!message) return

    const from = message.from
    const text = (message.text?.body || '').trim()
    const lower = text.toLowerCase()

    let lang = getLanguage(from)
    const session = getSession(from)

    // First-ever contact: ask for a language before anything else.
    if (!lang && session.step === 'menu') {
      setSession(from, { step: 'language_select', draft: {} })
      await sendMessage(from, t('en', 'languagePrompt'))
      return
    }

    // "language" works as a global command once a language is set, same as "menu".
    if (lang && ['language', 'lang', 'yaren', 'ede', 'asụsụ'].includes(lower)) {
      setSession(from, { step: 'language_select', draft: {} })
      await sendMessage(from, t('en', 'languagePrompt'))
      return
    }

    if (session.step === 'language_select') {
      await handleLanguageSelect(from, text)
      return
    }

    // Global shortcut, available at any step once a language is chosen.
    if (['menu', 'restart', 'hi', 'hello', 'start'].includes(lower)) {
      clearSession(from)
      await sendMessage(from, t(lang, 'mainMenu'))
      return
    }

    switch (session.step) {
      case 'menu':
        await handleMenu(from, lang, text)
        break
      case 'report_type':
        await handleReportType(from, lang, text)
        break
      case 'report_location':
        await handleReportLocation(from, lang, text)
        break
      case 'report_agent':
        await handleReportAgent(from, lang, text)
        break
      case 'report_description':
        await handleReportDescription(from, lang, text)
        break
      case 'report_evidence':
        await handleReportEvidence(from, lang, message)
        break
      case 'search_query':
        await handleSearchQuery(from, lang, text)
        break
      case 'reply_report_id':
        await handleReplyReportId(from, lang, text)
        break
      case 'reply_role':
        await handleReplyRole(from, lang, text)
        break
      case 'reply_text':
        await handleReplyText(from, lang, text)
        break
      default:
        clearSession(from)
        await sendMessage(from, t(lang, 'mainMenu'))
    }
  } catch (err) {
    console.error('Webhook handler error:', err)
  }
})

// ---------- Language selection ----------

async function handleLanguageSelect(from, text) {
  const lang = LANGUAGES[text.trim()]
  if (!lang) {
    await sendMessage(from, t('en', 'languagePrompt'))
    return
  }
  setLanguage(from, lang)
  clearSession(from)
  await sendMessage(from, t(lang, 'mainMenu'))
}

// ---------- Main menu ----------

async function handleMenu(from, lang, text) {
  if (text === '1') {
    setSession(from, { step: 'report_type', draft: { evidenceUrls: [] } })
    await sendMessage(from, t(lang, 'reportTypeMenu'))
  } else if (text === '2') {
    setSession(from, { step: 'search_query', draft: {} })
    await sendMessage(from, t(lang, 'searchPrompt'))
  } else if (text === '3') {
    await sendMessage(from, t(lang, 'howItWorks'))
  } else if (text === '4') {
    setSession(from, { step: 'reply_report_id', draft: {} })
    await sendMessage(from, t(lang, 'replyReportIdPrompt'))
  } else if (text === '5') {
    setSession(from, { step: 'language_select', draft: {} })
    await sendMessage(from, t('en', 'languagePrompt'))
  } else {
    await sendMessage(from, `${t(lang, 'invalidChoice')}\n\n${t(lang, 'mainMenu')}`)
  }
}

// ---------- Report flow ----------

async function handleReportType(from, lang, text) {
  const label = PROBLEM_TYPE_KEYS[text]
  if (!label) {
    await sendMessage(from, t(lang, 'invalidChoice'))
    return
  }
  setSession(from, {
    step: 'report_location',
    draft: { type: PROBLEM_TYPE_CATEGORY[text], problemLabel: label, evidenceUrls: [] }
  })
  await sendMessage(from, t(lang, 'askLocation'))
}

async function handleReportLocation(from, lang, text) {
  if (!text) {
    await sendMessage(from, t(lang, 'askLocation'))
    return
  }
  const session = getSession(from)
  session.draft.locationText = text
  setSession(from, { step: 'report_agent', draft: session.draft })
  await sendMessage(from, t(lang, 'askAgent'))
}

async function handleReportAgent(from, lang, text) {
  const session = getSession(from)
  session.draft.agentName = text.toLowerCase() === 'skip' ? null : text
  setSession(from, { step: 'report_description', draft: session.draft })
  await sendMessage(from, t(lang, 'askDescription'))
}

async function handleReportDescription(from, lang, text) {
  if (!text || text.length < 5) {
    await sendMessage(from, t(lang, 'askDescription'))
    return
  }
  const session = getSession(from)
  session.draft.description = `${session.draft.problemLabel}: ${text}`
  setSession(from, { step: 'report_evidence', draft: session.draft })
  await sendMessage(from, t(lang, 'askEvidence'))
}

async function handleReportEvidence(from, lang, message) {
  const session = getSession(from)
  const text = (message.text?.body || '').trim().toLowerCase()
  const hasMedia = Boolean(message.image || message.document)

  if (hasMedia) {
    const mediaId = message.image?.id || message.document?.id
    try {
      const storagePath = await fetchAndStoreMedia(mediaId)
      session.draft.evidenceUrls.push(storagePath)
      setSession(from, { step: 'report_evidence', draft: session.draft })
      await sendMessage(from, t(lang, 'evidenceReceived'))
    } catch (err) {
      console.error('Evidence upload failed:', err.message)
      await sendMessage(
        from,
        `Sorry, that file couldn't be saved (${err.message.includes('FIREBASE_STORAGE_BUCKET') ? 'storage not configured' : 'upload error'}). ` +
          `Try another file, or type "done" to continue without it.`
      )
    }
    return
  }

  if (text === 'skip' || text === 'done') {
    await finalizeReport(from, lang, session)
    return
  }

  await sendMessage(from, t(lang, 'askEvidence'))
}

async function finalizeReport(from, lang, session) {
  const saved = await saveReport({
    type: session.draft.type,
    locationText: session.draft.locationText,
    agentName: session.draft.agentName,
    description: session.draft.description,
    evidenceUrls: session.draft.evidenceUrls || []
  })
  clearSession(from)
  await sendMessage(from, t(lang, 'reportSaved', { id: saved.id, link: APP_LINK }))
}

// ---------- Search flow ----------

async function handleSearchQuery(from, lang, text) {
  if (!text) {
    await sendMessage(from, t(lang, 'searchPrompt'))
    return
  }
  const results = await searchReports(text)
  clearSession(from)

  if (results.length === 0) {
    await sendMessage(from, t(lang, 'noResults', { query: text }))
    return
  }

  const lines = results
    .map((r, i) => {
      const label =
        r.type === 'agent' ? `Agent flagged: ${r.agentName || 'Unnamed'}` : `Land dispute: ${r.locationText}`
      return `${i + 1}. ${label} (${r.status}, reported ${r.dateReported})`
    })
    .join('\n')

  await sendMessage(
    from,
    `${results.length} report(s) found for "${text}":\n\n${lines}\n\nView full details: ${APP_LINK}\n\nReply "menu" for more options.`
  )
}

// ---------- Right-of-reply flow ----------

async function handleReplyReportId(from, lang, text) {
  const reportId = text.trim().replace(/^#/, '')
  const report = await getReportById(reportId)

  if (!report) {
    await sendMessage(from, t(lang, 'replyNotFound', { id: reportId }))
    return
  }

  const session = getSession(from)
  session.draft.reportId = reportId
  session.draft.reportLabel =
    report.type === 'agent' ? `Agent flagged: ${report.agentName || 'Unnamed'}` : `Land dispute: ${report.locationText}`
  setSession(from, { step: 'reply_role', draft: session.draft })

  await sendMessage(from, t(lang, 'replyFound', { label: session.draft.reportLabel }))
}

async function handleReplyRole(from, lang, text) {
  const roleMap = { '1': 'agent', '2': 'landowner' }
  const role = roleMap[text]
  if (!role) {
    await sendMessage(from, t(lang, 'invalidChoice'))
    return
  }
  const session = getSession(from)
  session.draft.role = role
  setSession(from, { step: 'reply_text', draft: session.draft })
  await sendMessage(from, t(lang, 'askReplyText'))
}

async function handleReplyText(from, lang, text) {
  if (!text || text.length < 5) {
    await sendMessage(from, t(lang, 'askReplyText'))
    return
  }
  const session = getSession(from)
  await addReplyByReportId(session.draft.reportId, session.draft.role, text, from)
  const label = session.draft.reportLabel
  clearSession(from)

  await sendMessage(from, t(lang, 'replySaved', { label, link: APP_LINK }))
}

// ---------- Start server ----------

const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`KeyCheck WhatsApp bot listening on port ${PORT}`)
})
