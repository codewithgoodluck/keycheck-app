import { useState, useEffect, useRef } from 'react'
import Header from './components/Header.jsx'
import SearchHome from './components/SearchHome.jsx'
import ReportDetail from './components/ReportDetail.jsx'
import SubmitReport from './components/SubmitReport.jsx'
import SavedReports from './components/SavedReports.jsx'
import MapView from './components/MapView.jsx'
import FloatingReportButton from './components/FloatingReportButton.jsx'
import AdminLogin from './components/AdminLogin.jsx'
import AdminPanel from './components/AdminPanel.jsx'
import { seedReports } from './data/seedReports.js'
import { getSavedIds, toggleSaved } from './lib/watchlist.js'
import { subscribeToReports, addReportToFirestore, confirmReportInFirestore, addReplyToFirestore } from './lib/reportsApi.js'
import { watchAdminAuth } from './lib/adminApi.js'

// MVP starts with in-memory seeded data so the app is demoable with zero
// setup. The moment Firebase is configured (see src/lib/firebase.js), the
// subscription below swaps in live data automatically — no code change
// needed. Until then, every write (submit, confirm) falls back to updating
// local state so the demo still feels real.
const initialReports = seedReports.map((r, i) => ({ ...r, id: String(i + 1).padStart(4, '0') }))

export default function App() {
  const [view, setViewRaw] = useState('home')
  const [activeReport, setActiveReport] = useState(null)
  const [reports, setReports] = useState(initialReports)
  const [savedIds, setSavedIds] = useState([])
  const [usingFirestore, setUsingFirestore] = useState(false)
  const [adminUser, setAdminUser] = useState(undefined) // undefined = auth state not yet known
  const unsubscribeRef = useRef(null)

  const isAdminRoute =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('admin') === '1'

  useEffect(() => {
    setSavedIds(getSavedIds())

    unsubscribeRef.current = subscribeToReports(
      (liveReports) => {
        // Once Firestore returns data, prefer it. If the collection is
        // genuinely empty (freshly created project, not seeded yet), keep
        // showing local seed data rather than an empty app.
        if (liveReports.length > 0) {
          setReports(liveReports)
          setUsingFirestore(true)
        }
      },
      () => setUsingFirestore(false)
    )

    return () => unsubscribeRef.current?.()
  }, [])

  useEffect(() => {
    if (!isAdminRoute) return
    return watchAdminAuth((user) => setAdminUser(user))
  }, [isAdminRoute])

  function setView(next, report) {
    setActiveReport(report || null)
    setViewRaw(next)
    window.scrollTo(0, 0)
  }

  async function addReport(report) {
    if (usingFirestore) {
      try {
        const saved = await addReportToFirestore(report)
        // No local state update needed — the onSnapshot listener picks this up.
        return saved
      } catch (err) {
        console.warn('Firestore write failed, saving locally instead:', err.message)
      }
    }
    const id = String(reports.length + 1).padStart(4, '0')
    setReports((r) => [{ ...report, id }, ...r])
  }

  function handleToggleSave(id) {
    // Saves stay device-local (no account system in this MVP) rather than
    // in Firestore, since there's no concept of "who" is saving yet.
    setSavedIds(toggleSaved(id))
  }

  async function handleConfirm(id) {
    if (usingFirestore) {
      try {
        await confirmReportInFirestore(id)
        // onSnapshot listener will reflect the new count automatically.
        return
      } catch (err) {
        console.warn('Firestore confirm failed, updating locally instead:', err.message)
      }
    }
    setReports((rs) => rs.map((r) => (r.id === id ? { ...r, upvotes: (r.upvotes || 0) + 1 } : r)))
    setActiveReport((r) => (r && r.id === id ? { ...r, upvotes: (r.upvotes || 0) + 1 } : r))
  }

  async function handleAddReply(reportId, reply) {
    let saved = {
      id: `reply-${Date.now()}`,
      status: 'unverified',
      channel: 'web',
      identityVerified: false,
      submittedAt: new Date().toISOString(),
      ...reply
    }

    if (usingFirestore) {
      try {
        saved = await addReplyToFirestore(reportId, reply)
        // onSnapshot listener will reflect the new reply automatically.
        return saved
      } catch (err) {
        console.warn('Firestore reply failed, saving locally instead:', err.message)
      }
    }

    const appendReply = (r) =>
      r.id === reportId ? { ...r, replies: [...(r.replies || []), saved] } : r
    setReports((rs) => rs.map(appendReply))
    setActiveReport((r) => (r && r.id === reportId ? appendReply(r) : r))
    return saved
  }

  if (isAdminRoute) {
    if (adminUser === undefined) {
      return <div style={{ padding: 60, textAlign: 'center', color: 'var(--ink-soft)' }}>Loading...</div>
    }
    return (
      <div className="app">
        {adminUser ? (
          <AdminPanel reports={reports} adminEmail={adminUser.email} />
        ) : (
          <AdminLogin />
        )}
      </div>
    )
  }

  return (
    <div className="app">
      <Header view={view} setView={setView} savedCount={savedIds.length} />

      {view === 'home' && (
        <SearchHome
          reports={reports}
          setView={setView}
          savedIds={savedIds}
          onToggleSave={handleToggleSave}
        />
      )}
      {view === 'map' && <MapView reports={reports} setView={setView} />}
      {view === 'detail' && (
        <ReportDetail
          report={activeReport}
          setView={setView}
          saved={savedIds.includes(activeReport?.id)}
          onToggleSave={handleToggleSave}
          onConfirm={handleConfirm}
          onAddReply={handleAddReply}
        />
      )}
      {view === 'submit' && <SubmitReport addReport={addReport} setView={setView} />}
      {view === 'saved' && (
        <SavedReports reports={reports} savedIds={savedIds} setView={setView} onToggleSave={handleToggleSave} />
      )}

      {view !== 'submit' && <FloatingReportButton onClick={() => setView('submit')} />}
    </div>
  )
}
