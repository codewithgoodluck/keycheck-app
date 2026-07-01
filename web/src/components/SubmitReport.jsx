import { useRef, useState } from 'react'
import { MessageCircle, Send } from 'lucide-react'
import LocationPicker from './LocationPicker.jsx'
import { msUntilNextSubmit, markSubmitted } from '../lib/antispam.js'

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '2349000000000' // replace with your real WhatsApp Business number

// Anyone filling this in is a bot filling every field it finds — real users
// never see it (kept off-screen, not display:none, since some scrapers skip
// display:none). A real form submission never takes less than a few
// seconds, so MIN_FILL_MS catches instant scripted submissions too.
const MIN_FILL_MS = 3000

export default function SubmitReport({ addReport, setView }) {
  const [form, setForm] = useState({
    type: 'land',
    locationText: '',
    agentName: '',
    description: ''
  })
  const [pin, setPin] = useState(null)
  const [honeypot, setHoneypot] = useState('')
  const [error, setError] = useState('')
  const mountedAt = useRef(Date.now())

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
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

    await addReport({
      ...form,
      status: 'unverified',
      source: 'web_submission',
      evidenceUrls: [],
      upvotes: 0,
      lat: pin ? pin[0] : null,
      lng: pin ? pin[1] : null,
      dateReported: new Date().toISOString().slice(0, 10)
    })
    markSubmitted()
    setView('home')
  }

  return (
    <div className="form-wrap">
      <h1>Report a problem</h1>
      <p className="subtitle">
        Describe what happened. Your report is reviewed before it appears
        publicly, and you can stay anonymous.
      </p>

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
            <label htmlFor="type">What are you reporting?</label>
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
            <label htmlFor="description">What happened</label>
            <textarea
              id="description"
              placeholder="Briefly describe the dispute, double-sale, or fraud you experienced or know about."
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              required
            />
          </div>

          {error && (
            <p style={{ color: 'var(--red)', fontSize: 13, fontWeight: 600, margin: '0 0 12px' }}>{error}</p>
          )}

          <button className="submit-btn" type="submit">
            <Send size={15} /> Submit for review
          </button>

          <p className="disclaimer">
            Reports are marked "unverified" until reviewed and require
            supporting evidence before they're marked "verified." Naming
            someone publicly carries legal weight, please only report what
            you can support.
          </p>
        </form>
      </div>
    </div>
  )
}
