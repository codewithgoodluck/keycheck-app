// Each question is drawn from a real pattern already in seedReports.js —
// cited here for traceability, not shown in the UI (keeps the quiz itself
// clean while keeping the content honest and checkable against the source
// data it claims to be built from).
export const RISK_QUIZ_QUESTIONS = [
  {
    id: 'pay-before-inspect',
    text: 'Are you being asked to pay in full before you’ve physically inspected the property?'
    // Source: Ikoyi/Lekki shortlet scam — paid after seeing only Instagram photos, "agent" vanished after payment.
  },
  {
    id: 'pressure',
    text: 'Are you being pressured to pay today, or told you’ll lose the deal if you wait?'
    // Source: common urgency tactic across multiple sourced cases.
  },
  {
    id: 'never-met',
    text: 'Have you only ever communicated with this person remotely, never met in person?'
    // Source: Ikoyi/Lekki shortlet scam (Instagram-only contact).
  },
  {
    id: 'cash-or-personal-account',
    text: 'Are you being asked to pay in cash, or into a personal account rather than a verifiable company account?'
    // Source: omo-onile unreceipted cash-collection pattern (Lagos/Ogun construction-stage extortion).
  },
  {
    id: 'family-receipt-only',
    text: 'Is the only paperwork offered a hand-written "family receipt", rather than a registered Deed of Assignment or C of O?'
    // Source: Lagos/Ogun case — "initial N200,000 family receipt" with no registered title document.
  },
  {
    id: 'no-lasrera-number',
    text: 'If this is a rental: has the agent been unable or unwilling to give you a LASRERA registration number when asked?'
    // Source: LASRERA's own disclosure of 505 tenancy-fraud petitions, many against unregistered operators.
  }
]

export function scoreRisk(answers) {
  const yesCount = Object.values(answers).filter(Boolean).length
  if (yesCount <= 1) return { band: 'low', yesCount }
  if (yesCount <= 3) return { band: 'medium', yesCount }
  return { band: 'high', yesCount }
}

export const RISK_BAND_COPY = {
  low: {
    label: 'Low risk signals',
    message: 'None of the strongest red flags showed up. That’s reassuring, but it isn’t proof. Still work through the due diligence checklist before you pay.'
  },
  medium: {
    label: 'Some red flags',
    message: 'A few patterns here match how real reported fraud cases started. Slow down, insist on the checklist items, and search this name/address on KeyCheck before paying anything.'
  },
  high: {
    label: 'Multiple red flags',
    message: 'This matches several patterns seen in real reported fraud cases. Strongly consider not paying until you’ve independently verified the seller/agent and the property, through LASRERA, the Land Registry, or an independent surveyor, not just this person’s word.'
  }
}
