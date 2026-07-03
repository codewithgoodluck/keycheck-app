import { useEffect, useState } from 'react'
import { Star, MessageSquareReply, Send, ShieldQuestion } from 'lucide-react'
import { getReviewsForLister, getReviewAggregate, submitReview, addReviewReply } from '../lib/reviewsApi.js'
import { msUntilNextSubmit, markSubmitted } from '../lib/antispam.js'

function Stars({ value, size = 14 }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1, color: '#eaa50d' }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={size} fill={n <= value ? 'currentColor' : 'none'} />
      ))}
    </span>
  )
}

const MIN_FILL_MS = 3000

// Deliberately never merged with the fraud-report system above it on
// AgentProfile.jsx — separate collection (lib/reviewsApi.js), separate
// visual block, own heading, own count. A review is a subjective
// transaction experience, not an allegation, and collapsing the two into
// one score would make a fraud flag mean less. Unverified reviews are
// shown immediately, clearly labeled — same posture as unverified reports.
export default function Reviews({ listerName }) {
  const [reviews, setReviews] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [rating, setRating] = useState(5)
  const [text, setText] = useState('')
  const [transactionType, setTransactionType] = useState('rented')
  const [verifiedProofNote, setVerifiedProofNote] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [replyDrafts, setReplyDrafts] = useState({}) // reviewId -> text
  const [replyingId, setReplyingId] = useState(null)

  useEffect(() => {
    setReviews(null)
    getReviewsForLister(listerName)
      .then(setReviews)
      .catch((err) => {
        console.warn('Failed to load reviews:', err.message)
        setReviews([])
      })
  }, [listerName])

  const { average, count } = getReviewAggregate(reviews)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (!text.trim() || text.trim().length < 10) {
      setError('Please write at least a short sentence (10+ characters).')
      return
    }
    if (honeypot.trim()) return

    const wait = msUntilNextSubmit()
    if (wait > 0) {
      setError(`You can submit again in ${Math.ceil(wait / 1000)}s. This limit helps keep spam down.`)
      return
    }

    setSubmitting(true)
    try {
      const saved = await submitReview(listerName, { rating, text, transactionType, verifiedProofNote })
      markSubmitted()
      setReviews((r) => [saved, ...(r || [])])
      setShowForm(false)
      setText('')
      setVerifiedProofNote('')
    } catch (err) {
      setError('Failed to submit review: ' + err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleReply(reviewId) {
    const draft = (replyDrafts[reviewId] || '').trim()
    if (!draft) return
    try {
      const reply = await addReviewReply(reviewId, { text: draft })
      setReviews((rs) => rs.map((r) => (r.id === reviewId ? { ...r, replies: [...(r.replies || []), reply] } : r)))
      setReplyDrafts((d) => ({ ...d, [reviewId]: '' }))
      setReplyingId(null)
    } catch (err) {
      alert('Failed to submit reply: ' + err.message)
    }
  }

  return (
    <div style={{ marginTop: 24 }}>
      <div className="results-meta">
        <span>
          {count > 0 ? (
            <>
              <Stars value={Math.round(average)} /> {average.toFixed(1)} across {count} review{count === 1 ? '' : 's'}
            </>
          ) : (
            'Reviews'
          )}
        </span>
        <button className="chip" onClick={() => setShowForm((s) => !s)}>
          {showForm ? 'Cancel' : 'Write a review'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="form-card" style={{ marginBottom: 16 }}>
          <div
            aria-hidden="true"
            style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', opacity: 0, pointerEvents: 'none' }}
          >
            <input type="text" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
          </div>
          <div className="field">
            <label htmlFor="rev-rating">Rating</label>
            <select id="rev-rating" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} star{n === 1 ? '' : 's'}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="rev-type">Transaction type</label>
            <select id="rev-type" value={transactionType} onChange={(e) => setTransactionType(e.target.value)}>
              <option value="rented">I rented from them</option>
              <option value="bought">I bought from them</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="rev-text">Your experience</label>
            <textarea
              id="rev-text"
              placeholder="What was it actually like dealing with them?"
              value={text}
              onChange={(e) => setText(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="rev-proof">Lease date, receipt reference, or similar (optional)</label>
            <input
              id="rev-proof"
              type="text"
              placeholder="Helps show this was a real transaction — kept as a note, not verified automatically"
              value={verifiedProofNote}
              onChange={(e) => setVerifiedProofNote(e.target.value)}
            />
          </div>
          {error && <p style={{ color: 'var(--status-disputed)', fontSize: 13, fontWeight: 600, margin: '0 0 12px' }}>{error}</p>}
          <button className="submit-btn" type="submit" disabled={submitting}>
            <Send size={15} /> {submitting ? 'Submitting...' : 'Submit review'}
          </button>
          <p className="disclaimer">
            Reviews are marked "unverified" until a moderator checks the transaction note, but appear
            immediately — same standard as reports.
          </p>
        </form>
      )}

      {reviews === null ? (
        <p style={{ color: 'var(--ink-soft)' }}>Loading reviews...</p>
      ) : reviews.length === 0 ? (
        <div className="empty-state">
          <Star size={24} />
          <p>No reviews yet. Be the first to share how it went.</p>
        </div>
      ) : (
        <div className="report-list">
          {reviews.map((r) => (
            <div key={r.id} className="detail-card" style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <Stars value={r.rating} />
                <span className="stamp-inline unverified">
                  <ShieldQuestion size={11} /> {r.status === 'verified' ? 'Verified transaction' : 'Unverified'}
                </span>
              </div>
              <p style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-faint)', margin: '0 0 6px' }}>
                {r.transactionType === 'bought' ? 'Bought' : 'Rented'}
              </p>
              <p style={{ fontSize: 13.5, lineHeight: 1.55, margin: '0 0 8px' }}>{r.text}</p>
              {r.verifiedProofNote && (
                <p style={{ fontSize: 12, color: 'var(--ink-faint)', margin: '0 0 8px' }}>Note: {r.verifiedProofNote}</p>
              )}

              {r.replies?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
                  {r.replies.map((reply) => (
                    <div key={reply.id} style={{ background: 'var(--paper)', borderRadius: 10, padding: '10px 12px' }}>
                      <p style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--ink-soft)', margin: '0 0 4px' }}>
                        Response from lister
                      </p>
                      <p style={{ fontSize: 13, margin: 0, lineHeight: 1.5 }}>{reply.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {replyingId === r.id ? (
                <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
                  <input
                    type="text"
                    placeholder="Respond publicly to this review..."
                    value={replyDrafts[r.id] || ''}
                    onChange={(e) => setReplyDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                    style={{ flex: 1, border: '1.5px solid var(--line)', borderRadius: 8, padding: '6px 10px', fontSize: 12.5 }}
                  />
                  <button className="chip" style={{ fontSize: 12 }} onClick={() => handleReply(r.id)}>
                    <Send size={12} /> Send
                  </button>
                </div>
              ) : (
                <button className="chip" style={{ fontSize: 12, marginTop: 8 }} onClick={() => setReplyingId(r.id)}>
                  <MessageSquareReply size={12} /> Reply as the lister
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
