import { useEffect, useState } from 'react'
import { ShieldCheck, ShieldAlert, ShieldX, Clock, MessageCircle } from 'lucide-react'
import { listBuyersAgentEntries, activateBuyersAgentEntry, rejectBuyersAgentEntry } from '../lib/buyersAgentsApi.js'

const STATUS_ICON = { active: ShieldCheck, pending: Clock, rejected: ShieldX }

// Moderation queue only — no create form here, unlike AdminListings.jsx.
// Buyer's-agent entries are always self-serve (BecomeBuyersAgent.jsx);
// there's no Milestone-1-style admin-direct-creation path to mirror for
// this one, since it was built after self-serve accounts already existed.
export default function AdminBuyersAgents() {
  const [entries, setEntries] = useState(null)

  useEffect(() => {
    refresh()
  }, [])

  function refresh() {
    listBuyersAgentEntries()
      .then(setEntries)
      .catch((err) => {
        console.warn('Failed to load buyer\'s-agent entries:', err.message)
        setEntries([])
      })
  }

  async function handleActivate(entry) {
    try {
      const result = await activateBuyersAgentEntry(entry.id, entry.listerName)
      if (!result.activated) {
        alert(`Not activated: "${entry.listerName}" has an active disputed/verified fraud report — the entry was rejected instead.`)
      }
      refresh()
    } catch (err) {
      alert('Failed to activate: ' + err.message)
    }
  }

  async function handleReject(id) {
    const reason = prompt('Reason for rejecting this entry (shown to the agent):')
    if (reason === null) return
    try {
      await rejectBuyersAgentEntry(id, reason)
      refresh()
    } catch (err) {
      alert('Failed to reject: ' + err.message)
    }
  }

  return (
    <div className="report-list">
      {entries === null ? (
        <p style={{ color: 'var(--ink-soft)' }}>Loading...</p>
      ) : entries.length === 0 ? (
        <div className="empty-state">
          <p>No buyer's-agent entries yet.</p>
        </div>
      ) : (
        entries.map((entry) => {
          const Icon = STATUS_ICON[entry.status] || Clock
          return (
            <div key={entry.id} className="detail-card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <p style={{ fontWeight: 700, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {entry.listerName}
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: 0, display: 'flex', alignItems: 'center', gap: 4 }}>
                    {entry.state} <MessageCircle size={12} style={{ marginLeft: 6 }} /> {entry.listerPhone}
                  </p>
                </div>
                <span className={`stamp-inline ${entry.status === 'active' ? 'verified' : entry.status === 'rejected' ? 'disputed' : 'unverified'}`}>
                  <Icon /> {entry.status}
                </span>
              </div>
              {entry.blockedReason && (
                <p style={{ fontSize: 12.5, color: 'var(--red)', margin: '0 0 8px' }}>{entry.blockedReason}</p>
              )}
              {entry.feeNote && <p style={{ fontSize: 13, margin: '0 0 8px' }}>{entry.feeNote}</p>}
              {entry.status === 'pending' && (
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button className="chip" onClick={() => handleActivate(entry)}>
                    Activate (make publicly visible)
                  </button>
                  <button className="chip" onClick={() => handleReject(entry.id)}>
                    Reject
                  </button>
                </div>
              )}
            </div>
          )
        })
      )}
    </div>
  )
}
