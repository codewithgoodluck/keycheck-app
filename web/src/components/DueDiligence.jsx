import { useState } from 'react'
import { Landmark, Users, Home, Building2, Building, ExternalLink, ShieldQuestion, BookOpen, ListOrdered, Plane } from 'lucide-react'
import { CHECKLISTS } from '../data/checklists.js'
import { getChecked, toggleChecked } from '../lib/checklistProgress.js'
import FeeCapFactBox from './FeeCapFactBox.jsx'
import VerifyAgentNudge from './VerifyAgentNudge.jsx'
import RiskQuiz from './RiskQuiz.jsx'
import FraudSchemes from './FraudSchemes.jsx'
import TransactionGuide from './TransactionGuide.jsx'
import DiasporaGuidance from './DiasporaGuidance.jsx'

const CATEGORIES = [
  { key: 'land', label: 'Buying land', Icon: Landmark },
  { key: 'agent', label: 'Using a land agent', Icon: Users },
  { key: 'house_agent', label: 'Renting through an agent', Icon: Home },
  { key: 'landlord', label: 'Renting directly from a landlord', Icon: Building },
  { key: 'estate', label: 'Buying from an estate/developer', Icon: Building2 }
]

export default function DueDiligence({ setView }) {
  const [category, setCategory] = useState(null)
  const [mode, setMode] = useState('checklist') // 'checklist' | 'quiz' | 'guide'
  const [checked, setChecked] = useState([])
  const [showSchemes, setShowSchemes] = useState(false)
  const [showDiaspora, setShowDiaspora] = useState(false)

  // Also used directly as FraudSchemes.jsx's onJumpToChecklist callback —
  // its "Caught by" link jumps straight to a category's checklist. No
  // App.jsx-level navigation needed since FraudSchemes renders inside
  // this component, not as a separate top-level view.
  function selectCategory(key) {
    setCategory(key)
    setChecked(getChecked(key))
    setMode('checklist')
    setShowSchemes(false)
    setShowDiaspora(false)
  }

  function handleToggle(itemId) {
    setChecked(toggleChecked(category, itemId))
  }

  const items = category ? CHECKLISTS[category] : []
  const isRental = category === 'house_agent' || category === 'landlord'

  return (
    <div className="form-wrap">
      <div className="page-banner">
        <h1>Before you pay</h1>
        <p>
          A checklist and a quick risk check, built from patterns in real reported fraud cases.
          Use these before you commit to anything, not just after something's gone wrong.
        </p>
      </div>

      {!category && !showSchemes && !showDiaspora ? (
        <div className="form-card">
          <p style={{ margin: '0 0 16px', fontWeight: 600 }}>What are you about to do?</p>
          <div className="diligence-category-grid">
            {CATEGORIES.map(({ key, label, Icon }) => (
              <button key={key} className="diligence-category-btn" onClick={() => selectCategory(key)}>
                <Icon size={22} />
                {label}
              </button>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 16 }}>
            <button className="chip" onClick={() => setShowSchemes(true)}>
              <BookOpen size={13} /> Browse known fraud schemes instead
            </button>
            <button className="chip" onClick={() => setShowDiaspora(true)}>
              <Plane size={13} /> Buying from abroad? Diaspora guidance
            </button>
          </div>
        </div>
      ) : showSchemes ? (
        <>
          <button className="detail-back" onClick={() => setShowSchemes(false)}>
            Choose a different situation
          </button>
          <FraudSchemes onJumpToChecklist={selectCategory} />
        </>
      ) : showDiaspora ? (
        <>
          <button className="detail-back" onClick={() => setShowDiaspora(false)}>
            Choose a different situation
          </button>
          <DiasporaGuidance setView={setView} />
        </>
      ) : (
        <>
          <button className="detail-back" onClick={() => setCategory(null)}>
            Choose a different situation
          </button>

          <div className="chip-row" style={{ marginBottom: 16 }}>
            <button className={`chip ${mode === 'checklist' ? 'active' : ''}`} onClick={() => setMode('checklist')}>
              Checklist
            </button>
            <button className={`chip ${mode === 'guide' ? 'active' : ''}`} onClick={() => setMode('guide')}>
              <ListOrdered size={13} /> Step-by-step guide
            </button>
            <button className={`chip ${mode === 'quiz' ? 'active' : ''}`} onClick={() => setMode('quiz')}>
              <ShieldQuestion size={13} /> Risk quiz
            </button>
          </div>

          {mode === 'checklist' ? (
            <div className="form-card">
              <p className="results-meta" style={{ margin: '0 0 16px' }}>
                <span>
                  {checked.length} of {items.length} checked
                </span>
              </p>

              {isRental && (
                <div style={{ marginBottom: 18 }}>
                  <VerifyAgentNudge />
                  <div style={{ height: 10 }} />
                  <FeeCapFactBox />
                </div>
              )}

              <div className="checklist">
                {items.map((item) => (
                  <label key={item.id} className="checklist-item">
                    <input type="checkbox" checked={checked.includes(item.id)} onChange={() => handleToggle(item.id)} />
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
            </div>
          ) : mode === 'guide' ? (
            <TransactionGuide category={category} checked={checked} onToggle={handleToggle} />
          ) : (
            <RiskQuiz />
          )}
        </>
      )}
    </div>
  )
}
