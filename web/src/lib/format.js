export const TYPE_LABELS = {
  land: 'Land dispute',
  agent: 'Land agent flagged',
  house_agent: 'Rental agent flagged',
  landlord: 'Landlord flagged',
  estate: 'Estate/developer flagged'
}

export const ENDORSEMENT_TYPE_LABELS = {
  land: 'Clean land record',
  agent: 'Land agent vouched for',
  house_agent: 'Rental agent vouched for',
  landlord: 'Landlord vouched for',
  estate: 'Estate/developer vouched for'
}

export function getReportTitle(report) {
  const isEndorsement = report.kind === 'endorsement'
  if (report.type === 'land') {
    return isEndorsement ? `Clean land record: ${report.locationText}` : `Land dispute: ${report.locationText}`
  }
  const labels = isEndorsement ? ENDORSEMENT_TYPE_LABELS : TYPE_LABELS
  const label = labels[report.type] || (isEndorsement ? 'Vouched for' : 'Flagged')
  const raw = report.agentName || 'Unnamed'
  const firstParty = raw.split(/[/;]/)[0].trim()
  const withoutAliases = firstParty.replace(/\([^)]*\)/g, '').trim()
  return `${label}: ${withoutAliases || 'Unnamed'}`
}
