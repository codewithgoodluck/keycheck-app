import { useRef, useState } from 'react'
import { Send, MessageSquare } from 'lucide-react'
import { msUntilNextSubmit, markSubmitted } from '../lib/antispam.js'
import { createInquiry } from '../lib/inquiriesApi.js'

// The lightweight "in-app messaging" alternative — a one-off lead, not a
// conversation, so no buyer account is needed (see the plan this was
// built from). Has no moderation review step at all (unlike
// listings/reports), so the anti-spam guard matters more here, not less
// — reuses the same honeypot + cooldown pattern from SubmitReport.jsx.
const MIN_FILL_MS = 3000

export default function InquiryForm({ listing }) {
  const [buyerName, setBuyerName] = useState('')
  const [buyerContact, setBuyerContact] = useState('')
  const [message, setMessage] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const mountedAt = useRef(Date.now())

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!buyerName.trim() || !buyerContact.trim() || !message.trim()) return

    if (honeypot.trim()) return // bot filled the hidden field — drop silently

    if (Date.now() - mountedAt.current < MIN_FILL_MS) {
      setError('That was fast. Please take a moment to review before sending.')
      return
    }

    const wait = msUntilNextSubmit()
    if (wait > 0) {
      setError(`You can send again in ${Math.ceil(wait / 1000)}s. This limit helps keep spam down.`)
      return
    }

    setSubmitting(true)
    try {
      await createInquiry(listing.id, listing.listerId, listing.locationText, {
        buyerName: buyerName.trim(),
        buyerContact: buyerContact.trim(),
        message: message.trim()
      })
      markSubmitted()
      setSent(true)
    } catch (err) {
      setError('Failed to send: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (sent) {
    return (
      <div className="form-card" style={{ textAlign: 'center' }}>
        <p style={{ margin: 0 }}>Message sent. The lister will see it on their dashboard.</p>
      </div>
    )
  }

  return (
    <div className="form-card">
      <p style={{ margin: '0 0 16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
        <MessageSquare size={15} /> Send a message
      </p>
      <form onSubmit={handleSubmit}>
        <div
          aria-hidden="true"
          style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}
        >
          <label htmlFor="inquiry-website">Website</label>
          <input
            id="inquiry-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        <div className="field">
          <label htmlFor="inquiry-name">Your name</label>
          <input id="inquiry-name" type="text" value={buyerName} onChange={(e) => setBuyerName(e.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="inquiry-contact">Your phone or email</label>
          <input
            id="inquiry-contact"
            type="text"
            placeholder="So the lister can reach you back"
            value={buyerContact}
            onChange={(e) => setBuyerContact(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="inquiry-message">Message</label>
          <textarea
            id="inquiry-message"
            placeholder="I'm interested in this listing..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />
        </div>

        {error && <p style={{ color: 'var(--status-disputed)', fontSize: 13, fontWeight: 600, margin: '0 0 12px' }}>{error}</p>}

        <button className="submit-btn" type="submit" disabled={submitting}>
          <Send size={15} /> {submitting ? 'Sending...' : 'Send message'}
        </button>
      </form>
    </div>
  )
}
