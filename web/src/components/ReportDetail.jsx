import { useState } from 'react'
import { ArrowLeft, Share2, Bookmark, Users, MapPin, FileText, Link2, ShieldQuestion, Send, MessageSquareReply, Flag } from 'lucide-react'
import { StampInline } from './Stamp.jsx'
import { hasConfirmed, markConfirmed, getConfirmedIds } from '../lib/confirms.js'
import { getReportTitle } from '../lib/format.js'
import { showToast } from '../lib/toast.js'
import VerifyAgentNudge from './VerifyAgentNudge.jsx'
import FeeCapFactBox from './FeeCapFactBox.jsx'

// Distinct from the right-of-reply flow above: right-of-reply is for
// publicly rebutting a report (stays visible, labeled unverified); this
// is a direct formal takedown/dispute request to a moderator, which
// matters for notice-and-takedown-style legal posture even if rarely used.
const DISPUTE_EMAIL = 'goodluckmordi44@gmail.com'

export default function ReportDetail({ report, setView, saved, onToggleSave, onConfirm, onAddReply }) {
  const [confirmed, setConfirmed] = useState(() => (report ? hasConfirmed(report.id) : false))
  const [showReplyForm, setShowReplyForm] = useState(false)
  const [replyRole, setReplyRole] = useState('agent')
  const [replyText, setReplyText] = useState('')
  const [submittingReply, setSubmittingReply] = useState(false)
  const [replySubmitted, setReplySubmitted] = useState(false)

  if (!report) {
    return (
      <div className="empty-state">
        <p>Report not found.</p>
        <button onClick={() => setView('home')}>Back to search</button>
      </div>
    )
  }

  const title = getReportTitle(report)
  const isRentalType = report.type === 'house_agent' || report.type === 'landlord'
  const isLagos = report.locationText?.toLowerCase().includes('lagos')
  const showRentalNudge = isRentalType && isLagos

  const disputeMailto = `mailto:${DISPUTE_EMAIL}?subject=${encodeURIComponent(
    `Dispute report #${report.id} — ${title}`
  )}&body=${encodeURIComponent(
    `I am requesting review/removal of KeyCheck report #${report.id} (${title}).\n\nLink: ${window.location.origin}/?report=${report.id}\n\nReason:\n`
  )}`

  function handleConfirm() {
    if (confirmed) return
    markConfirmed(report.id)
    setConfirmed(true)
    const count = getConfirmedIds().length
    showToast(`Thanks — you've confirmed ${count} report${count === 1 ? '' : 's'}, helping warn others.`, 'success')
    onConfirm(report.id)
  }

  async function handleSubmitReply(e) {
    e.preventDefault()
    if (!replyText.trim() || submittingReply) return
    setSubmittingReply(true)
    try {
      await onAddReply(report.id, { role: replyRole, text: replyText.trim() })
      setReplyText('')
      setShowReplyForm(false)
      setReplySubmitted(true)
    } finally {
      setSubmittingReply(false)
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}/?report=${report.id}`
    const shareData = { title: 'KeyCheck report', text: title, url }
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch {
        // user cancelled, no-op
      }
    } else {
      await navigator.clipboard.writeText(url)
      showToast('Link copied to clipboard', 'success')
    }
  }

  return (
    <>
      <button className="detail-back" onClick={() => setView('home')}>
        <ArrowLeft size={15} /> Back to search
      </button>

      {showRentalNudge && (
        <div style={{ marginBottom: 16 }}>
          <VerifyAgentNudge />
          <div style={{ height: 10 }} />
          <FeeCapFactBox />
        </div>
      )}

      <div className="detail-card">
        <div className="detail-header">
          <div>
            <p className="card-id">#{report.id}</p>
            <h1>{title}</h1>
            <StampInline status={report.status} />
            {report.agentName && (
              <button
                className="chip"
                style={{ marginTop: 8, display: 'inline-flex' }}
                onClick={() => setView('profile', report.agentName)}
              >
                View all reports about this name
              </button>
            )}
          </div>
          <div className="detail-actions">
            <button className="icon-btn" onClick={handleShare} aria-label="Share">
              <Share2 size={17} />
            </button>
            <button
              className={`icon-btn ${saved ? 'saved' : ''}`}
              onClick={() => onToggleSave(report.id)}
              aria-label={saved ? 'Remove from saved' : 'Save'}
            >
              <Bookmark size={17} />
            </button>
          </div>
        </div>

        <div className="confirm-bar">
          <span className="confirm-text">
            <strong>{report.upvotes || 0}</strong> {report.upvotes === 1 ? 'person has' : 'people have'} confirmed a similar experience
          </span>
          <button className={`confirm-btn ${confirmed ? 'confirmed' : ''}`} onClick={handleConfirm}>
            <Users size={14} />
            {confirmed ? 'Confirmed' : 'I had this too'}
          </button>
        </div>

        <div className="detail-section">
          <h4><MapPin /> Location</h4>
          <p>{report.locationText}</p>
        </div>

        <div className="detail-section">
          <h4><FileText /> What was reported</h4>
          <p>{report.description}</p>
        </div>

        {report.evidenceUrls?.length > 0 && (
          <div className="detail-section">
            <h4>Evidence submitted</h4>
            <div className="evidence-grid">
              {report.evidenceUrls.map((url, i) => (
                <div key={i}>File {i + 1}</div>
              ))}
            </div>
          </div>
        )}

        <div className="detail-section">
          <h4><Link2 /> Source</h4>
          <p>
            {report.source === 'public_news'
              ? 'Sourced from public reporting'
              : report.source === 'community_submission'
              ? 'Submitted by a community member'
              : report.source === 'whatsapp'
              ? 'Submitted via WhatsApp'
              : 'Submitted via web form'}
            {' · '}Reported {report.dateReported}
            {report.sourceUrl && (
              <>
                {' · '}
                <a href={report.sourceUrl} target="_blank" rel="noreferrer">
                  View source
                </a>
              </>
            )}
          </p>
          {report.additionalSources?.length > 0 && (
            <ul style={{ margin: '10px 0 0', paddingLeft: 18 }}>
              {report.additionalSources.map((src, i) => (
                <li key={i} style={{ fontSize: 14, marginBottom: 4 }}>
                  <a href={src.url} target="_blank" rel="noreferrer">
                    {src.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

        {report.replies?.length > 0 && (
          <div className="detail-section">
            <h4><MessageSquareReply /> Response from named party</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {report.replies.map((reply) => (
                <div
                  key={reply.id}
                  style={{
                    border: '1px solid var(--line)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '14px 16px',
                    background: 'var(--paper)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--ink-soft)' }}>
                      {reply.role === 'agent' ? 'Named agent/company' : 'Named landowner'}
                    </span>
                    <StampInline status={reply.status} />
                  </div>
                  <p style={{ margin: '0 0 10px', fontSize: 14, lineHeight: 1.55 }}>{reply.text}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {reply.identityVerified ? (
                      <span className="stamp-inline verified">
                        <ShieldQuestion /> Identity confirmed by moderator
                      </span>
                    ) : reply.channel === 'whatsapp' ? (
                      <span className="stamp-inline unverified">
                        Sent via WhatsApp number ending •••{reply.phoneLast4 || '????'}
                      </span>
                    ) : (
                      <span className="stamp-inline unverified">Identity not verified — submitted via web form</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="detail-section">
          <h4><ShieldQuestion /> Are you the named party?</h4>

          {replySubmitted && !showReplyForm ? (
            <p>Your reply has been submitted and now appears above, marked unverified until reviewed.</p>
          ) : showReplyForm ? (
            <form onSubmit={handleSubmitReply}>
              <div className="field">
                <label htmlFor="replyRole">Your relationship to this report</label>
                <select id="replyRole" value={replyRole} onChange={(e) => setReplyRole(e.target.value)}>
                  <option value="agent">I am the named agent or company</option>
                  <option value="landowner">I am the named landowner</option>
                </select>
              </div>
              <div className="field">
                <label htmlFor="replyText">Your response</label>
                <textarea
                  id="replyText"
                  placeholder="Explain your side. This appears publicly alongside the report."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  required
                />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="submit-btn" type="submit" disabled={submittingReply}>
                  <Send size={15} /> {submittingReply ? 'Submitting...' : 'Submit reply'}
                </button>
                <button
                  type="button"
                  className="icon-btn"
                  style={{ width: 'auto', padding: '0 16px', fontSize: 13.5, fontWeight: 600 }}
                  onClick={() => setShowReplyForm(false)}
                >
                  Cancel
                </button>
              </div>
              <p className="disclaimer">
                Your reply is reviewed before it's marked verified, but appears immediately,
                clearly labeled as unverified, so your side of the story isn't delayed.
              </p>
            </form>
          ) : (
            <>
              <p>
                If you believe this report is inaccurate, you can submit a right of
                reply. It will appear publicly alongside the report, marked unverified
                until reviewed.
              </p>
              <p style={{ fontSize: 13, color: 'var(--ink-soft)', marginTop: -6 }}>
                Replying from WhatsApp instead carries more weight, since it's tied to a
                real phone number rather than a typed name.
              </p>
              <button className="confirm-btn" style={{ marginTop: 4 }} onClick={() => setShowReplyForm(true)}>
                <MessageSquareReply size={14} /> Submit a reply
              </button>
            </>
          )}
        </div>

        <div className="detail-section">
          <h4><Flag /> Formal dispute or removal request</h4>
          <p>
            A right-of-reply lets you respond publicly. If instead you believe this report is
            false and should be reviewed for removal, contact a moderator directly.
          </p>
          <a href={disputeMailto} className="chip" style={{ display: 'inline-flex', marginTop: 4 }}>
            <Flag size={13} /> Email a moderator about report #{report.id}
          </a>
        </div>
      </div>
    </>
  )
}
