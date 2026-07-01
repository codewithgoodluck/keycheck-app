export default function StatsBar({ reports }) {
  const flags = reports.filter((r) => r.kind !== 'endorsement').length
  const clean = reports.filter((r) => r.kind === 'endorsement').length
  const verified = reports.filter((r) => r.status === 'verified').length
  const locations = new Set(reports.map((r) => r.locationText.split(',')[0].trim())).size
  const confirmations = reports.reduce((sum, r) => sum + (r.upvotes || 0), 0)

  const stats = [
    { num: flags, label: 'Flagged reports' },
    { num: clean, label: 'Clean records' },
    { num: verified, label: 'Court-verified' },
    { num: locations, label: 'Areas covered' },
    { num: confirmations, label: 'Community confirmations' }
  ]

  return (
    <div className="stats-bar">
      {stats.map((s) => (
        <div className="stat-card" key={s.label}>
          <div className="num">{s.num}</div>
          <div className="label">{s.label}</div>
        </div>
      ))}
    </div>
  )
}
