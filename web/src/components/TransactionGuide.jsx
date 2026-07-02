import { AlertTriangle, ExternalLink } from 'lucide-react'
import { TRANSACTION_STAGES, AFTER_PAYMENT_TIPS } from '../data/transactionStages.js'
import { CHECKLISTS } from '../data/checklists.js'
import { FRAUD_SCHEMES } from '../data/fraudSchemes.js'

// Reuses DueDiligence.jsx's own checklist-completion state directly (via
// props) rather than a separate copy, so checking an item here stays in
// sync with the flat checklist view. Reorganizes the same verified
// content (checklist items, fraud-scheme red flags) by transaction
// sequence — resolved at render time, nothing duplicated.
export default function TransactionGuide({ category, checked, onToggle }) {
  const stages = TRANSACTION_STAGES[category] || []
  const items = CHECKLISTS[category] || []

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {stages.map((stage, index) => {
        const stageItems = stage.itemIds.map((id) => items.find((i) => i.id === id)).filter(Boolean)
        const stageSchemes = FRAUD_SCHEMES.filter((s) => s.catchCategory === category && stage.itemIds.includes(s.catchItemId))

        return (
          <div key={stage.key} className="detail-card" style={{ padding: '16px 20px' }}>
            <p style={{ fontWeight: 700, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  display: 'inline-flex',
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: 'var(--ink)',
                  color: 'var(--paper)',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  flexShrink: 0
                }}
              >
                {index + 1}
              </span>
              {stage.label}
            </p>

            <div className="checklist" style={{ marginBottom: stageSchemes.length ? 12 : 0 }}>
              {stageItems.map((item) => (
                <label key={item.id} className="checklist-item">
                  <input type="checkbox" checked={checked.includes(item.id)} onChange={() => onToggle(item.id)} />
                  <span>
                    {item.text}
                    {item.externalLink && (
                      <>
                        {' '}
                        <a href={item.externalLink.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                          {item.externalLink.label} <ExternalLink size={11} />
                        </a>
                        {item.lagosOnly && <span className="lagos-only-tag">Lagos only</span>}
                      </>
                    )}
                  </span>
                </label>
              ))}
            </div>

            {stageSchemes.map((scheme) => (
              <p key={scheme.id} className="fee-note fee-note-warning" style={{ margin: '0 0 4px' }}>
                <AlertTriangle size={13} /> Known scam at this stage: <strong>{scheme.name}</strong> — {scheme.summary}
              </p>
            ))}
          </div>
        )
      })}

      <div className="detail-card" style={{ padding: '16px 20px' }}>
        <p style={{ fontWeight: 700, margin: '0 0 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              display: 'inline-flex',
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'var(--ink)',
              color: 'var(--paper)',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              flexShrink: 0
            }}
          >
            {stages.length + 1}
          </span>
          After you pay
        </p>
        <ul style={{ margin: 0, paddingLeft: 18 }}>
          {AFTER_PAYMENT_TIPS.map((tip, i) => (
            <li key={i} style={{ fontSize: 13.5, marginBottom: 6, lineHeight: 1.5 }}>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
