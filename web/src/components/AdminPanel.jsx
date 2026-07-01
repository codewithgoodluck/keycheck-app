import { useEffect, useState } from 'react'
import { LogOut, Trash2, ShieldCheck, Link2, Plus, Search } from 'lucide-react'
import { getReportTitle } from '../lib/format.js'
import {
  adminLogout,
  setReportStatus,
  deleteReport,
  setReplyFields,
  deleteReply,
  addSourceLink,
  removeSourceLink,
  getRecentSearchMisses
} from '../lib/adminApi.js'

const STATUS_OPTIONS = ['unverified', 'disputed', 'verified']

export default function AdminPanel({ reports, adminEmail }) {
  const [filter, setFilter] = useState('needs_review')
  const [busyId, setBusyId] = useState(null)
  const [sourceDrafts, setSourceDrafts] = useState({}) // reportId -> { label, url }
  const [searchMisses, setSearchMisses] = useState(null) // null = not loaded yet

  const visible =
    filter === 'needs_review' ? reports.filter((r) => r.status !== 'verified' || r.replies?.length) : reports

  useEffect(() => {
    if (filter !== 'search_misses' || searchMisses !== null) return
    getRecentSearchMisses()
      .then(setSearchMisses)
      .catch((err) => {
        console.warn('Failed to load search misses:', err.message)
        setSearchMisses([])
      })
  }, [filter, searchMisses])

  function updateDraft(reportId, field, value) {
    setSourceDrafts((d) => ({ ...d, [reportId]: { ...d[reportId], [field]: value } }))
  }

  async function handleAddSource(reportId) {
    const draft = sourceDrafts[reportId]
    if (!draft?.url?.trim()) return
    try {
      await addSourceLink(reportId, { label: draft.label?.trim() || draft.url.trim(), url: draft.url.trim() })
      setSourceDrafts((d) => ({ ...d, [reportId]: { label: '', url: '' } }))
    } catch (err) {
      alert('Failed to add source (is Firebase configured?): ' + err.message)
    }
  }

  async function handleRemoveSource(reportId, index) {
    try {
      await removeSourceLink(reportId, index)
    } catch (err) {
      alert('Failed to remove source (is Firebase configured?): ' + err.message)
    }
  }

  async function handleStatusChange(reportId, status) {
    setBusyId(reportId)
    try {
      await setReportStatus(reportId, status)
    } catch (err) {
      alert('Failed to update status (is Firebase configured?): ' + err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleDeleteReport(reportId) {
    if (!confirm('Delete this report permanently? This cannot be undone.')) return
    setBusyId(reportId)
    try {
      await deleteReport(reportId)
    } catch (err) {
      alert('Failed to delete (is Firebase configured?): ' + err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function handleReplyStatusChange(reportId, replyId, status) {
    try {
      await setReplyFields(reportId, replyId, { status })
    } catch (err) {
      alert('Failed to update reply status (is Firebase configured?): ' + err.message)
    }
  }

  async function handleToggleIdentity(reportId, replyId, current) {
    try {
      await setReplyFields(reportId, replyId, { identityVerified: !current })
    } catch (err) {
      alert('Failed to update identity status (is Firebase configured?): ' + err.message)
    }
  }

  async function handleDeleteReply(reportId, replyId) {
    if (!confirm('Delete this reply permanently?')) return
    try {
      await deleteReply(reportId, replyId)
    } catch (err) {
      alert('Failed to delete reply (is Firebase configured?): ' + err.message)
    }
  }

  return (
    <div style={{ padding: '28px 0 60px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontWeight: 800, letterSpacing: '-0.02em', fontSize: 26, margin: '0 0 4px' }}>Moderation panel</h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: 13.5, margin: 0 }}>Signed in as {adminEmail}</p>
        </div>
        <button
          className="icon-btn"
          style={{ width: 'auto', padding: '0 14px', fontSize: 13, fontWeight: 600, gap: 6, display: 'flex', alignItems: 'center' }}
          onClick={adminLogout}
        >
          <LogOut size={15} /> Sign out
        </button>
      </div>

      <div className="chip-row" style={{ marginBottom: 20 }}>
        <button className={`chip ${filter === 'needs_review' ? 'active' : ''}`} onClick={() => setFilter('needs_review')}>
          Needs review ({reports.filter((r) => r.status !== 'verified' || r.replies?.length).length})
        </button>
        <button className={`chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>
          All reports ({reports.length})
        </button>
        <button className={`chip ${filter === 'search_misses' ? 'active' : ''}`} onClick={() => setFilter('search_misses')}>
          <Search size={12} /> Search misses
        </button>
      </div>

      {filter === 'search_misses' ? (
        <div className="report-list">
          {searchMisses === null ? (
            <p style={{ color: 'var(--ink-soft)' }}>Loading...</p>
          ) : searchMisses.length === 0 ? (
            <div className="empty-state">
              <p>No zero-result searches logged yet.</p>
            </div>
          ) : (
            searchMisses.map((m) => (
              <div
                key={m.id}
                className="detail-card"
                style={{ padding: '12px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
              >
                <span style={{ fontSize: 14, fontWeight: 600 }}>"{m.query}"</span>
                <span style={{ fontSize: 12, color: 'var(--ink-faint)', whiteSpace: 'nowrap' }}>
                  {new Date(m.at).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>
      ) : (
      <div className="report-list">
        {visible.map((report) => (
          <div key={report.id} className="detail-card" style={{ padding: '18px 20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
              <div>
                <p className="card-id">#{report.id}</p>
                <h3 style={{ fontWeight: 700, letterSpacing: '-0.01em', fontSize: 16, margin: '4px 0 8px' }}>
                  {getReportTitle(report)}
                </h3>
              </div>
              <button
                className="icon-btn"
                onClick={() => handleDeleteReport(report.id)}
                disabled={busyId === report.id}
                aria-label="Delete report"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--ink-soft)', lineHeight: 1.5, margin: '0 0 12px' }}>
              {report.description}
            </p>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16 }}>
              <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--ink-soft)' }}>Status</label>
              <select
                value={report.status}
                onChange={(e) => handleStatusChange(report.id, e.target.value)}
                disabled={busyId === report.id}
                style={{
                  border: '1.5px solid var(--line)',
                  borderRadius: 8,
                  padding: '6px 10px',
                  fontSize: 13,
                  background: 'var(--paper)'
                }}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14, marginBottom: report.replies?.length ? 16 : 0 }}>
              <p style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-faint)', margin: '0 0 10px', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Link2 size={12} /> Additional verified sources ({report.additionalSources?.length || 0})
              </p>

              {report.additionalSources?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                  {report.additionalSources.map((src, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}>
                      <a href={src.url} target="_blank" rel="noreferrer" style={{ color: 'var(--green)', textDecoration: 'underline', wordBreak: 'break-all' }}>
                        {src.label}
                      </a>
                      <button
                        className="icon-btn"
                        style={{ width: 24, height: 24, flexShrink: 0 }}
                        onClick={() => handleRemoveSource(report.id, i)}
                        aria-label="Remove source"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  placeholder="Label (e.g. Punch follow-up)"
                  value={sourceDrafts[report.id]?.label || ''}
                  onChange={(e) => updateDraft(report.id, 'label', e.target.value)}
                  style={{ flex: '1 1 160px', border: '1.5px solid var(--line)', borderRadius: 8, padding: '6px 10px', fontSize: 12.5, background: 'var(--paper)' }}
                />
                <input
                  type="url"
                  placeholder="https://... (verify it resolves before adding)"
                  value={sourceDrafts[report.id]?.url || ''}
                  onChange={(e) => updateDraft(report.id, 'url', e.target.value)}
                  style={{ flex: '2 1 220px', border: '1.5px solid var(--line)', borderRadius: 8, padding: '6px 10px', fontSize: 12.5, background: 'var(--paper)' }}
                />
                <button
                  className="chip"
                  style={{ fontSize: 12, display: 'flex', alignItems: 'center', gap: 4 }}
                  onClick={() => handleAddSource(report.id)}
                >
                  <Plus size={13} /> Add
                </button>
              </div>
            </div>

            {report.replies?.length > 0 && (
              <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <p style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-faint)', margin: 0 }}>
                  Replies ({report.replies.length})
                </p>
                {report.replies.map((reply) => (
                  <div key={reply.id} style={{ background: 'var(--paper)', borderRadius: 10, padding: 12 }}>
                    <p style={{ fontSize: 13, margin: '0 0 10px', lineHeight: 1.5 }}>{reply.text}</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                      <select
                        value={reply.status}
                        onChange={(e) => handleReplyStatusChange(report.id, reply.id, e.target.value)}
                        style={{ border: '1.5px solid var(--line)', borderRadius: 8, padding: '5px 8px', fontSize: 12.5, background: '#fff' }}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                      <button
                        className={`chip ${reply.identityVerified ? 'active' : ''}`}
                        style={{ fontSize: 12 }}
                        onClick={() => handleToggleIdentity(report.id, reply.id, reply.identityVerified)}
                      >
                        <ShieldCheck /> {reply.identityVerified ? 'Identity confirmed' : 'Confirm identity'}
                      </button>
                      <span style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>
                        via {reply.channel}
                        {reply.channel === 'whatsapp' && reply.phoneLast4 ? ` •••${reply.phoneLast4}` : ''}
                      </span>
                      <button
                        className="icon-btn"
                        style={{ width: 30, height: 30, marginLeft: 'auto' }}
                        onClick={() => handleDeleteReply(report.id, reply.id)}
                        aria-label="Delete reply"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}

        {visible.length === 0 && (
          <div className="empty-state">
            <p>Nothing needs review right now.</p>
          </div>
        )}
      </div>
      )}
    </div>
  )
}
