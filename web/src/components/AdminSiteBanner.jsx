import { useEffect, useRef, useState } from 'react'
import { Image, Upload, X } from 'lucide-react'
import { BANNER_PAGES, subscribeSiteBannerImages, uploadSiteBannerImage, clearSiteBannerImage } from '../lib/siteSettings.js'
import ConfirmDialog from './ConfirmDialog.jsx'

// The one place a real photo can end up on any page's banner (see
// index.css's --banner-image custom property, resolved per-page in
// App.jsx) — deliberately the only path, replacing the earlier
// approach of auto-pulling a listing's photo, which had no curation
// step for "suitable as a banner" specifically. Each page can have its
// own image, or fall back to "Default" for anything not set individually.
export default function AdminSiteBanner() {
  const [bannerImages, setBannerImages] = useState(undefined)
  const [pageKey, setPageKey] = useState('default')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [confirmingClear, setConfirmingClear] = useState(false)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const unsubscribe = subscribeSiteBannerImages(setBannerImages)
    return unsubscribe
  }, [])

  const currentUrl = bannerImages?.[pageKey]
  const pageLabel = BANNER_PAGES.find((p) => p.key === pageKey)?.label

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    setUploading(true)
    try {
      await uploadSiteBannerImage(pageKey, file)
    } catch (err) {
      setError('Failed to upload: ' + err.message)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  async function handleClear() {
    setConfirmingClear(false)
    try {
      await clearSiteBannerImage(pageKey)
    } catch (err) {
      alert('Failed to remove: ' + err.message)
    }
  }

  return (
    <div className="form-card">
      <p style={{ margin: '0 0 4px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
        <Image size={16} /> Page banner images
      </p>
      <p style={{ fontSize: 13, color: 'var(--ink-soft)', margin: '0 0 16px' }}>
        Each page can have its own banner photo, shown behind a dark/coral scrim. Pages without
        their own image use "Default." Nothing is pulled automatically from listings or reports —
        this is the only way a photo can appear on any banner.
      </p>

      <div className="field">
        <label htmlFor="banner-page">Page</label>
        <select id="banner-page" value={pageKey} onChange={(e) => setPageKey(e.target.value)}>
          {BANNER_PAGES.map(({ key, label }) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {bannerImages === undefined ? (
        <p style={{ color: 'var(--ink-soft)' }}>Loading...</p>
      ) : currentUrl ? (
        <div style={{ marginBottom: 16 }}>
          <div style={{ borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: 10 }}>
            <img src={currentUrl} alt="" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }} />
          </div>
          <button className="chip" onClick={() => setConfirmingClear(true)}>
            <X size={13} /> Remove this page's banner image
          </button>
        </div>
      ) : (
        <p style={{ fontSize: 13, color: 'var(--ink-faint)', marginBottom: 16 }}>
          No image set for "{pageLabel}" {pageKey !== 'default' && bannerImages?.default ? '— currently showing the Default image.' : '— currently showing the plain gradient.'}
        </p>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} disabled={uploading} />
      {uploading && <p style={{ fontSize: 12.5, color: 'var(--ink-soft)', marginTop: 8 }}>Uploading...</p>}
      {error && <p style={{ color: 'var(--status-disputed)', fontSize: 13, fontWeight: 600, marginTop: 8 }}>{error}</p>}
      <p className="field-hint" style={{ marginTop: 10 }}>
        <Upload size={12} style={{ verticalAlign: -2, marginRight: 4 }} />
        Max 10MB. Updates that page's banner immediately for everyone.
      </p>

      <ConfirmDialog
        open={confirmingClear}
        title="Remove this banner image?"
        message={`The banner image for "${pageLabel}" will be removed immediately for everyone.`}
        confirmLabel="Remove"
        onCancel={() => setConfirmingClear(false)}
        onConfirm={handleClear}
      />
    </div>
  )
}
