import { ExternalLink, ScrollText, Video, AlertTriangle, Info, Users } from 'lucide-react'
import { POA_FACTS, POA_ABROAD_TIP, REMOTE_VERIFICATION_TIPS } from '../data/diasporaGuidance.js'
import { FRAUD_SCHEMES } from '../data/fraudSchemes.js'

// Every sourced claim here was researched before being written (see the
// plan this was built from) — never asserted from general knowledge the
// way LASRERA/Tenancy Law content elsewhere in the app never was either.
// One thing (the exact witnessing requirement for a POA signed abroad)
// couldn't be confirmed against a single reliable source, so it's
// rendered visually distinct from the sourced facts below, as advice to
// confirm directly rather than a citation.
export default function DiasporaGuidance({ setView }) {
  const remoteScamScheme = FRAUD_SCHEMES.find((s) => s.id === 'remote-no-inspection')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="detail-card" style={{ padding: '16px 20px' }}>
        <p style={{ fontWeight: 700, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Users size={16} /> Want someone repping only you?
        </p>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 12px' }}>
          A regular agent typically represents the seller or landlord, even when dealing directly
          with you. KeyCheck's buyer's-agent directory lists agents whose fee is paid by and
          loyalty is explicitly to the buyer — vetted against the same fraud registry as listings.
        </p>
        <button className="chip active" onClick={() => setView('buyers-agent-directory')}>
          <Users size={13} /> Browse buyer's agents
        </button>
      </div>

      <div className="detail-card" style={{ padding: '16px 20px' }}>
        <p style={{ fontWeight: 700, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <ScrollText size={16} /> Power of Attorney — what it actually means
        </p>
        <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 14px' }}>
          If you're buying from abroad, you'll likely need someone in Nigeria acting on your
          behalf. Here's what a Power of Attorney can and can't do for that.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {POA_FACTS.map((fact, i) => (
            <div key={i} style={{ fontSize: 13.5, lineHeight: 1.55 }}>
              <p style={{ margin: '0 0 4px' }}>{fact.text}</p>
              <a
                href={fact.sourceUrl}
                target="_blank"
                rel="noreferrer"
                style={{ fontSize: 11.5, color: 'var(--ink-faint)', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                Source: {fact.sourceLabel} <ExternalLink size={10} />
              </a>
            </div>
          ))}
        </div>

        <div className="fact-box" style={{ marginTop: 14 }}>
          <Info size={18} />
          <div>
            <strong>Signing from abroad:</strong> {POA_ABROAD_TIP}
          </div>
        </div>
      </div>

      <div className="detail-card" style={{ padding: '16px 20px' }}>
        <p style={{ fontWeight: 700, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Video size={16} /> Verifying a property you can't visit
        </p>
        <ul style={{ margin: '0 0 12px', paddingLeft: 18 }}>
          {REMOTE_VERIFICATION_TIPS.map((tip, i) => (
            <li key={i} style={{ fontSize: 13.5, marginBottom: 6, lineHeight: 1.5 }}>
              {tip}
            </li>
          ))}
        </ul>

        {remoteScamScheme && (
          <p className="fee-note fee-note-warning" style={{ margin: 0 }}>
            <AlertTriangle size={13} /> Known scam pattern: <strong>{remoteScamScheme.name}</strong> —{' '}
            {remoteScamScheme.summary}
          </p>
        )}
      </div>

      <p style={{ fontSize: 12, color: 'var(--ink-faint)', fontStyle: 'italic', margin: 0 }}>
        This is general awareness information, not legal advice. A Power of Attorney for a
        property transaction should be drafted and reviewed by a qualified Nigerian property
        lawyer before you sign anything.
      </p>
    </div>
  )
}
