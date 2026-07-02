import { useEffect, useState } from 'react'
import { Flag, Check, ExternalLink } from 'lucide-react'
import { getListingFlags, resolveListingFlag, FLAG_REASON_LABELS } from '../lib/listingFlagsApi.js'

// Mirrors AdminPanel.jsx's search_misses tab (one-off fetch, admin-only,
// no realtime subscription needed for a queue this low-volume). The admin
// route (?admin=1) is a standalone sub-app with no listing-detail view of
// its own (see App.jsx's isAdminRoute branch, which renders only
// AdminPanel) — "view listing" opens the real public detail page in a new
// tab via a plain link rather than an in-app setView navigation.
export default function AdminListingFlags() {
  const [flags, setFlags] = useState(null)
  const [filter, setFilter] = useState('open')
  const [busyId, setBusyId] = useState(null)

  useEffect(() => {
    refresh()
  }, [])

  function refresh() {
    getListingFlags()
      .then(setFlags)
      .catch((err) => {
        console.warn('Failed to load listing flags:', err.message)
        setFlags([])
      })
  }

  async function handleResolve(id) {
    setBusyId(id)
    try {
      await resolveListingFlag(id)
      refresh()
    } catch (err) {
      alert('Failed to resolve: ' + err.message)
    } finally {
      setBusyId(null)
    }
  }

  const visible = flags?.filter((f) => (filter === 'all' ? true : f.status === filter)) || []

  return (
    <div>
      <div className="chip-row" style={{ marginBottom: 16 }}>
        <button className={`chip ${filter === 'open' ? 'active' : ''}`} onClick={() => setFilter('open')}>
          Open ({flags?.filter((f) => f.status === 'open').length ?? 0})
        </button>
        <button className={`chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          All ({flags?.length ?? 0})
        </button>
      </div>

      <div className="report-list">
        {flags === null ? (
          <p style={{ color: 'var(--ink-soft)' }}>Loading...</p>
        ) : visible.length === 0 ? (
          <div className="empty-state">
            <Flag size={24} />
            <p>Nothing to review.</p>
          </div>
        ) : (
          visible.map((f) => (
            <div key={f.id} className="detail-card" style={{ padding: '14px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                <div>
                  <p style={{ fontWeight: 700, margin: '0 0 4px' }}>{FLAG_REASON_LABELS[f.reason] || f.reason}</p>
                  {f.note && <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 8px' }}>{f.note}</p>}
                  <a
                    className="chip"
                    style={{ fontSize: 12, textDecoration: 'none' }}
                    href={`/?listing=${encodeURIComponent(f.listingId)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <ExternalLink size={12} /> View listing #{f.listingId}
                  </a>
                </div>
                {f.status === 'open' && (
                  <button
                    className="icon-btn"
                    style={{ width: 'auto', padding: '0 12px', fontSize: 12.5, fontWeight: 600, gap: 6, display: 'flex', alignItems: 'center' }}
                    onClick={() => handleResolve(f.id)}
                    disabled={busyId === f.id}
                  >
                    <Check size={13} /> Resolve
                  </button>
                )}
              </div>
              <p style={{ fontSize: 11, color: 'var(--ink-faint)', margin: '10px 0 0' }}>
                {new Date(f.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
