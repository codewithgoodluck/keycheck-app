import { useEffect, useState } from 'react'
import { Star, Trash2, ShieldCheck } from 'lucide-react'
import { listAllReviews, setReviewStatus, deleteReview } from '../lib/reviewsApi.js'

// Reuses AdminPanel.jsx's list-management pattern (one-off fetch,
// admin-only) — same as AdminListingFlags.jsx. Reviews are a bigger
// fake-content target than fraud reports (anyone can claim to have
// rented a property), so this queue exists even though reviews show
// publicly right away, same posture as reports' moderation tab.
export default function AdminReviews() {
  const [reviews, setReviews] = useState(null)
  const [filter, setFilter] = useState('unverified')
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    refresh()
  }, [])

  function refresh() {
    listAllReviews()
      .then(setReviews)
      .catch((err) => {
        console.warn('Failed to load reviews:', err.message)
        setReviews([])
      })
  }

  async function handleVerify(id) {
    setBusyId(id)
    try {
      await setReviewStatus(id, 'verified')
      refresh()
    } catch (err) {
      alert('Failed to verify: ' + err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this review permanently?')) return
    setBusyId(id)
    try {
      await deleteReview(id)
      refresh()
    } catch (err) {
      alert('Failed to delete: ' + err.message)
    } finally {
      setBusyId(null)
    }
  }

  const visible = reviews?.filter((r) => (filter === 'all' ? true : r.status === filter)) || []

  return (
    <div>
      <div className="chip-row" style={{ marginBottom: 16 }}>
        <button className={`chip ${filter === 'unverified' ? 'active' : ''}`} onClick={() => setFilter('unverified')}>
          Unverified ({reviews?.filter((r) => r.status === 'unverified').length ?? 0})
        </button>
        <button className={`chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          All ({reviews?.length ?? 0})
        </button>
      </div>

      <div className="report-list">
        {reviews === null ? (
          <p style={{ color: 'var(--ink-soft)' }}>Loading...</p>
        ) : visible.length === 0 ? (
          <div className="empty-state">
            <Star size={24} />
            <p>Nothing to review.</p>
          </div>
        ) : (
          visible.map((r) => (
            <div key={r.id} className="detail-card" style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontWeight: 700, margin: '0 0 4px' }}>
                    {r.listerName} — {r.rating}★ ({r.transactionType})
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 6px' }}>{r.text}</p>
                  {r.verifiedProofNote && (
                    <p style={{ fontSize: 12, color: 'var(--ink-faint)', margin: 0 }}>Note: {r.verifiedProofNote}</p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {r.status !== 'verified' && (
                    <button
                      className="icon-btn"
                      style={{ width: 'auto', padding: '0 10px', fontSize: 12, fontWeight: 600, gap: 4, display: 'flex', alignItems: 'center' }}
                      onClick={() => handleVerify(r.id)}
                      disabled={busyId === r.id}
                    >
                      <ShieldCheck size={13} /> Verify
                    </button>
                  )}
                  <button
                    className="icon-btn"
                    onClick={() => handleDelete(r.id)}
                    disabled={busyId === r.id}
                    aria-label="Delete review"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <p style={{ fontSize: 11, color: 'var(--ink-faint)', margin: '10px 0 0' }}>
                {new Date(r.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
