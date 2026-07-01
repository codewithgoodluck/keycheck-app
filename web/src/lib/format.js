export const TYPE_LABELS = {
  land: 'Land dispute',
  agent: 'Land agent flagged',
  house_agent: 'Rental agent flagged',
  landlord: 'Landlord flagged',
  estate: 'Estate/developer flagged'
}

export function getReportTitle(report) {
  if (report.type === 'land') {
    return `Land dispute: ${report.locationText}`
  }
  const label = TYPE_LABELS[report.type] || 'Flagged'
  const raw = report.agentName || 'Unnamed'
  const firstParty = raw.split(/[/;]/)[0].trim()
  const withoutAliases = firstParty.replace(/\([^)]*\)/g, '').trim()
  return `${label}: ${withoutAliases || 'Unnamed'}`
}
