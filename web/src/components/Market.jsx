import { useEffect, useMemo, useState } from 'react'
import { Compass, ArrowLeft, ArrowRight, Search, Eye, EyeOff, BellRing } from 'lucide-react'
import ListingCard from './ListingCard.jsx'
import { PROPERTY_TYPE_LABELS } from '../data/propertyTypes.js'
import { NIGERIAN_STATES } from '../data/verificationRules.js'
import { getEffectiveStatus, getFlaggedAgentNames } from '../lib/listingsApi.js'
import { getReviewAggregate, getReviewsForLister } from '../lib/reviewsApi.js'
import { getCompareIds, toggleCompare, MAX_COMPARE } from '../lib/compareList.js'
import { getSavedListingIds, toggleSavedListing } from '../lib/listingWatchlist.js'
import { addListingWatch, removeListingWatch, isWatchingListingIntent } from '../lib/listingWatches.js'
import { enablePushNotifications, syncWatchedTermsIfSubscribed, getStoredPushToken } from '../lib/push.js'

const CATEGORY_STEPS = Object.entries(PROPERTY_TYPE_LABELS).map(([key, label]) => ({ key, label }))

const EMPTY_INTENT = { category: null, transactionType: 'rent', state: 'all', locationText: '', budgetMax: '' }

// The second, distinct entry point the spec calls for: Search/ListingsBrowse
// answer "has anyone reported a problem with this specific thing?" for
// someone who already knows what they're looking at; this answers "I don't
// have a specific target yet, help me find one" — a guided intake instead
// of a filter bar assuming the visitor already knows what to configure.
export default function Market({ listings, reports, setView }) {
  const flaggedAgentNames = useMemo(() => getFlaggedAgentNames(reports), [reports])
  const [step, setStep] = useState('category') // 'category' | 'location' | 'budget' | 'results'
  const [intent, setIntent] = useState(EMPTY_INTENT)
  const [compareIds, setCompareIds] = useState(() => getCompareIds())
  const [savedIds, setSavedIds] = useState(() => getSavedListingIds())
  const [reviewAggregates, setReviewAggregates] = useState({}) // listerName -> { average, count }
  const [watching, setWatching] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(() => Boolean(getStoredPushToken()))
  const [pushBusy, setPushBusy] = useState(false)

  const watchTerm = intent.locationText.trim()

  // Human-readable stand-in for the whole saved intent (category +
  // transaction type + location + budget), shown on the watch-toggle
  // button so it's clear what's actually being matched, not just the
  // location — same fields lib/listingWatches.js's listingMatchesIntent
  // checks.
  const intentSummary = [
    PROPERTY_TYPE_LABELS[intent.category]?.toLowerCase(),
    intent.transactionType === 'rent' ? 'to rent' : 'for sale',
    watchTerm && `in ${watchTerm}`,
    intent.budgetMax && `under ₦${Number(intent.budgetMax).toLocaleString()}`
  ]
    .filter(Boolean)
    .join(' ')

  useEffect(() => {
    if (step === 'results') setWatching(isWatchingListingIntent(intent))
  }, [step, intent])

  const results = useMemo(() => {
    if (step !== 'results') return []
    let list = listings.filter((l) => getEffectiveStatus(l, flaggedAgentNames) === 'active')
    if (intent.category) list = list.filter((l) => l.type === intent.category)
    list = list.filter((l) => l.transactionType === intent.transactionType)
    if (intent.state !== 'all') list = list.filter((l) => l.state === intent.state)
    if (watchTerm) {
      const q = watchTerm.toLowerCase()
      list = list.filter((l) => l.locationText?.toLowerCase().includes(q))
    }
    if (intent.budgetMax) {
      list = list.filter((l) => Number(l.price) <= Number(intent.budgetMax))
    }
    return list
  }, [step, listings, intent, watchTerm, flaggedAgentNames])

  // Batched, same eager-but-cheap pattern MyListings.jsx uses for view
  // counts — one aggregate per unique lister among the current results,
  // not per card render.
  useEffect(() => {
    if (results.length === 0) return
    const names = [...new Set(results.map((l) => l.listerName).filter(Boolean))]
    let cancelled = false
    Promise.all(
      names.map((name) =>
        getReviewsForLister(name)
          .then((reviews) => [name, getReviewAggregate(reviews)])
          .catch(() => [name, { average: null, count: 0 }])
      )
    ).then((entries) => {
      if (!cancelled) setReviewAggregates(Object.fromEntries(entries))
    })
    return () => {
      cancelled = true
    }
  }, [results])

  function handleToggleCompare(id) {
    if (!compareIds.includes(id) && compareIds.length >= MAX_COMPARE) {
      alert(`You can compare up to ${MAX_COMPARE} listings at a time. Remove one first.`)
      return
    }
    setCompareIds(toggleCompare(id))
  }

  function handleToggleSave(id) {
    setSavedIds(toggleSavedListing(id))
  }

  // The intent itself becomes the standing alert — category, transaction
  // type, and budget ceiling all carry over into the saved watch (see
  // lib/listingWatches.js), not just the location step. Category will
  // always be set by the time someone reaches 'results' (the wizard
  // requires picking one first), so there's always at least one real
  // criterion to watch even if locationText is left blank.
  function toggleWatch() {
    if (watching) {
      removeListingWatch(intent)
      setWatching(false)
    } else {
      addListingWatch(intent)
      setWatching(true)
    }
    syncWatchedTermsIfSubscribed()
  }

  async function handleEnablePush() {
    setPushBusy(true)
    try {
      await enablePushNotifications()
      setPushEnabled(true)
    } catch {
      // non-fatal — watch itself still works without push
    } finally {
      setPushBusy(false)
    }
  }

  function restart() {
    setIntent(EMPTY_INTENT)
    setStep('category')
  }

  return (
    <div className="theme-market">
      <button className="detail-back" onClick={() => setView('listings')}>
        <ArrowLeft size={15} /> Back to listings
      </button>

      <section className="hero">
        <p className="eyebrow">
          <Compass size={13} /> Market
        </p>
        <h1>Don't have a specific listing in mind yet? Tell us what you're after.</h1>
        <p>
          A few quick questions instead of a filter bar. For when you're starting a search, not
          checking a specific plot or agent you already know about.
        </p>
      </section>

      {step === 'category' && (
        <div className="form-card">
          <p style={{ fontWeight: 700, margin: '0 0 4px' }}>1. What are you looking for?</p>
          <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 16px' }}>Pick the closest match.</p>
          <div className="chip-row" style={{ marginTop: 0 }}>
            {CATEGORY_STEPS.map(({ key, label }) => (
              <button
                key={key}
                className={`chip ${intent.category === key ? 'active' : ''}`}
                onClick={() => {
                  setIntent((i) => ({ ...i, category: key }))
                  setStep('location')
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 'location' && (
        <div className="form-card">
          <p style={{ fontWeight: 700, margin: '0 0 4px' }}>2. Rent or buy, and where?</p>
          <div className="field">
            <label htmlFor="mkt-txn">For rent or for sale?</label>
            <select id="mkt-txn" value={intent.transactionType} onChange={(e) => setIntent((i) => ({ ...i, transactionType: e.target.value }))}>
              <option value="rent">For rent</option>
              <option value="sale">For sale</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="mkt-state">State</label>
            <select id="mkt-state" value={intent.state} onChange={(e) => setIntent((i) => ({ ...i, state: e.target.value }))}>
              <option value="all">Any state</option>
              {NIGERIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="mkt-location">Area (optional)</label>
            <input
              id="mkt-location"
              type="text"
              placeholder="e.g. Lekki Phase 1"
              value={intent.locationText}
              onChange={(e) => setIntent((i) => ({ ...i, locationText: e.target.value }))}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="chip" onClick={() => setStep('category')}>
              <ArrowLeft size={13} /> Back
            </button>
            <button className="chip active" onClick={() => setStep('budget')}>
              Next <ArrowRight size={13} />
            </button>
          </div>
        </div>
      )}

      {step === 'budget' && (
        <div className="form-card">
          <p style={{ fontWeight: 700, margin: '0 0 4px' }}>3. What's your budget?</p>
          <div className="field">
            <label htmlFor="mkt-budget">Maximum {intent.transactionType === 'rent' ? 'annual rent' : 'price'} (₦, optional)</label>
            <input
              id="mkt-budget"
              type="number"
              min="0"
              placeholder="Leave blank to see everything"
              value={intent.budgetMax}
              onChange={(e) => setIntent((i) => ({ ...i, budgetMax: e.target.value }))}
            />
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="chip" onClick={() => setStep('location')}>
              <ArrowLeft size={13} /> Back
            </button>
            <button className="chip active" onClick={() => setStep('results')}>
              <Search size={13} /> Show results
            </button>
          </div>
        </div>
      )}

      {step === 'results' && (
        <>
          <div className="results-meta">
            <span>{results.length} listing{results.length === 1 ? '' : 's'} match what you told us</span>
            <button className="chip" onClick={restart}>
              Start over
            </button>
          </div>

          <div className="chip-row" style={{ marginTop: 0, marginBottom: 14 }}>
            <button className={`chip ${watching ? 'active' : ''}`} onClick={toggleWatch}>
              {watching ? <EyeOff /> : <Eye />}{' '}
              {watching ? 'Stop watching' : `Save this search: notify me about new ${intentSummary} listings`}
            </button>
            {watching && !pushEnabled && (
              <button className="chip" onClick={handleEnablePush} disabled={pushBusy}>
                <BellRing /> {pushBusy ? 'Requesting...' : 'Also notify me on this device'}
              </button>
            )}
          </div>

          {results.length > 0 ? (
            <div className="listing-grid">
              {results.map((l) => (
                <ListingCard
                  key={l.id}
                  listing={l}
                  onClick={() => setView('listing-detail', l)}
                  comparing={compareIds.includes(l.id)}
                  onToggleCompare={handleToggleCompare}
                  saved={savedIds.includes(l.id)}
                  onToggleSave={handleToggleSave}
                  reviewAggregate={reviewAggregates[l.listerName]}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Compass size={28} />
              <p>Nothing matches yet. Try widening your budget or area, or browse all listings instead.</p>
              <button onClick={() => setView('listings')}>Browse all listings</button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
