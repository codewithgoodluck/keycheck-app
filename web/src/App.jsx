import { useState, useEffect, useRef } from 'react'
import Header from './components/Header.jsx'
import BottomNav from './components/BottomNav.jsx'
import SearchHome from './components/SearchHome.jsx'
import ReportDetail from './components/ReportDetail.jsx'
import SubmitReport from './components/SubmitReport.jsx'
import SavedReports from './components/SavedReports.jsx'
import AgentProfile from './components/AgentProfile.jsx'
import MapView from './components/MapView.jsx'
import FloatingReportButton from './components/FloatingReportButton.jsx'
import AdminLogin from './components/AdminLogin.jsx'
import AdminPanel from './components/AdminPanel.jsx'
import ToastStack from './components/ToastStack.jsx'
import DueDiligence from './components/DueDiligence.jsx'
import ListingsBrowse from './components/ListingsBrowse.jsx'
import ListingDetail from './components/ListingDetail.jsx'
import SubmitListing from './components/SubmitListing.jsx'
import MyListings from './components/MyListings.jsx'
import ListerAuth from './components/ListerAuth.jsx'
import { seedReports } from './data/seedReports.js'
import { getSavedIds, toggleSaved } from './lib/watchlist.js'
import { subscribeToReports, addReportToFirestore, confirmReportInFirestore, addReplyToFirestore } from './lib/reportsApi.js'
import { subscribeToListings } from './lib/listingsApi.js'
import { watchAdminAuth } from './lib/adminApi.js'
import { watchListerAuth } from './lib/listerAuth.js'
import { getSeenIds, markSeen, getSeenListingIds, markListingsSeen, areaOf } from './lib/notifications.js'
import { getWatchedTerms } from './lib/watches.js'
import { getStoredPushToken, onForegroundPushMessage } from './lib/push.js'
import { Bell, X } from 'lucide-react'

// MVP starts with in-memory seeded data so the app is demoable with zero
// setup. The moment Firebase is configured (see src/lib/firebase.js), the
// subscription below swaps in live data automatically — no code change
// needed. Until then, every write (submit, confirm) falls back to updating
// local state so the demo still feels real.
const initialReports = seedReports.map((r, i) => ({ ...r, id: String(i + 1).padStart(4, '0') }))

export default function App() {
  const [view, setViewRaw] = useState('home')
  const [activeReportId, setActiveReportId] = useState(null)
  const [activeProfileName, setActiveProfileName] = useState(null)
  const [pendingReportId, setPendingReportId] = useState(null)
  const [reports, setReports] = useState(initialReports)
  const [reportLimit, setReportLimit] = useState(200)
  const [hasMoreReports, setHasMoreReports] = useState(false)
  const [savedIds, setSavedIds] = useState([])
  const [usingFirestore, setUsingFirestore] = useState(false)
  const [adminUser, setAdminUser] = useState(undefined) // undefined = auth state not yet known
  const [newMatches, setNewMatches] = useState([])
  const [pushMessage, setPushMessage] = useState(null)
  const unsubscribeRef = useRef(null)
  const savedIdsRef = useRef([])
  const firestoreBaselineRef = useRef(false)

  // Verified Listings (Milestone 2) — mirrors the reports plumbing above,
  // not a new pattern. listerUser uses the same Firebase Auth instance as
  // adminUser (see lib/listerAuth.js): a lister is just any authenticated
  // user without the moderator claim, not a separate Auth system.
  const [listings, setListings] = useState([])
  const [listingLimit, setListingLimit] = useState(100)
  const [hasMoreListings, setHasMoreListings] = useState(false)
  const [listerUser, setListerUser] = useState(undefined) // undefined = auth state not yet known
  const [activeListingId, setActiveListingId] = useState(null)
  const listingsUnsubscribeRef = useRef(null)
  const listingsBaselineRef = useRef(false)

  const isAdminRoute =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('admin') === '1'

  useEffect(() => {
    setSavedIds(getSavedIds())
  }, [])

  useEffect(() => {
    savedIdsRef.current = savedIds
  }, [savedIds])

  // Foreground-only push handling (see lib/push.js — this is groundwork,
  // nothing sends a real push yet). Only subscribes if this device already
  // has a stored token, i.e. has previously opted in via a "notify me"
  // button somewhere.
  useEffect(() => {
    if (!getStoredPushToken()) return
    let unsubscribe = () => {}
    onForegroundPushMessage((payload) => {
      setPushMessage(payload?.notification?.body || payload?.notification?.title || 'New alert')
    }).then((unsub) => {
      unsubscribe = unsub
    })
    return () => unsubscribe()
  }, [])

  // Alerts a user to a newly-arrived report matching the area/name of
  // something they've already saved, OR a freeform area/name they're
  // explicitly watching (lib/watches.js — no existing report required to
  // anchor it to). Only runs once Firestore is live and has already
  // delivered one snapshot — otherwise the seed-data-to-live handoff (a
  // completely different id namespace) would look like a burst of "new"
  // reports that were actually already on the site.
  useEffect(() => {
    if (!usingFirestore || reports.length === 0) return

    const seen = new Set(getSeenIds())
    const freshReports = reports.filter((r) => !seen.has(r.id))

    if (firestoreBaselineRef.current && freshReports.length > 0) {
      const savedReports = reports.filter((r) => savedIdsRef.current.includes(r.id))
      const watchedAreas = new Set(savedReports.map(areaOf).filter(Boolean))
      const watchedAgents = new Set(savedReports.map((r) => r.agentName?.trim().toLowerCase()).filter(Boolean))
      const watchedTerms = getWatchedTerms()

      if (watchedAreas.size > 0 || watchedAgents.size > 0 || watchedTerms.length > 0) {
        const matches = freshReports.filter((r) => {
          const agent = r.agentName?.trim().toLowerCase() || ''
          if (watchedAreas.has(areaOf(r)) || watchedAgents.has(agent)) return true
          if (watchedTerms.length === 0) return false
          const loc = r.locationText?.toLowerCase() || ''
          return watchedTerms.some((term) => loc.includes(term) || agent.includes(term))
        })
        if (matches.length > 0) {
          setNewMatches((prev) => {
            const byKey = new Map(prev.map((m) => [`${m.kind}:${m.id}`, m]))
            matches.forEach((r) => byKey.set(`report:${r.id}`, { ...r, kind: 'report' }))
            return Array.from(byKey.values()).slice(0, 5)
          })
        }
      }
    }

    markSeen(reports.map((r) => r.id))
    firestoreBaselineRef.current = true
  }, [reports, usingFirestore])

  // Same idea as the report-matching effect above, applied to listings —
  // its own baseline ref since reports and listings hit their Firestore
  // baseline independently. Only the freeform watched-terms list applies
  // here (no "watched agent" equivalent — that's specific to fraud
  // reports' saved-report pattern, and there's no "saved listings"
  // concept in this app), matched against locationText only.
  useEffect(() => {
    if (listings.length === 0) return

    const seen = new Set(getSeenListingIds())
    const freshListings = listings.filter((l) => !seen.has(l.id))

    if (listingsBaselineRef.current && freshListings.length > 0) {
      const watchedTerms = getWatchedTerms()
      if (watchedTerms.length > 0) {
        const matches = freshListings.filter((l) => {
          const loc = l.locationText?.toLowerCase() || ''
          return watchedTerms.some((term) => loc.includes(term))
        })
        if (matches.length > 0) {
          setNewMatches((prev) => {
            const byKey = new Map(prev.map((m) => [`${m.kind}:${m.id}`, m]))
            matches.forEach((l) => byKey.set(`listing:${l.id}`, { ...l, kind: 'listing' }))
            return Array.from(byKey.values()).slice(0, 5)
          })
        }
      }
    }

    markListingsSeen(listings.map((l) => l.id))
    listingsBaselineRef.current = true
  }, [listings])

  function dismissMatch(kind, id) {
    setNewMatches((prev) => prev.filter((m) => !(m.kind === kind && m.id === id)))
  }

  // Re-subscribes with a bigger limit whenever reportLimit grows (see
  // loadMoreReports below) instead of ever pulling the full collection.
  useEffect(() => {
    unsubscribeRef.current?.()
    unsubscribeRef.current = subscribeToReports(
      (liveReports, meta) => {
        // Once Firestore returns data, prefer it. If the collection is
        // genuinely empty (freshly created project, not seeded yet), keep
        // showing local seed data rather than an empty app.
        if (liveReports.length > 0) {
          setReports(liveReports)
          setUsingFirestore(true)
        }
        setHasMoreReports(Boolean(meta?.hasMore))
      },
      () => setUsingFirestore(false),
      reportLimit
    )

    return () => unsubscribeRef.current?.()
  }, [reportLimit])

  function loadMoreReports() {
    setReportLimit((n) => n + 200)
  }

  // Re-subscribes with a bigger limit whenever listingLimit grows, same
  // shape as the reports subscription above. Not gated behind isAdminRoute
  // — browsing listings is a main-app feature, not admin-only.
  useEffect(() => {
    listingsUnsubscribeRef.current?.()
    listingsUnsubscribeRef.current = subscribeToListings(
      (liveListings, meta) => {
        setListings(liveListings)
        setHasMoreListings(Boolean(meta?.hasMore))
      },
      () => {},
      listingLimit
    )
    return () => listingsUnsubscribeRef.current?.()
  }, [listingLimit])

  function loadMoreListings() {
    setListingLimit((n) => n + 100)
  }

  useEffect(() => {
    if (!isAdminRoute) return
    return watchAdminAuth((user) => setAdminUser(user))
  }, [isAdminRoute])

  // Lister auth state — not gated behind isAdminRoute, active on the main
  // app for anyone visiting "My listings" or "Submit a listing".
  useEffect(() => {
    if (isAdminRoute) return
    return watchListerAuth((user) => setListerUser(user))
  }, [isAdminRoute])

  // Restore a shared/bookmarked link on first load (?report=<id> or
  // ?profile=<name>). Report lookups have to wait for `reports` to actually
  // contain that id (seed data resolves instantly, Firestore data arrives
  // async), so this only records intent here — resolution happens below.
  useEffect(() => {
    if (isAdminRoute) return
    const params = new URLSearchParams(window.location.search)
    const reportId = params.get('report')
    const profileName = params.get('profile')
    if (reportId) {
      setActiveReportId(reportId)
      setPendingReportId(reportId)
      setViewRaw('detail')
    } else if (profileName) {
      setActiveProfileName(profileName)
      setViewRaw('profile')
    }
  }, [isAdminRoute])

  useEffect(() => {
    if (!pendingReportId) return
    const found = reports.find((r) => r.id === pendingReportId)
    if (found) {
      setPendingReportId(null)
    } else if (usingFirestore) {
      // Firestore has already returned its live snapshot and there's still
      // no match — this is a genuinely missing/deleted report, not a race.
      setPendingReportId(null)
    }
  }, [reports, usingFirestore, pendingReportId])

  // Keeps the browser back/forward buttons working for deep links, since
  // setView below pushes history entries for detail/profile views.
  useEffect(() => {
    function onPopState() {
      if (isAdminRoute) return
      const params = new URLSearchParams(window.location.search)
      const reportId = params.get('report')
      const profileName = params.get('profile')
      if (reportId) {
        const found = reports.find((r) => r.id === reportId)
        setActiveReportId(reportId)
        setActiveProfileName(null)
        setPendingReportId(found ? null : reportId)
        setViewRaw('detail')
      } else if (profileName) {
        setActiveProfileName(profileName)
        setActiveReportId(null)
        setPendingReportId(null)
        setViewRaw('profile')
      } else {
        setActiveReportId(null)
        setActiveProfileName(null)
        setPendingReportId(null)
        setViewRaw('home')
      }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [reports, isAdminRoute])

  // `payload` is a report object for 'detail', an agent/landlord name string
  // for 'profile', and unused for every other view. `activeReport` itself
  // is derived below (from reports + activeReportId) rather than stored
  // directly, so it always reflects live data — a confirm or reply that
  // updates `reports` shows up immediately without needing to renavigate.
  function setView(next, payload) {
    if (next === 'detail') {
      setActiveReportId(payload?.id || null)
      setActiveProfileName(null)
    } else if (next === 'profile') {
      setActiveProfileName(payload || null)
      setActiveReportId(null)
    } else {
      setActiveReportId(null)
      setActiveProfileName(null)
    }
    setActiveListingId(next === 'listing-detail' ? payload?.id || null : null)
    setPendingReportId(null)
    setViewRaw(next)
    window.scrollTo(0, 0)

    if (isAdminRoute) return
    const url = new URL(window.location.href)
    if (next === 'detail' && payload) {
      url.search = `?report=${encodeURIComponent(payload.id)}`
    } else if (next === 'profile' && payload) {
      url.search = `?profile=${encodeURIComponent(payload)}`
    } else {
      url.search = ''
    }
    window.history.pushState({}, '', url)
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
    const saved = { ...report, id }
    setReports((r) => [saved, ...r])
    return saved
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
        // onSnapshot listener will update `reports`, and activeReport
        // (derived below) picks up the change automatically.
        return
      } catch (err) {
        console.warn('Firestore confirm failed, updating locally instead:', err.message)
      }
    }
    setReports((rs) => rs.map((r) => (r.id === id ? { ...r, upvotes: (r.upvotes || 0) + 1 } : r)))
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
        // onSnapshot listener will update `reports`, and activeReport
        // (derived below) picks up the change automatically.
        return saved
      } catch (err) {
        console.warn('Firestore reply failed, saving locally instead:', err.message)
      }
    }

    const appendReply = (r) =>
      r.id === reportId ? { ...r, replies: [...(r.replies || []), saved] } : r
    setReports((rs) => rs.map(appendReply))
    return saved
  }

  const activeReport = reports.find((r) => r.id === activeReportId) || null
  const activeListing = listings.find((l) => l.id === activeListingId) || null

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
        <ToastStack />
      </div>
    )
  }

  return (
    <div className="app">
      <ToastStack />
      {newMatches.length > 0 && (
        <div className="watch-alerts">
          {newMatches.map((m) => (
            <div key={`${m.kind}:${m.id}`} className="watch-alert">
              <Bell size={15} />
              <span>
                New {m.kind === 'listing' ? 'listing' : 'report'} near{' '}
                <strong>{m.locationText.split(',')[0].trim()}</strong> matches something you're watching.
              </span>
              <button onClick={() => setView(m.kind === 'listing' ? 'listing-detail' : 'detail', m)}>View</button>
              <button className="dismiss" onClick={() => dismissMatch(m.kind, m.id)} aria-label="Dismiss">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      {pushMessage && (
        <div className="watch-alerts">
          <div className="watch-alert">
            <Bell size={15} />
            <span>{pushMessage}</span>
            <button className="dismiss" onClick={() => setPushMessage(null)} aria-label="Dismiss">
              <X size={14} />
            </button>
          </div>
        </div>
      )}
      <Header view={view} setView={setView} savedCount={savedIds.length} />

      {view === 'home' && (
        <SearchHome
          reports={reports}
          setView={setView}
          savedIds={savedIds}
          onToggleSave={handleToggleSave}
          hasMore={hasMoreReports}
          onLoadMore={loadMoreReports}
        />
      )}
      {view === 'map' && <MapView reports={reports} setView={setView} />}
      {view === 'detail' && pendingReportId && (
        <div style={{ padding: 60, textAlign: 'center', color: 'var(--ink-soft)' }}>Loading report...</div>
      )}
      {view === 'detail' && !pendingReportId && (
        <ReportDetail
          report={activeReport}
          setView={setView}
          saved={savedIds.includes(activeReport?.id)}
          onToggleSave={handleToggleSave}
          onConfirm={handleConfirm}
          onAddReply={handleAddReply}
        />
      )}
      {view === 'profile' && (
        <AgentProfile
          reports={reports}
          name={activeProfileName}
          setView={setView}
          savedIds={savedIds}
          onToggleSave={handleToggleSave}
        />
      )}
      {view === 'diligence' && <DueDiligence />}
      {view === 'submit' && <SubmitReport addReport={addReport} setView={setView} />}
      {view === 'saved' && (
        <SavedReports reports={reports} savedIds={savedIds} setView={setView} onToggleSave={handleToggleSave} />
      )}

      {view === 'listings' && (
        <ListingsBrowse
          listings={listings}
          setView={setView}
          hasMore={hasMoreListings}
          onLoadMore={loadMoreListings}
          listerUser={listerUser}
        />
      )}
      {view === 'listing-detail' && <ListingDetail listing={activeListing} setView={setView} />}
      {view === 'submit-listing' && <SubmitListing listerUser={listerUser} setView={setView} />}
      {view === 'my-listings' && <MyListings listerUser={listerUser} setView={setView} />}
      {view === 'lister-auth' && <ListerAuth setView={setView} />}

      {view !== 'submit' && <FloatingReportButton onClick={() => setView('submit')} />}
      <BottomNav view={view} setView={setView} savedCount={savedIds.length} />
    </div>
  )
}
