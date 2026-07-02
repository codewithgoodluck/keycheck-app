import { useEffect, useState } from 'react'
import { Send } from 'lucide-react'
import { NIGERIAN_STATES } from '../data/verificationRules.js'
import { createBuyersAgentEntry, getMyBuyersAgentEntry } from '../lib/buyersAgentsApi.js'

const EMPTY_FORM = { listerName: '', listerPhone: '', state: 'Lagos', feeNote: '' }

// Self-serve submission, mirrors SubmitListing.jsx's shape but simpler —
// no photo, no fee-cap-checked numeric field (no equivalent regulation
// exists for buyer's-agent fees, so feeNote stays free text the agent
// describes themselves, not a claim requiring a source). Always lands
// 'pending' — the auto-block-flagged-agents check runs at moderator
// activation time (see lib/buyersAgentsApi.js).
export default function BecomeBuyersAgent({ listerUser, setView }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [existing, setExisting] = useState(null) // undefined-until-checked, then entry or null

  useEffect(() => {
    if (!listerUser) return
    getMyBuyersAgentEntry(listerUser.uid)
      .then(setExisting)
      .catch((err) => console.warn('Failed to check existing buyer\'s-agent entry:', err.message))
  }, [listerUser])

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!listerUser) {
      setError('Please sign in first.')
      return
    }
    if (!form.listerName.trim() || !form.listerPhone.trim()) return

    setSubmitting(true)
    try {
      await createBuyersAgentEntry(listerUser.uid, {
        listerName: form.listerName.trim(),
        listerPhone: form.listerPhone.trim(),
        state: form.state,
        feeNote: form.feeNote.trim()
      })
      setSubmitted(true)
    } catch (err) {
      setError('Failed to submit: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (!listerUser) {
    return (
      <div className="empty-state">
        <p>Sign in to list yourself as a buyer's agent.</p>
        <button onClick={() => setView('lister-auth')}>Sign in</button>
      </div>
    )
  }

  if (existing) {
    return (
      <div className="empty-state">
        <p>
          You already have a buyer's-agent entry ({existing.status}
          {existing.blockedReason ? ` — ${existing.blockedReason}` : ''}).
        </p>
        <button onClick={() => setView('buyers-agent-directory')}>View directory</button>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="form-wrap">
        <div className="empty-state">
          <p>Submitted — it's now pending review and will appear in the directory once a moderator approves it.</p>
          <button onClick={() => setView('buyers-agent-directory')}>View directory</button>
        </div>
      </div>
    )
  }

  return (
    <div className="form-wrap">
      <h1>Offer buyer's-agent services</h1>
      <p className="subtitle">
        List yourself in KeyCheck's buyer's-agent directory — for buyers who want someone whose fee is
        paid by and loyalty is explicitly to them, not the seller.
      </p>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="ba-name">Your name or company name</label>
            <input id="ba-name" type="text" value={form.listerName} onChange={(e) => update('listerName', e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="ba-phone">WhatsApp/phone number for inquiries</label>
            <input
              id="ba-phone"
              type="tel"
              placeholder="234..."
              value={form.listerPhone}
              onChange={(e) => update('listerPhone', e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="ba-state">State you operate in</label>
            <select id="ba-state" value={form.state} onChange={(e) => update('state', e.target.value)}>
              {NIGERIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="ba-fee">How you charge (optional)</label>
            <textarea
              id="ba-fee"
              placeholder="e.g. 1% of purchase price, paid by the buyer"
              value={form.feeNote}
              onChange={(e) => update('feeNote', e.target.value)}
            />
            <p className="field-hint">Shown to buyers browsing the directory — describe your fee structure in your own words.</p>
          </div>

          {error && <p style={{ color: 'var(--red)', fontSize: 13, fontWeight: 600, margin: '0 0 12px' }}>{error}</p>}

          <button className="submit-btn" type="submit" disabled={submitting}>
            <Send size={15} /> {submitting ? 'Submitting...' : 'Submit for review'}
          </button>
        </form>
      </div>
    </div>
  )
}
