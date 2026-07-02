import { useRef, useState } from 'react'
import { Send, Paperclip, X } from 'lucide-react'
import { PROPERTY_TYPE_LABELS, SIZE_PROPERTY_TYPES } from '../data/propertyTypes.js'
import { NIGERIAN_STATES, DUAL_REP_LABELS } from '../data/verificationRules.js'
import { createListingAsLister, uploadListingPhoto } from '../lib/listingsApi.js'
import { msUntilNextSubmit, markSubmitted } from '../lib/antispam.js'
import FeeCapFactBox from './FeeCapFactBox.jsx'
import LocationPicker from './LocationPicker.jsx'

// Same honeypot + cooldown pattern as SubmitReport.jsx/InquiryForm.jsx —
// listings had neither, which made self-serve submission the one
// unprotected write path a spam script could hit repeatedly.
const MIN_FILL_MS = 3000

const EMPTY_FORM = {
  type: 'house',
  transactionType: 'rent',
  state: 'Lagos',
  locationText: '',
  price: '',
  sizeSqm: '',
  description: '',
  listerName: '',
  listerPhone: '',
  lasreraNumber: '',
  cacNumber: '',
  professionalIndemnityInsurance: false,
  agencyFeePercent: '',
  dualRepresentation: 'seller_only'
}

const SIZE_TYPES = SIZE_PROPERTY_TYPES

// Public self-service submission — adapted from AdminListings.jsx's form
// fields, plus a photo upload and a listerPhone field for the WhatsApp
// contact link on the detail page. Always lands as 'pending': the
// auto-block-flagged-agents check runs at moderator-activation time, not
// here (see listingsApi.js's activateListing()).
export default function SubmitListing({ listerUser, setView }) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [pin, setPin] = useState(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [honeypot, setHoneypot] = useState('')
  const fileInputRef = useRef(null)
  const mountedAt = useRef(Date.now())

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
        cacNumber: form.cacNumber.trim() || null,
        photoUrl,
        lat: pin ? pin[0] : null,
        lng: pin ? pin[1] : null
      })
      markSubmitted()
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
          <div
            aria-hidden="true"
            style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}
          >
            <label htmlFor="sl-website">Website</label>
            <input
              id="sl-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          <div className="field">
            <label htmlFor="sl-type">Property type</label>
            <select id="sl-type" value={form.type} onChange={(e) => update('type', e.target.value)}>
              {Object.entries(PROPERTY_TYPE_LABELS).map(([key, label]) => (
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
            <label>Pin the location on a map (optional)</label>
            <LocationPicker value={pin} onChange={setPin} />
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

          <div className="field">
            <label htmlFor="sl-cac">CAC registration number (optional)</label>
            <input
              id="sl-cac"
              type="text"
              placeholder="RC or BN number, if this is a registered company"
              value={form.cacNumber}
              onChange={(e) => update('cacNumber', e.target.value)}
            />
            <p className="field-hint">
              Self-reported, not independently verified by KeyCheck. Checkable by anyone against the
              Corporate Affairs Commission's public register.
            </p>
          </div>

          <label className="field-checkbox">
            <input
              type="checkbox"
              checked={form.professionalIndemnityInsurance}
              onChange={(e) => update('professionalIndemnityInsurance', e.target.checked)}
            />
            <span>
              I carry professional indemnity insurance. Voluntary — Nigerian law doesn't currently
              require this for real-estate practice, unlike some other countries.
            </span>
          </label>

          {error && <p style={{ color: 'var(--red)', fontSize: 13, fontWeight: 600, margin: '0 0 12px' }}>{error}</p>}

          <button className="submit-btn" type="submit" disabled={submitting}>
            <Send size={15} /> {submitting ? 'Submitting...' : 'Submit for review'}
          </button>
          <p className="field-hint" style={{ marginTop: 8 }}>
            By submitting, you agree to KeyCheck's{' '}
            <button type="button" onClick={() => setView('terms')} style={{ background: 'none', border: 'none', padding: 0, color: 'inherit', textDecoration: 'underline', cursor: 'pointer', font: 'inherit' }}>
              Terms of Service
            </button>
            .
          </p>
        </form>
      </div>
    </div>
  )
}
