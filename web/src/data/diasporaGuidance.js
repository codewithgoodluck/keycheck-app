// Researched via web search before writing anything here — Power of
// Attorney limits are a specific Nigerian property-law claim, and this
// app has never asserted a legal fact without a real source (see
// LASRERA/Tenancy Law 2011 content elsewhere). Confirmed against Omaplex
// Law Firm, a Nigerian legal practitioner source.
export const POA_FACTS = [
  {
    text: "A Power of Attorney does NOT transfer ownership of land. Nigeria's Supreme Court has held it is merely \"an instrument of delegation\". Ownership only transfers when the donee actually executes a sale deed (Deed of Assignment), not by the Power of Attorney itself.",
    sourceLabel: 'Omaplex Law Firm',
    sourceUrl: 'https://omaplex.com.ng/operations-and-limitations-of-a-power-of-attorney-the-can-and-cant-of-a-donee-agent/'
  },
  {
    text: 'A donee (the person you grant power to) can only do what is explicitly written in the document. Anything outside that scope is void. A Power of Attorney that doesn\'t clearly spell out authority to sell is not authority to sell.',
    sourceLabel: 'Omaplex Law Firm',
    sourceUrl: 'https://omaplex.com.ng/operations-and-limitations-of-a-power-of-attorney-the-can-and-cant-of-a-donee-agent/'
  },
  {
    text: "The donee's authority ends immediately once you revoke the Power of Attorney. You retain ownership throughout, and can revoke unless the donee has already validly acted on it.",
    sourceLabel: 'Omaplex Law Firm',
    sourceUrl: 'https://omaplex.com.ng/operations-and-limitations-of-a-power-of-attorney-the-can-and-cant-of-a-donee-agent/'
  },
  {
    text: 'For land and property, a Power of Attorney generally needs to be stamped and registered with the relevant state land registry (in Lagos, at AGIS) to be legally recognized and admissible as evidence.',
    sourceLabel: 'Omaplex Law Firm',
    sourceUrl: 'https://omaplex.com.ng/operations-and-limitations-of-a-power-of-attorney-the-can-and-cant-of-a-donee-agent/'
  },
  {
    text: "A Power of Attorney does not bypass Governor's Consent, a separate requirement for land held under a Certificate of Occupancy, regardless of who holds power of attorney over it.",
    sourceLabel: 'Omaplex Law Firm',
    sourceUrl: 'https://omaplex.com.ng/operations-and-limitations-of-a-power-of-attorney-the-can-and-cant-of-a-donee-agent/'
  }
]

// Could not confirm the exact witnessing requirement for a Power of
// Attorney executed while the donor is physically outside Nigeria
// against a single reliable source — phrased as advice to confirm
// directly, not asserted as a specific rule.
export const POA_ABROAD_TIP =
  "If you're signing the Power of Attorney from outside Nigeria, ask whoever will register it in Nigeria (your lawyer, or the land registry) exactly how it needs to be witnessed before you sign. Requirements can vary, and getting this wrong can mean redoing the whole document."

export const REMOTE_VERIFICATION_TIPS = [
  'Insist on a live video walkthrough before committing to anything. Photos alone are trivial to fake or reuse from a different property.',
  'Use an independent representative on the ground, not just a trusted relative. This should be someone with no financial stake in whether the deal goes through.',
  "Never wire funds before your own independent verification is complete, no matter how much pressure you're under to move fast."
]
