import { ArrowLeft, AlertTriangle, ScrollText } from 'lucide-react'

// Actively facilitating listing transactions (even lead-gen only, via
// InquiryForm/WhatsApp contact) is a different liability posture than
// KeyCheck's original pure fraud-reporting registry — this page exists so
// that difference isn't just assumed to be covered by scattered
// disclaimers elsewhere. This is a plain-language starting draft, not a
// substitute for review by a qualified Nigerian lawyer before relying on
// it commercially — same honesty standard the rest of the app holds
// "verified"/legal claims to.
export default function Terms({ setView }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 720 }}>
      <div className="page-banner">
        <p className="eyebrow">
          <ScrollText size={13} /> Legal
        </p>
        <h1>Terms of Service</h1>
        <p>Covers both KeyCheck's fraud-report registry and its listings marketplace.</p>
      </div>

      <button className="detail-back" onClick={() => setView('home')} style={{ margin: 0 }}>
        <ArrowLeft size={15} /> Back
      </button>

      <div className="fact-box">
        <AlertTriangle size={18} />
        <div>
          <strong>This is a plain-language draft, not finished legal advice.</strong> It hasn't been
          reviewed by a Nigerian lawyer. Don't treat it as a complete or binding contract until it has.
        </div>
      </div>

      <div className="detail-card" style={{ padding: '16px 20px', fontSize: 13.5, lineHeight: 1.6 }}>
        <h4 style={{ margin: '0 0 8px' }}>1. What KeyCheck is — and isn't</h4>
        <p>
          KeyCheck is two things, and they carry different responsibilities. First, a public registry
          of community-submitted fraud reports and vouches — informational, not verified by KeyCheck
          unless explicitly marked "verified" with a cited source. Second, a listings marketplace
          that lets listers post properties and lets buyers browse and message them directly.
        </p>
        <p>
          KeyCheck does not broker, negotiate, or execute any transaction; is not a party to any
          lease, sale, or agency agreement formed between a lister and a buyer; never holds funds,
          deposits, or documents; and does not verify property ownership, title, or a lister's legal
          right to sell or let. Contacting a lister through this platform (WhatsApp or the in-app
          inquiry form) is a lead-generation convenience only, not a KeyCheck-facilitated transaction.
        </p>

        <h4 style={{ margin: '18px 0 8px' }}>2. What "reviewed" and "verified" actually mean</h4>
        <p>
          A listing being "reviewed" means a moderator checked it against KeyCheck's own fraud
          registry and basic content rules before it went live — it is not an inspection of the
          property, a confirmation of ownership, or a guarantee the listing is accurate or still
          available. Trust badges (e.g. LASRERA references) reflect exactly what they say and no
          more: see the badge's own text for which regulator, if any, backs a specific claim, and
          note that real regulatory backing for real-estate practice in Nigeria currently exists at
          the state level (e.g. Lagos) and not nationwide.
        </p>

        <h4 style={{ margin: '18px 0 8px' }}>3. Your responsibility</h4>
        <p>
          You are responsible for your own due diligence before paying anyone or signing anything —
          KeyCheck's checklists and guides are aids, not a substitute for independent legal advice.
          Never send money before physically inspecting a property (or arranging a trusted local
          representative to do so) and confirming the other party's identity and legal standing
          through the channels described in KeyCheck's own due-diligence guidance.
        </p>

        <h4 style={{ margin: '18px 0 8px' }}>4. Lister responsibilities</h4>
        <p>
          Listers are solely responsible for the accuracy of what they submit — description, price,
          fee, ownership/authority to let or sell, and any registration numbers claimed. Submitting a
          listing you know to be false, duplicated, or for a property you have no right to market is
          a violation of these terms and may itself be reportable through KeyCheck's own fraud
          registry.
        </p>

        <h4 style={{ margin: '18px 0 8px' }}>5. No warranty, limitation of liability</h4>
        <p>
          KeyCheck is provided "as is," without warranty of any kind, including accuracy or
          availability of listings or reports. To the fullest extent permitted by law, KeyCheck and
          its operators are not liable for any loss arising from a transaction, communication, or
          decision made based on content on this platform, including content submitted by other
          users.
        </p>

        <h4 style={{ margin: '18px 0 8px' }}>6. Changes</h4>
        <p>
          These terms may be updated as the platform grows; continued use after a change means you
          accept the updated terms.
        </p>
      </div>
    </div>
  )
}
