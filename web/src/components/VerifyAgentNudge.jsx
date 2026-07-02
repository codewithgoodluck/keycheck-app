import { ShieldCheck, ExternalLink } from 'lucide-react'

// LASRERA is Lagos-specific — labeled as such rather than implied to
// cover all of Nigeria, since KeyCheck's reports span many states.
export default function VerifyAgentNudge() {
  return (
    <div className="fact-box">
      <ShieldCheck size={18} />
      <div>
        <strong>Before you pay (Lagos only):</strong> check whether this agent is actually registered
        with LASRERA. Practicing without registration is illegal in Lagos State, and the
        government has said to check before transacting.
        <div>
          <a href="https://lasrera.lagosstate.gov.ng/practitionerSearch.jsp" target="_blank" rel="noreferrer">
            LASRERA practitioner search <ExternalLink size={12} />
          </a>
        </div>
      </div>
    </div>
  )
}
