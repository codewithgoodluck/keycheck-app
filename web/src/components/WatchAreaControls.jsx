import { useEffect, useState } from 'react'
import { Eye, EyeOff, BellRing } from 'lucide-react'
import { addWatch, removeWatch, isWatching } from '../lib/watches.js'
import { enablePushNotifications, syncWatchedTermsIfSubscribed, getStoredPushToken } from '../lib/push.js'

// Extracted from SearchHome.jsx so ListingsBrowse.jsx can reuse the exact
// same watch/push UI rather than duplicating it — lib/watches.js is
// already fully generic (just a lowercased term list, no report-specific
// logic), so the same watched term matches both reports and listings by
// design, not by accident.
export default function WatchAreaControls({ term }) {
  const [watching, setWatching] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(() => Boolean(getStoredPushToken()))
  const [pushBusy, setPushBusy] = useState(false)
  const [pushError, setPushError] = useState('')

  useEffect(() => {
    setWatching(isWatching(term))
  }, [term])

  function toggleWatch() {
    if (!term.trim()) return
    if (watching) {
      removeWatch(term)
      setWatching(false)
    } else {
      addWatch(term)
      setWatching(true)
    }
    syncWatchedTermsIfSubscribed()
  }

  async function handleEnablePush() {
    setPushError('')
    setPushBusy(true)
    try {
      await enablePushNotifications()
      setPushEnabled(true)
    } catch (err) {
      setPushError(err.message)
    } finally {
      setPushBusy(false)
    }
  }

  if (!term.trim()) return null

  return (
    <>
      <div className="chip-row" style={{ marginTop: 0, marginBottom: 14 }}>
        <button className={`chip ${watching ? 'active' : ''}`} onClick={toggleWatch}>
          {watching ? <EyeOff /> : <Eye />} {watching ? 'Stop watching this area' : 'Watch this area'}
        </button>
        {watching && !pushEnabled && (
          <button className="chip" onClick={handleEnablePush} disabled={pushBusy}>
            <BellRing /> {pushBusy ? 'Requesting...' : 'Also notify me on this device'}
          </button>
        )}
        {watching && pushEnabled && (
          <span className="chip" style={{ cursor: 'default' }}>
            <BellRing /> Notifications on
          </span>
        )}
      </div>
      {pushError && (
        <p style={{ color: 'var(--red)', fontSize: 12.5, fontWeight: 600, margin: '-8px 0 14px' }}>{pushError}</p>
      )}
    </>
  )
}
