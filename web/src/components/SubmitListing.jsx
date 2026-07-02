import { useRef, useState } from 'react'
import { Send, Paperclip, X } from 'lucide-react'
import { TYPE_LABELS } from '../lib/format.js'
import { NIGERIAN_STATES, DUAL_REP_LABELS } from '../data/verificationRules.js'
import { createListingAsLister, uploadListingPhoto } from '../lib/listingsApi.js'
import FeeCapFactBox from './FeeCapFactBox.jsx'

const EMPTY_FORM = {
  type: 'house_agent',
  transactionType: 'rent',
  state: 'Lagos',
  locationText: '',
  price: '',
  sizeSqm: '',
  description: '',
  listerName: '',
  listerPhone: '',
  lasreraNumber: '',
  agencyFeePercent: '',
  dualRepresentation: 'seller_only'
}

const SIZE_TYPES = ['land', 'estate']

// Public self-service submission — adapted from AdminListings.jsx's form
// fields, plus a photo upload and a listerPhone field for the WhatsApp
// contact link on the detail page. Always lands as 'pending': the
// auto-block-flagged-agents check runs at moderator-activation time, not
// here (see listingsApi.js's activateListing()).
export default function SubmitListing({ listerUser, setView }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [photoFile, setPhotoFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const fileInputRef = useRef(null)

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
    if (!file.type.startsWith('image/')) {
      setError('Only image files are accepted.')
      return
    }
    setError('')
    setPhotoFile(file)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!listerUser) {
      setError('Please sign in first.')
      return
    }
    if (
      !form.locationText.trim() ||
      !form.description.trim() ||
      !form.listerName.trim() ||
      !form.listerPhone.trim() ||
      !form.price ||
      form.agencyFeePercent === '' ||
      (SIZE_TYPES.includes(form.type) && !form.sizeSqm)
    ) {
      return
    }

    setSubmitting(true)
    try {
      let photoUrl = null
      if (photoFile) {
        try {
          photoUrl = await uploadListingPhoto(photoFile)
        } catch (err) {
          setError(`Photo upload failed: ${err.message}. You can remove it and submit without a photo.`)
          setSubmitting(false)
          return
        }
      }

      await createListingAsLister(listerUser.uid, form.listerPhone.trim(), {
        ...form,
        price: Number(form.price),
        sizeSqm: SIZE_TYPES.includes(form.type) ? Number(form.sizeSqm) : null,
        agencyFeePercent: Number(form.agencyFeePercent),
        lasreraNumber: form.lasreraNumber.trim() || null,
        photoUrl
      })
      setSubmitted(true)
    } catch (err) {
      const hint = err.message.toLowerCase().includes('permission')
        ? " If you're signed in as a KeyCheck moderator/admin account, that account can't submit through this public form by design — use the admin panel's Listings tab instead, or sign out here and create a separate lister account."
        : ''
      setError('Failed to submit listing: ' + err.message + hint)
    } finally {
      setSubmitting(false)
    }
  }

  if (!listerUser) {
    return (
      <div className="empty-state">
        <p>Sign in to list a property.</p>
        <button onClick={() => setView('lister-auth')}>Sign in</button>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="form-wrap">
        <div className="empty-state">
          <p>Listing submitted — it's now pending review and will appear publicly once a moderator approves it.</p>
          <button onClick={() => setView('my-listings')}>View my listings</button>
        </div>
      </div>
    )
  }

  return (
    <div className="form-wrap">
      <h1>List a property</h1>
      <p className="subtitle">Every listing is reviewed before it goes live — this usually takes a moderator a short while.</p>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="sl-type">Type</label>
            <select id="sl-type" value={form.type} onChange={(e) => update('type', e.target.value)}>
              {Object.entries(TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="sl-transactionType">For sale or for rent?</label>
            <select id="sl-transactionType" value={form.transactionType} onChange={(e) => update('transactionType', e.target.value)}>
              <option value="rent">For rent</option>
              <option value="sale">For sale</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="sl-state">State</label>
            <select id="sl-state" value={form.state} onChange={(e) => update('state', e.target.value)}>
              {NIGERIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="sl-location">Location</label>
            <input
              id="sl-location"
              type="text"
              placeholder="e.g. Off Abijo GRA, Lekki-Epe Expressway"
              value={form.locationText}
              onChange={(e) => update('locationText', e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="sl-price">Price (₦)</label>
            <input id="sl-price" type="number" min="0" value={form.price} onChange={(e) => update('price', e.target.value)} required />
          </div>

          {SIZE_TYPES.includes(form.type) && (
            <div className="field">
              <label htmlFor="sl-sizeSqm">Size (square meters)</label>
              <input
                id="sl-sizeSqm"
                type="number"
                min="0"
                value={form.sizeSqm}
                onChange={(e) => update('sizeSqm', e.target.value)}
                required
              />
              <p className="field-hint">Used to show a price-per-sqm comparison against similar listings.</p>
            </div>
          )}

          {form.state === 'Lagos' && (
            <div style={{ marginBottom: 16 }}>
              <FeeCapFactBox />
            </div>
          )}

          <div className="field">
            <label htmlFor="sl-agencyFee">Agency fee (% of {form.transactionType === 'rent' ? 'total rent' : 'sale price'})</label>
            <input
              id="sl-agencyFee"
              type="number"
              min="0"
              step="0.1"
              value={form.agencyFeePercent}
              onChange={(e) => update('agencyFeePercent', e.target.value)}
              required
            />
            <p className="field-hint">Enter 0 if no agent is involved.</p>
          </div>

          <div className="field">
            <label htmlFor="sl-dualRep">Who do you represent in this transaction?</label>
            <select id="sl-dualRep" value={form.dualRepresentation} onChange={(e) => update('dualRepresentation', e.target.value)}>
              {Object.entries(DUAL_REP_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label htmlFor="sl-description">Description</label>
            <textarea id="sl-description" value={form.description} onChange={(e) => update('description', e.target.value)} required />
          </div>

          <div className="field">
            <label>Photo (optional)</label>
            {photoFile ? (
              <div className="evidence-picked">
                <Paperclip size={14} /> {photoFile.name}
                <button type="button" onClick={() => { setPhotoFile(null); if (fileInputRef.current) fileInputRef.current.value = '' }} aria-label="Remove photo">
                  <X size={13} />
                </button>
              </div>
            ) : (
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} />
            )}
            <p className="field-hint">A clear photo of the property (max 10MB). Publicly visible once your listing is approved.</p>
          </div>

          <div className="field">
            <label htmlFor="sl-listerName">Your name or company name</label>
            <input
              id="sl-listerName"
              type="text"
              value={form.listerName}
              onChange={(e) => update('listerName', e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="sl-listerPhone">WhatsApp/phone number for inquiries</label>
            <input
              id="sl-listerPhone"
              type="tel"
              placeholder="234..."
              value={form.listerPhone}
              onChange={(e) => update('listerPhone', e.target.value)}
              required
            />
          </div>
          {form.state === 'Lagos' && (
            <div className="field">
              <label htmlFor="sl-lasrera">LASRERA registration number (optional)</label>
              <input
                id="sl-lasrera"
                type="text"
                value={form.lasreraNumber}
                onChange={(e) => update('lasreraNumber', e.target.value)}
              />
            </div>
          )}

          {error && <p style={{ color: 'var(--red)', fontSize: 13, fontWeight: 600, margin: '0 0 12px' }}>{error}</p>}

          <button className="submit-btn" type="submit" disabled={submitting}>
            <Send size={15} /> {submitting ? 'Submitting...' : 'Submit for review'}
          </button>
        </form>
      </div>
    </div>
  )
}
