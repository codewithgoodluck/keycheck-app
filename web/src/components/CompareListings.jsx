import { useState } from 'react'
import { ArrowLeft, X } from 'lucide-react'
import { getPropertyTypeLabel, SIZE_PROPERTY_TYPES } from '../data/propertyTypes.js'
import { getCompareIds, removeFromCompare } from '../lib/compareList.js'
import VerificationBadge from './VerificationBadge.jsx'
import FeeComplianceNote from './FeeComplianceNote.jsx'

const SIZE_TYPES = SIZE_PROPERTY_TYPES

const ROWS = [
  { label: 'Price', render: (l) => `₦${Number(l.price).toLocaleString()}` },
  {
    label: 'Price/sqm',
    render: (l) => (SIZE_TYPES.includes(l.type) && l.sizeSqm > 0 ? `₦${Math.round(l.price / l.sizeSqm).toLocaleString()}` : '—')
  },
  { label: 'Location', render: (l) => `${l.locationText}, ${l.state}` },
  { label: 'For sale/rent', render: (l) => (l.transactionType === 'rent' ? 'Rent' : 'Sale') },
  { label: 'Verification', render: (l) => <VerificationBadge state={l.state} lasreraNumber={l.lasreraNumber} lasreraVerified={l.lasreraVerified} /> },
  {
    label: 'Fee compliance',
    render: (l) => (
      <FeeComplianceNote
        state={l.state}
        transactionType={l.transactionType}
        agencyFeePercent={l.agencyFeePercent}
        dualRepresentation={l.dualRepresentation}
      />
    )
  }
]

// Receives the already-subscribed `listings` array (same one
// ListingsBrowse.jsx/ListingDetail.jsx already get) rather than a new
// Firestore query, and reads the compare-id selection from
// lib/compareList.js itself. A selected id that's scrolled out of the
// loaded window or gone inactive since selection is silently skipped,
// not treated as an error.
export default function CompareListings({ listings, setView }) {
  const [compareIds, setCompareIds] = useState(() => getCompareIds())
  const selected = compareIds.map((id) => listings.find((l) => l.id === id)).filter(Boolean)

  function handleRemove(id) {
    setCompareIds(removeFromCompare(id))
  }

  if (selected.length === 0) {
    return (
      <div className="empty-state">
        <p>No listings selected to compare.</p>
        <button onClick={() => setView('listings')}>Browse listings</button>
      </div>
    )
  }

  return (
    <>
      <button className="detail-back" onClick={() => setView('listings')}>
        <ArrowLeft size={15} /> Back to listings
      </button>

      <div className="saved-header">
        <h1>Compare listings</h1>
        <p>
          {selected.length} listing{selected.length === 1 ? '' : 's'} side by side — price, location,
          verification, and fee compliance, so you're not juggling separate tabs.
        </p>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 480 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '10px 12px', fontSize: 12, color: 'var(--ink-faint)' }}></th>
              {selected.map((l) => (
                <th key={l.id} style={{ padding: '10px 12px', minWidth: 180, verticalAlign: 'top' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{getPropertyTypeLabel(l.type)}</span>
                    <button className="icon-btn" style={{ width: 24, height: 24 }} onClick={() => handleRemove(l.id)} aria-label="Remove from compare">
                      <X size={12} />
                    </button>
                  </div>
                  {l.photoUrl && (
                    <img
                      src={l.photoUrl}
                      alt=""
                      style={{ width: '100%', height: 90, objectFit: 'cover', borderRadius: 'var(--radius-sm)', margin: '8px 0' }}
                    />
                  )}
                  <button className="chip active" style={{ marginTop: 4 }} onClick={() => setView('listing-detail', l)}>
                    View details
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.label} style={{ borderTop: '1px solid var(--line)' }}>
                <td style={{ padding: '10px 12px', fontSize: 12, fontWeight: 700, color: 'var(--ink-faint)', whiteSpace: 'nowrap' }}>
                  {row.label}
                </td>
                {selected.map((l) => (
                  <td key={l.id} style={{ padding: '10px 12px', fontSize: 13.5, verticalAlign: 'top' }}>
                    {row.render(l)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
