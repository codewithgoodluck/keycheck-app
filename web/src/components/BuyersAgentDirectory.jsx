import { useEffect, useMemo, useState } from 'react'
import { Users, MessageCircle, Plus } from 'lucide-react'
import { NIGERIAN_STATES } from '../data/verificationRules.js'
import { getActiveBuyersAgentEntries } from '../lib/buyersAgentsApi.js'

// Public browse for the buyer's-agent directory — "As a diaspora buyer,
// I want an agent whose fee is paid by and loyalty is explicitly to me,
// not the seller." Every entry here already passed the same
// auto-block-flagged-agents check listings use (see
// lib/buyersAgentsApi.js's activateBuyersAgentEntry), not a
// self-declared claim taken at face value.
export default function BuyersAgentDirectory({ setView }) {
  const [entries, setEntries] = useState(null)
  const [stateFilter, setStateFilter] = useState('all')

  useEffect(() => {
    getActiveBuyersAgentEntries()
      .then(setEntries)
      .catch((err) => {
        console.warn('Failed to load buyer\'s-agent directory:', err.message)
        setEntries([])
      })
  }, [])

  const results = useMemo(() => {
    if (!entries) return []
    return stateFilter === 'all' ? entries : entries.filter((e) => e.state === stateFilter)
  }, [entries, stateFilter])

  return (
    <div className="theme-market">
      <section className="hero">
        <p className="eyebrow">
          <Users size={13} /> Buyer's-agent directory
        </p>
        <h1>Agents who represent you, not the seller.</h1>
        <p>
          Every agent here works for and is paid by the buyer — a different relationship than the
          agent listing a property, who typically represents the seller or landlord. Each entry has
          been reviewed and checked against KeyCheck's fraud registry before appearing here.
        </p>
        <div className="chip-row">
          <button className="chip active" onClick={() => setView('become-buyers-agent')}>
            <Plus size={13} /> Offer buyer's-agent services
          </button>
        </div>
      </section>

      <div className="chip-row" style={{ marginTop: 0, marginBottom: 4 }}>
        <button className={`chip ${stateFilter === 'all' ? 'active' : ''}`} onClick={() => setStateFilter('all')}>
          All states
        </button>
        {NIGERIAN_STATES.map((s) => (
          <button key={s} className={`chip ${stateFilter === s ? 'active' : ''}`} onClick={() => setStateFilter(s)}>
            {s}
          </button>
        ))}
      </div>

      <div className="results-meta">
        <span>{results.length} agent{results.length === 1 ? '' : 's'}</span>
      </div>

      {entries === null ? (
        <p style={{ color: 'var(--ink-soft)' }}>Loading...</p>
      ) : results.length > 0 ? (
        <div className="report-list">
          {results.map((entry) => {
            const waNumber = (entry.listerPhone || '').replace(/[^0-9]/g, '')
            return (
              <div key={entry.id} className="detail-card" style={{ padding: '16px 20px' }}>
                <p style={{ fontWeight: 700, margin: '0 0 4px' }}>{entry.listerName}</p>
                <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 10px' }}>{entry.state}</p>
                {entry.feeNote && <p style={{ fontSize: 13.5, margin: '0 0 12px', lineHeight: 1.5 }}>{entry.feeNote}</p>}
                {waNumber && (
                  <a
                    href={`https://wa.me/${waNumber}`}
                    target="_blank"
                    rel="noreferrer"
                    className="chip active"
                    style={{ textDecoration: 'none', display: 'inline-flex' }}
                  >
                    <MessageCircle size={13} /> Contact on WhatsApp
                  </a>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="empty-state">
          <Users size={28} />
          <p>No buyer's agents listed for this filter yet.</p>
          <button onClick={() => setView('become-buyers-agent')}>Offer buyer's-agent services</button>
        </div>
      )}
    </div>
  )
}
