import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { Search, LocateFixed, Navigation, Eye, EyeOff, FileSearch, Home } from 'lucide-react'
import { getReportTitle } from '../lib/format.js'
import { getPropertyTypeLabel } from '../data/propertyTypes.js'
import { StampInline } from './Stamp.jsx'
import { addWatch, removeWatch, isWatching } from '../lib/watches.js'
import { syncWatchedTermsIfSubscribed } from '../lib/push.js'
import { resolveStampKey } from './Stamp.jsx'
import StatusLegend from './StatusLegend.jsx'
import { getEffectiveStatus } from '../lib/listingsApi.js'

// Distinct from STATUS_COLOR (reports) so a listing pin never reads as a
// fraud-status color — listings aren't on the unverified/disputed/verified
// spectrum, they're just "active" or not shown at all here.
const LISTING_COLOR = '#2563eb'

// Kept in sync with index.css's --green/--red/--gold/--teal tokens —
// Leaflet's pathOptions need raw JS color strings, so these can't be CSS
// custom properties directly.
const STATUS_COLOR = {
  verified: '#16a34a',
  disputed: '#ef4444',
  unverified: '#eaa50d',
  clean: '#0d9488'
}

// Default view centered on Nigeria so the map is useful even before any
// search/filter narrows it down.
const NIGERIA_CENTER = [9.0, 8.0]
const NIGERIA_ZOOM = 6

function FlyTo({ center, zoom }) {
  const map = useMap()
  if (center) map.flyTo(center, zoom || 12, { duration: 0.8 })
  return null
}

export default function MapView({ reports, listings = [], setView }) {
  const [query, setQuery] = useState('')
  const [flyTarget, setFlyTarget] = useState(null)
  const [locating, setLocating] = useState(false)
  const [watching, setWatching] = useState(false)
  const [layer, setLayer] = useState('reports') // 'reports' | 'listings'

  useEffect(() => {
    setWatching(isWatching(query))
  }, [query])

  function toggleWatch() {
    if (!query.trim()) return
    if (watching) {
      removeWatch(query)
      setWatching(false)
    } else {
      addWatch(query)
      setWatching(true)
    }
    syncWatchedTermsIfSubscribed()
  }

  const geotagged = useMemo(() => reports.filter((r) => r.lat && r.lng), [reports])

  // Active-only, same rule ListingsBrowse.jsx applies — a pending/rejected
  // listing has no business showing up on the public map, and an expired
  // one is stale (see lib/listingsApi.js's getEffectiveStatus).
  const geotaggedListings = useMemo(
    () => listings.filter((l) => l.lat && l.lng && getEffectiveStatus(l) === 'active'),
    [listings]
  )

  const visible = useMemo(() => {
    if (!query.trim()) return geotagged
    const q = query.toLowerCase()
    return geotagged.filter(
      (r) =>
        r.locationText?.toLowerCase().includes(q) ||
        r.agentName?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q)
    )
  }, [geotagged, query])

  const visibleListings = useMemo(() => {
    if (!query.trim()) return geotaggedListings
    const q = query.toLowerCase()
    return geotaggedListings.filter(
      (l) => l.locationText?.toLowerCase().includes(q) || l.description?.toLowerCase().includes(q)
    )
  }, [geotaggedListings, query])

  function handleSearch(e) {
    e.preventDefault()
    const active = layer === 'reports' ? visible : visibleListings
    if (active.length > 0) {
      setFlyTarget([active[0].lat, active[0].lng])
    }
  }

  function handleLocateMe() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFlyTarget([pos.coords.latitude, pos.coords.longitude])
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 8000 }
    )
  }

  return (
    <div>
      <div className="saved-header">
        <h1>Map</h1>
        <p>
          {layer === 'reports'
            ? `${geotagged.length} of ${reports.length} reports are area-tagged. Pins mark the general neighbourhood reported, not an exact plot, since locations come from witness descriptions.`
            : `${geotaggedListings.length} of ${listings.filter((l) => getEffectiveStatus(l) === 'active').length} active listings are area-tagged.`}
        </p>
      </div>

      <div className="chip-row" style={{ marginTop: 0, marginBottom: 14 }}>
        <button className={`chip ${layer === 'reports' ? 'active' : ''}`} onClick={() => setLayer('reports')}>
          <FileSearch size={13} /> Reports
        </button>
        <button className={`chip ${layer === 'listings' ? 'active' : ''}`} onClick={() => setLayer('listings')}>
          <Home size={13} /> Listings
        </button>
      </div>

      <form onSubmit={handleSearch} className="search-bar" style={{ marginBottom: 14 }}>
        <Search size={18} />
        <input
          type="text"
          placeholder={layer === 'reports' ? 'Search the map by location or agent name' : 'Search the map by location'}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit">Go</button>
      </form>

      {layer === 'reports' && query.trim() && (
        <button className={`chip ${watching ? 'active' : ''}`} style={{ marginBottom: 14 }} onClick={toggleWatch}>
          {watching ? <EyeOff /> : <Eye />} {watching ? 'Stop watching this area' : 'Watch this area'}
        </button>
      )}

      <div
        style={{
          position: 'relative',
          borderRadius: 'var(--radius)',
          overflow: 'hidden',
          border: '1px solid var(--line)',
          boxShadow: 'var(--shadow-sm)',
          height: 480
        }}
      >
        <button
          onClick={handleLocateMe}
          disabled={locating}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12.5,
            fontWeight: 600,
            background: 'var(--surface)',
            border: '1px solid var(--line)',
            borderRadius: 999,
            padding: '8px 12px',
            cursor: 'pointer',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <LocateFixed size={14} /> {locating ? 'Locating...' : 'My location'}
        </button>

        <MapContainer center={NIGERIA_CENTER} zoom={NIGERIA_ZOOM} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FlyTo center={flyTarget} />
          {layer === 'reports' && visible.map((r) => (
            <CircleMarker
              key={r.id}
              center={[r.lat, r.lng]}
              radius={9}
              pathOptions={{
                color: STATUS_COLOR[resolveStampKey(r.status, r.kind)],
                fillColor: STATUS_COLOR[resolveStampKey(r.status, r.kind)],
                fillOpacity: 0.65,
                weight: 2
              }}
            >
              <Popup>
                <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 220 }}>
                  <div style={{ marginBottom: 6 }}>
                    <StampInline status={r.status} />
                  </div>
                  <strong style={{ fontSize: 13.5 }}>{getReportTitle(r)}</strong>
                  <p style={{ fontSize: 12.5, color: '#5b6358', margin: '6px 0 10px' }}>
                    {r.locationText}
                  </p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => setView('detail', r)}
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        background: '#15211a',
                        color: '#faf7ef',
                        border: 'none',
                        borderRadius: 999,
                        padding: '7px 14px',
                        cursor: 'pointer'
                      }}
                    >
                      View report
                    </button>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${r.lat},${r.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: '#15211a',
                        border: '1px solid #e9e2d0',
                        borderRadius: 999,
                        padding: '7px 12px',
                        textDecoration: 'none'
                      }}
                    >
                      <Navigation size={12} /> Directions
                    </a>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
          {layer === 'listings' && visibleListings.map((l) => (
            <CircleMarker
              key={l.id}
              center={[l.lat, l.lng]}
              radius={9}
              pathOptions={{ color: LISTING_COLOR, fillColor: LISTING_COLOR, fillOpacity: 0.65, weight: 2 }}
            >
              <Popup>
                <div style={{ fontFamily: 'Inter, sans-serif', maxWidth: 220 }}>
                  <strong style={{ fontSize: 13.5 }}>
                    {getPropertyTypeLabel(l.type)} — ₦{Number(l.price).toLocaleString()}
                  </strong>
                  <p style={{ fontSize: 12.5, color: '#5b6358', margin: '6px 0 10px' }}>
                    {l.locationText}, {l.state}
                  </p>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => setView('listing-detail', l)}
                      style={{
                        fontSize: 12.5,
                        fontWeight: 600,
                        background: '#15211a',
                        color: '#faf7ef',
                        border: 'none',
                        borderRadius: 999,
                        padding: '7px 14px',
                        cursor: 'pointer'
                      }}
                    >
                      View listing
                    </button>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${l.lat},${l.lng}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12.5,
                        fontWeight: 600,
                        color: '#15211a',
                        border: '1px solid #e9e2d0',
                        borderRadius: 999,
                        padding: '7px 12px',
                        textDecoration: 'none'
                      }}
                    >
                      <Navigation size={12} /> Directions
                    </a>
                  </div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>

      <div style={{ marginTop: 16 }}>
        {layer === 'reports' ? <StatusLegend /> : (
          <p style={{ fontSize: 12, color: 'var(--ink-faint)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: LISTING_COLOR, display: 'inline-block' }} />
            Active listing
          </p>
        )}
      </div>
    </div>
  )
}
