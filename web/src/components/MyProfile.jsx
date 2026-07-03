import { useEffect, useState } from 'react'
import { UserCircle, Home, Settings as SettingsIcon, FilePlus2, ShieldAlert } from 'lucide-react'
import ReportCard from './ReportCard.jsx'
import { getReportsBySubmitter } from '../lib/reportsApi.js'

// Distinct from AgentProfile.jsx, which is a public page for a
// name/company (anyone can look up any name's fraud-report history).
// This is the signed-in user's own account page — their reports, a link
// to their listings (My Listings already exists as its own page for
// listers), and settings. Reuses the same lister/listerUser auth state
// as everywhere else in the app — a "user" account isn't a different
// thing from a "lister" account, just the same Firebase Auth user used
// for a different action.
export default function MyProfile({ listerUser, setView, savedIds, onToggleSave }) {
  const [myReports, setMyReports] = useState(null)

  useEffect(() => {
    if (!listerUser) return
    setMyReports(null)
    getReportsBySubmitter(listerUser.uid)
      .then(setMyReports)
      .catch((err) => {
        console.warn('Failed to load my reports:', err.message)
        setMyReports([])
      })
  }, [listerUser])

  if (!listerUser) {
    return (
      <div className="empty-state">
        <p>Sign in to view your profile.</p>
        <button onClick={() => setView('lister-auth')}>Sign in</button>
      </div>
    )
  }

  const memberSince = listerUser.metadata?.creationTime
    ? new Date(listerUser.metadata.creationTime).toLocaleDateString(undefined, { year: 'numeric', month: 'long' })
    : null

  return (
    <div>
      <div className="page-banner">
        <p className="eyebrow">
          <UserCircle size={13} /> My profile
        </p>
        <h1>{listerUser.email}</h1>
        {memberSince && <p>Member since {memberSince}</p>}
      </div>

      <div className="chip-row" style={{ marginTop: 0, marginBottom: 20 }}>
        <button className="chip" onClick={() => setView('submit')}>
          <FilePlus2 size={13} /> Report a problem
        </button>
        <button className="chip" onClick={() => setView('my-listings')}>
          <Home size={13} /> My listings
        </button>
        <button className="chip" onClick={() => setView('settings')}>
          <SettingsIcon size={13} /> Settings
        </button>
      </div>

      <div className="results-meta">
        <span>My reports</span>
      </div>

      {myReports === null ? (
        <p style={{ color: 'var(--ink-soft)' }}>Loading...</p>
      ) : myReports.length > 0 ? (
        <div className="report-list">
          {myReports.map((r) => (
            <ReportCard key={r.id} report={r} onClick={() => setView('detail', r)} saved={savedIds.includes(r.id)} onToggleSave={onToggleSave} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <ShieldAlert size={24} />
          <p>You haven't submitted any reports yet.</p>
          <button onClick={() => setView('submit')}>Report a problem</button>
        </div>
      )}
    </div>
  )
}
