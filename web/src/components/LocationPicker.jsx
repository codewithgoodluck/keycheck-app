import { useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import { MapPin, LocateFixed, X } from 'lucide-react'
import L from 'leaflet'

// Leaflet's default marker icon references image files that don't resolve
// correctly under Vite's bundler. Build a simple colored div-icon instead so
// we don't depend on those assets at all.
const pinIcon = L.divIcon({
  className: '',
  html: `<div style="
    width: 28px; height: 28px; border-radius: 50% 50% 50% 0;
    background: #d6453d; transform: rotate(-45deg);
    border: 2px solid #fff; box-shadow: 0 2px 6px rgba(0,0,0,0.3);
  "></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 28]
})

const NIGERIA_CENTER = [9.0, 8.0]

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick([e.latlng.lat, e.latlng.lng])
    }
  })
  return null
}

export default function LocationPicker({ value, onChange }) {
  const [locating, setLocating] = useState(false)

  function handleUseMyLocation() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange([pos.coords.latitude, pos.coords.longitude])
        setLocating(false)
      },
      () => setLocating(false),
      { timeout: 8000 }
    )
  }

  return (
    <div>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 8
        }}
      >
        <span style={{ fontSize: 12.5, color: 'var(--ink-soft)' }}>
          {value ? (
            <>
              <MapPin size={13} style={{ verticalAlign: -2 }} /> Pin placed — tap the map to move it
            </>
          ) : (
            'Tap the map to drop a pin on the plot (optional, but helps others find it)'
          )}
        </span>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={locating}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              fontWeight: 600,
              background: 'var(--surface)',
              border: '1px solid var(--line)',
              borderRadius: 999,
              padding: '5px 10px',
              cursor: 'pointer'
            }}
          >
            <LocateFixed size={13} /> {locating ? 'Locating...' : 'Use my location'}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange(null)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 12,
                fontWeight: 600,
                background: 'var(--surface)',
                border: '1px solid var(--line)',
                borderRadius: 999,
                padding: '5px 10px',
                cursor: 'pointer',
                color: 'var(--status-disputed)'
              }}
            >
              <X size={13} /> Clear pin
            </button>
          )}
        </div>
      </div>

      <div
        style={{
          borderRadius: 'var(--radius-sm)',
          overflow: 'hidden',
          border: '1.5px solid var(--line)',
          height: 220
        }}
      >
        <MapContainer
          center={value || NIGERIA_CENTER}
          zoom={value ? 14 : 6}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onPick={onChange} />
          {value && <Marker position={value} icon={pinIcon} />}
        </MapContainer>
      </div>
    </div>
  )
}
