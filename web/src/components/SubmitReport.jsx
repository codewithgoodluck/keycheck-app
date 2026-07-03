import { useRef, useState } from 'react'
import { MessageCircle, Send, ShieldCheck, ShieldAlert, Paperclip, X } from 'lucide-react'
import LocationPicker from './LocationPicker.jsx'
import { msUntilNextSubmit, markSubmitted } from '../lib/antispam.js'
import { addMySubmittedReportId, getMySubmittedReportIds } from '../lib/contributions.js'
import { uploadEvidence } from '../lib/reportsApi.js'

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '2349000000000' // replace with your real WhatsApp Business number

// Anyone filling this in is a bot filling every field it finds — real users
// never see it (kept off-screen, not display:none, since some scrapers skip
// display:none). A real form submission never takes less than a few
// seconds, so MIN_FILL_MS catches instant scripted submissions too.
const MIN_FILL_MS = 3000

// Minimum evidentiary bar — mirrors firestore.rules' hasMinimumEvidence()
// exactly, so a validation failure here matches what the backend would
// reject anyway. Enforced there too (not just here) since client-side
// checks are trivially bypassable via a direct API call.
const MIN_DESCRIPTION_FOR_NO_EVIDENCE = 60

const COPY = {
  flag: {
    heading: 'Your report protects the next person.',
    // "Stay anonymous if you need to" (the brand guideline's draft
    // copy) no longer describes what actually happens — reporting now
    // requires an account (see the sign-in gate above). Kept the rest
    // of the guideline's voice (protective, not alarmist) but swapped
    // that one clause for what's actually true: honest about certainty
    // is the guideline's own rule.
    subtitle:
      "Two minutes now can save someone else a lifetime's savings. Your account isn't shown to other visitors — the warning still counts.",
    descriptionLabel: 'What happened',
    descriptionPlaceholder: 'Briefly describe the dispute, double-sale, or fraud you experienced or know about.',
    submitLabel: 'Submit for review',
    disclaimer:
      'Reports are marked "unverified" until reviewed and require supporting evidence before they\'re marked "verified." Naming someone publicly carries legal weight, please only report what you can support.',
    confirmationLabel: (n) => `Report submitted — you've now helped submit ${n} report${n === 1 ? '' : 's'}.`
  },
  endorsement: {
    heading: "Give credit where it's earned.",
    subtitle:
      'Had a good experience? Say so. Trustworthy agents deserve a track record too, not just a search that comes up empty.',
    descriptionLabel: 'What happened',
    descriptionPlaceholder: 'Describe your positive experience — what you bought/rented, roughly when, and any details others would find reassuring.',
    submitLabel: 'Submit vouch',
    disclaimer:
      'Vouches are marked "unverified" until reviewed, same as reports — this keeps the standard consistent in both directions.',
    confirmationLabel: (n) => `Vouch submitted — you've now helped submit ${n} report${n === 1 ? '' : 's'}.`
  }
}

export default function SubmitReport({ addReport, setView, listerUser }) {
  const [kind, setKind] = useState('flag')
  const [form, setForm] = useState({
    type: 'land',
    locationText: '',
    agentName: '',
    description: '',
    sourceUrl: ''
  })
  const [pin, setPin] = useState(null)
  const [evidenceFile, setEvidenceFile] = useState(null)
  const [attested, setAttested] = useState(false)
  const [honeypot, setHoneypot] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submittedCount, setSubmittedCount] = useState(null)
  const mountedAt = useRef(Date.now())
  const fileInputRef = useRef(null)

  const copy = COPY[kind]
  const hasMinimumEvidence =
    Boolean(evidenceFile) || form.sourceUrl.trim().length > 0 || form.description.trim().length >= MIN_DESCRIPTION_FOR_NO_EVIDENCE

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size >= 10 * 1024 * 1024) {
      setError('File is too large (max 10MB).')
      return
    }
    if (!/^image\/|^application\/pdf$/.test(file.type)) {
      setError('Only images or PDF files are accepted as evidence.')
      return
    }
    setError('')
    setEvidenceFile(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!form.locationText.trim() || !form.description.trim()) return

    if (honeypot.trim()) return // bot filled the hidden field — drop silently, no error to tip it off

    if (Date.now() - mountedAt.current < MIN_FILL_MS) {
      setError('That was fast — please take a moment to review before submitting.')
      return
    }

    const wait = msUntilNextSubmit()
    if (wait > 0) {
      setError(`You can submit again in ${Math.ceil(wait / 1000)}s. This limit helps keep spam down.`)
      return
    }

    if (!attested) {
      setError('Please confirm the attestation checkbox before submitting.')
      return
    }

    if (!hasMinimumEvidence) {
      setError(
        `Add at least one of: a photo/document, a link to a news article or public record, or a more detailed description (${MIN_DESCRIPTION_FOR_NO_EVIDENCE}+ characters).`
      )
      return
    }

    setSubmitting(true)
    try {
      let evidenceUrls = []
      if (evidenceFile) {
        try {
          const path = await uploadEvidence(evidenceFile)
          evidenceUrls = [path]
        } catch (err) {
          setError(`Evidence upload failed: ${err.message}. You can remove it and submit without, if you have a source link instead.`)
          setSubmitting(false)
          return
        }
      }

      const saved = await addReport({
        ...form,
        sourceUrl: form.sourceUrl.trim(),
        kind,
        status: 'unverified',
        source: 'web_submission',
        evidenceUrls,
        attestedAccuracy: true,
        upvotes: 0,
        submitterId: listerUser.uid,
        lat: pin ? pin[0] : null,
        lng: pin ? pin[1] : null,
        dateReported: new Date().toISOString().slice(0, 10)
      })
      markSubmitted()
      if (saved?.id) addMySubmittedReportId(saved.id)
      setSubmittedCount(getMySubmittedReportIds().length)
    } finally {
      setSubmitting(false)
    }
  }

  if (!listerUser) {
    return (
      <div className="form-wrap">
        <div className="page-banner">
          <h1>Sign in to continue</h1>
          <p>Reporting a problem or vouching for a clean transaction now requires an account.</p>
        </div>
        <div className="empty-state">
          <p>
            An account attributes reports to you internally (so a moderator can follow up if needed)
            and keeps a simple spam deterrent in place — it's never shown to other visitors.
          </p>
          <button onClick={() => setView('lister-auth')}>Sign in</button>
        </div>
      </div>
    )
  }

  if (submittedCount !== null) {
    return (
      <div className={`form-wrap ${kind === 'endorsement' ? 'theme-market' : ''}`}>
        <div className="empty-state">
          {kind === 'flag' ? <ShieldAlert size={28} /> : <ShieldCheck size={28} />}
          <p>{copy.confirmationLabel(submittedCount)}</p>
          <button onClick={() => setView('home')}>Back to search</button>
        </div>
      </div>
    )
  }

  return (
    <div className={`form-wrap ${kind === 'endorsement' ? 'theme-market' : ''}`}>
      <div className={`page-banner ${kind === 'endorsement' ? 'page-banner-market' : ''}`}>
        <h1>{copy.heading}</h1>
        <p>{copy.subtitle}</p>
      </div>

      <div className="chip-row" style={{ marginBottom: 20 }}>
        <button type="button" className={`chip ${kind === 'flag' ? 'active' : ''}`} onClick={() => setKind('flag')}>
          <ShieldAlert /> Report a problem
        </button>
        <button type="button" className={`chip ${kind === 'endorsement' ? 'active' : ''}`} onClick={() => setKind('endorsement')}>
          <ShieldCheck /> Vouch for a clean transaction
        </button>
      </div>

      <div className="whatsapp-note">
        <MessageCircle size={18} />
        <span>
          <strong>Faster on your phone?</strong> Message{' '}
          <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer">
            our WhatsApp number
          </a>{' '}
          and reply "Hi" to report a problem in under a minute, no form-filling needed.
        </span>
      </div>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div
            aria-hidden="true"
            style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}
          >
            <label htmlFor="website">Website</label>
            <input
              id="website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="type">{kind === 'flag' ? 'What are you reporting?' : 'Who or what is this about?'}</label>
            <select id="type" value={form.type} onChange={(e) => update('type', e.target.value)}>
              <option value="land">A specific plot of land</option>
              <option value="agent">A land sales agent</option>
              <option value="house_agent">A rental/letting agent</option>
              <option value="landlord">A landlord</option>
              <option value="estate">An estate or property developer</option>
            </select>
          </div>

          <div className="field">
            <label htmlFor="locationText">Location (area, street, or landmark)</label>
            <input
              id="locationText"
              type="text"
              placeholder="e.g. Off Abijo GRA, Lekki-Epe Expressway"
              value={form.locationText}
              onChange={(e) => update('locationText', e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label>Pin the location on a map (optional)</label>
            <LocationPicker value={pin} onChange={setPin} />
          </div>

          <div className="field">
            <label htmlFor="agentName">Name of agent, landlord, developer, or company (optional)</label>
            <input
              id="agentName"
              type="text"
              placeholder="Leave blank if not applicable"
              value={form.agentName}
              onChange={(e) => update('agentName', e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="description">{copy.descriptionLabel}</label>
            <textarea
              id="description"
              placeholder={copy.descriptionPlaceholder}
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="sourceUrl">Link to a news article, police report, or other public record (optional)</label>
            <input
              id="sourceUrl"
              type="url"
              placeholder="https://..."
              value={form.sourceUrl}
              onChange={(e) => update('sourceUrl', e.target.value)}
            />
          </div>

          <div className="field">
            <label>Supporting evidence — photo or document (optional)</label>
            {evidenceFile ? (
              <div className="evidence-picked">
                <Paperclip size={14} /> {evidenceFile.name}
                <button type="button" onClick={() => { setEvidenceFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }} aria-label="Remove file">
                  <X size={13} />
                </button>
              </div>
            ) : (
              <input ref={fileInputRef} type="file" accept="image/*,application/pdf" onChange={handleFileChange} />
            )}
            <p className="field-hint">
              A photo, receipt, or document (max 10MB). Kept private — visible only to moderators, never shown publicly.
            </p>
          </div>

          <label className="field-checkbox">
            <input type="checkbox" checked={attested} onChange={(e) => setAttested(e.target.checked)} />
            <span>
              I confirm this happened to me or someone I know, this description is accurate to my knowledge, and I
              can provide evidence if asked.
            </span>
          </label>

          {error && (
            <p style={{ color: 'var(--status-disputed)', fontSize: 13, fontWeight: 600, margin: '0 0 12px' }}>{error}</p>
          )}

          <button className="submit-btn" type="submit" disabled={submitting}>
            <Send size={15} /> {submitting ? 'Submitting...' : copy.submitLabel}
          </button>

          <p className="disclaimer">{copy.disclaimer}</p>
        </form>
      </div>
    </div>
  )
}
