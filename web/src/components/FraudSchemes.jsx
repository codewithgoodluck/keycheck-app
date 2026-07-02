import { useState } from 'react'
import { ChevronDown, ChevronUp, AlertTriangle, ArrowRight } from 'lucide-react'
import { FRAUD_SCHEMES } from '../data/fraudSchemes.js'
import { CHECKLISTS } from '../data/checklists.js'
import { TYPE_LABELS } from '../lib/format.js'

const CATEGORY_FILTERS = [
  { key: 'all', label: 'All categories' },
  { key: 'land', label: TYPE_LABELS.land },
  { key: 'agent', label: TYPE_LABELS.agent },
  { key: 'house_agent', label: TYPE_LABELS.house_agent },
  { key: 'landlord', label: TYPE_LABELS.landlord },
  { key: 'estate', label: TYPE_LABELS.estate }
]

// Resolves the checklist item's live text at render time (see
// data/fraudSchemes.js's header comment) rather than duplicating it —
// checklists.js stays the single source of truth for checklist copy.
function resolveCatchText(scheme) {
  const item = CHECKLISTS[scheme.catchCategory]?.find((i) => i.id === scheme.catchItemId)
  return item?.text || null
}

export default function FraudSchemes({ onJumpToChecklist }) {
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [expandedId, setExpandedId] = useState(null)

  const schemes = categoryFilter === 'all' ? FRAUD_SCHEMES : FRAUD_SCHEMES.filter((s) => s.category === categoryFilter)

  return (
    <div>
      <div className="chip-row" style={{ marginBottom: 16 }}>
        {CATEGORY_FILTERS.map(({ key, label }) => (
          <button key={key} className={`chip ${categoryFilter === key ? 'active' : ''}`} onClick={() => setCategoryFilter(key)}>
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {schemes.map((scheme) => {
          const expanded = expandedId === scheme.id
          const catchText = resolveCatchText(scheme)
          return (
            <div key={scheme.id} className="detail-card" style={{ padding: '16px 20px' }}>
              <button
                onClick={() => setExpandedId(expanded ? null : scheme.id)}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  width: '100%',
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  textAlign: 'left',
                  cursor: 'pointer'
                }}
              >
                <div>
                  <p style={{ fontWeight: 700, margin: '0 0 4px' }}>{scheme.name}</p>
                  <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: 0 }}>{scheme.summary}</p>
                </div>
                {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>

              {expanded && (
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
                  <p style={{ fontSize: 13.5, lineHeight: 1.6, margin: '0 0 12px' }}>{scheme.howItWorks}</p>

                  <p style={{ fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-faint)', margin: '0 0 8px', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <AlertTriangle size={12} /> Red flags
                  </p>
                  <ul style={{ margin: '0 0 14px', paddingLeft: 18 }}>
                    {scheme.redFlags.map((flag, i) => (
                      <li key={i} style={{ fontSize: 13, marginBottom: 4, lineHeight: 1.5 }}>{flag}</li>
                    ))}
                  </ul>

                  {catchText && (
                    <button
                      className="chip active"
                      onClick={() => onJumpToChecklist(scheme.catchCategory)}
                    >
                      Caught by: "{catchText}" <ArrowRight size={13} />
                    </button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
