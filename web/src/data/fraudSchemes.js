// Static, curated reference — not derived from live report data. A
// data-driven version would need a schemeType field added to every
// report (set at submission, backfilled for existing ones), which is a
// real schema migration, not a small addition; this is scoped as
// content/organization work instead. `category` reuses the same keys as
// TYPE_LABELS/CHECKLISTS (land/agent/house_agent/landlord/estate) —
// deliberately not inventing a new taxonomy. `catchCategory`/`catchItemId`
// point at a specific entry in CHECKLISTS (see checklists.js); resolved
// at render time by FraudSchemes.jsx rather than duplicating the
// checklist item's text here, so the two can't silently drift apart.
export const FRAUD_SCHEMES = [
  {
    id: 'double-sale',
    name: 'Double sale / double allocation',
    category: 'land',
    summary: 'The same plot is sold to two or more different buyers, often by a fraudulent agent or a land-owning family member acting without full family consent.',
    howItWorks:
      'A seller (or someone posing as one) collects payment from multiple buyers for the same plot, sometimes years apart, betting that most victims never verify ownership at the registry before paying.',
    redFlags: [
      'The seller is reluctant to let you search the title independently',
      'The price is noticeably below nearby comparable plots',
      'You\'re rushed to pay before you\'ve had time to verify anything'
    ],
    catchCategory: 'land',
    catchItemId: 'cofo-verify'
  },
  {
    id: 'forged-cofo',
    name: 'Forged or altered Certificate of Occupancy',
    category: 'land',
    summary: 'A fabricated or tampered C of O is presented as genuine — sometimes copying a real registered document\'s layout with altered details.',
    howItWorks:
      'Because a C of O looks official at a glance, victims often accept a photocopy or a convincing-looking scan without checking it against the actual Land Registry record.',
    redFlags: [
      'You\'re only shown a photocopy or PDF, never the original',
      'The seller discourages an independent registry search',
      'Document details (plot number, dimensions) don\'t match the survey plan'
    ],
    catchCategory: 'land',
    catchItemId: 'cofo'
  },
  {
    id: 'agent-impersonation',
    name: 'Agent impersonation',
    category: 'agent',
    summary: 'Someone with no real authorization poses as an agent for a property or plot, often using a real listing\'s photos or a real agent\'s name without their knowledge.',
    howItWorks:
      'The impersonator collects an inspection fee, caution fee, or deposit, then becomes unreachable — the property they "showed" may not even be for sale.',
    redFlags: [
      'They avoid an in-person meeting at the actual property',
      'No verifiable registration or business address',
      'Communication is only via a personal phone number, never a traceable business line'
    ],
    catchCategory: 'land',
    catchItemId: 'search'
  },
  {
    id: 'fake-landlord',
    name: 'Fake landlord / subletting scam',
    category: 'landlord',
    summary: 'Someone who is not the actual landlord — sometimes a current tenant, sometimes a stranger with no connection to the property — collects rent or a deposit for a unit they don\'t own or control.',
    howItWorks:
      'The scammer shows the property (sometimes with a spare key or during the real tenant\'s absence), collects payment, and disappears before the real landlord or tenant discovers what happened.',
    redFlags: [
      'They can\'t produce any proof of ownership or a management agreement',
      'Viewing is rushed or oddly timed',
      'Payment is requested in cash with no formal agreement'
    ],
    catchCategory: 'landlord',
    catchItemId: 'search'
  },
  {
    id: 'developer-abscondment',
    name: 'Estate developer abscondment',
    category: 'estate',
    summary: 'A developer collects payment for units or plots in a development that\'s never completed, sometimes because it was never legally viable to begin with.',
    howItWorks:
      'Pre-launch or "early bird" pricing pressures buyers to commit before construction starts or before the developer has secured proper title — by the time delays become obvious, funds are already gone.',
    redFlags: [
      'Heavy pre-launch discounting with payment deadlines',
      'No verifiable Certificate of Occupancy or Governor\'s Consent for the land itself',
      'Marketing materials but no physical site visit offered'
    ],
    catchCategory: 'estate',
    catchItemId: 'not-resold'
  },
  {
    id: 'upfront-fee-scam',
    name: 'Upfront agency-fee scam',
    category: 'house_agent',
    summary: '"Agent" collects an inspection fee, caution fee, or agreement fee upfront, then becomes unreachable — the property may not exist or may not actually be available.',
    howItWorks:
      'Because a small upfront fee feels low-risk, victims pay without verifying the agent or the listing first, and the scam only becomes obvious once the agent stops responding.',
    redFlags: [
      'Payment is requested before any physical inspection',
      'Urgency tactics — "someone else is about to take it"',
      'No official receipt offered for the fee'
    ],
    catchCategory: 'house_agent',
    catchItemId: 'pressure'
  },
  {
    id: 'excess-fee-extraction',
    name: 'Excess agency fee / advance-rent extraction',
    category: 'house_agent',
    summary: 'An agent or landlord charges well above what\'s legally allowed (in Lagos: 10% agency fee, 1 year\'s rent advance), often paired with pressure to pay quickly.',
    howItWorks:
      'Most tenants don\'t know the legal caps exist, so an inflated fee is simply accepted as "how things work" rather than challenged.',
    redFlags: [
      'Agency fee quoted above 10% of annual rent (Lagos)',
      'More than 1 year\'s rent demanded upfront (Lagos)',
      'No willingness to itemize or explain the fee breakdown'
    ],
    catchCategory: 'house_agent',
    catchItemId: 'fee-cap'
  },
  {
    id: 'remote-no-inspection',
    name: 'Remote / no-inspection scam',
    category: 'land',
    summary: 'A buyer, often based abroad, is pressured into paying without ever physically inspecting the property — sometimes using doctored photos or videos of a different plot entirely.',
    howItWorks:
      'Distance and trust in a relative or "trusted contact" back home substitute for the buyer\'s own verification, which the scammer relies on to avoid ever being physically checked.',
    redFlags: [
      'Every excuse is offered for why a live video walkthrough isn\'t possible',
      'Pressure to wire funds internationally before any independent local verification',
      'No willingness to work with a buyer\'s own independent representative on the ground'
    ],
    catchCategory: 'land',
    catchItemId: 'inspect'
  }
]
