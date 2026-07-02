// Maps existing checklist item ids (see checklists.js) to a transaction
// stage, per category — doesn't modify checklists.js at all, so the
// existing flat checklist view is unaffected. Reorganizes verified
// content by sequence rather than introducing new facts, same principle
// fraudSchemes.js already established (resolve at render time, don't
// duplicate). `agent` reuses `land`'s stages and `landlord` reuses
// `house_agent`'s, mirroring CHECKLISTS' own category aliasing.
const LAND_STAGES = [
  { key: 'initial_contact', label: 'Before you commit', itemIds: ['search'] },
  { key: 'verification', label: 'Verify the documents', itemIds: ['cofo', 'cofo-verify', 'deed', 'survey', 'consent'] },
  { key: 'viewing', label: 'Inspect the property', itemIds: ['inspect'] },
  { key: 'payment', label: 'At payment', itemIds: ['receipt'] }
]

const RENTAL_STAGES = [
  { key: 'initial_contact', label: 'Before you commit', itemIds: ['search'] },
  { key: 'verification', label: 'Verify the agent', itemIds: ['lasrera'] },
  { key: 'viewing', label: 'Inspect the property', itemIds: ['inspect'] },
  { key: 'payment', label: 'At payment', itemIds: ['fee-cap', 'advance-cap', 'receipt', 'pressure'] }
]

const ESTATE_STAGES = [
  { key: 'initial_contact', label: 'Before you commit', itemIds: ['search'] },
  { key: 'verification', label: 'Verify the development', itemIds: ['cofo', 'not-resold'] },
  { key: 'viewing', label: 'Inspect the unit', itemIds: ['inspect'] },
  { key: 'payment', label: 'At payment', itemIds: ['payment'] }
]

export const TRANSACTION_STAGES = {
  land: LAND_STAGES,
  agent: LAND_STAGES,
  house_agent: RENTAL_STAGES,
  landlord: RENTAL_STAGES,
  estate: ESTATE_STAGES
}

// Nothing in the existing checklists covers what happens after payment
// (registering the transfer, keeping documents, reporting problems) —
// generic practical advice, not a legal claim requiring a source, so it
// doesn't need the same per-item sourcing checklists.js items have.
export const AFTER_PAYMENT_TIPS = [
  'Keep every receipt and signed document somewhere safe — you may need them for years.',
  "Follow up on registering the transfer or tenancy agreement promptly, don't let it sit unfinished.",
  "If anything about the transaction doesn't match what you were told, report it on KeyCheck — it helps warn the next buyer."
]
